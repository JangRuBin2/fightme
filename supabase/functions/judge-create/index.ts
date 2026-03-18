import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, createAdminClient } from '../_shared/supabase.ts';
import { spendTokens, checkTokenBalance } from '../_shared/tokens.ts';
import { callGemini, extractJson } from '../_shared/gemini.ts';
import { validateInputs } from '../_shared/validate.ts';

const JUDGE_CREATE_COST = 100;

// Banned terms filter
const BANNED_PATTERNS = [
  // 혐오/비하 용어
  /딱\s*좋노/i, /이기야/i, /노\s*알라/i, /충이/i, /홍어/i, /틀딱/i,
  /한남충/i, /한녀충/i, /김치녀/i, /된장녀/i, /맘충/i,
  // 성적 용어
  /섹스/i, /성관계/i, /자위/i, /음경/i, /질\s*삽입/i, /페니스/i, /보지/i,
  /자지/i, /씹/i, /좆/i, /딸딸이/i, /야동/i, /포르노/i,
  // 극단적 혐오
  /느금마/i, /니애미/i, /시발/i, /씨발/i, /병신/i, /장애인.*비하/i,
];

function checkBannedTerms(text: string): string | null {
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(text)) {
      return '부적절한 표현이 포함되어 있습니다. 수정 후 다시 시도해주세요.';
    }
  }
  return null;
}

const REVIEW_SCHEMA = {
  type: 'object' as const,
  properties: {
    approved: { type: 'boolean' as const, description: '승인 여부' },
    reason: { type: 'string' as const, description: '승인/거절 이유 50자 이내' },
  },
  required: ['approved', 'reason'],
};

const GENERATE_SCHEMA = {
  type: 'object' as const,
  properties: {
    prompt: { type: 'string' as const, description: '판사 시스템 프롬프트 200자 이내' },
    description: { type: 'string' as const, description: '판사 한줄 소개 30자 이내' },
  },
  required: ['prompt', 'description'],
};

async function generateJudgePrompt(data: {
  name: string;
  speechStyle: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
}): Promise<{ prompt: string; description: string }> {
  const userPrompt = `다음 정보를 기반으로 판사 캐릭터의 시스템 프롬프트와 한줄 설명을 만들어줘.

이름: ${data.name}
말투 스타일: ${data.speechStyle}
Q1 (갈등 접근법): ${data.q1}
Q2 (중시하는 것): ${data.q2}
Q3 (판결 스타일): ${data.q3}
Q4 (특징): ${data.q4}
Q5 (한마디 스타일): ${data.q5}

말투 스타일에 맞게 프롬프트를 작성해. 사용자가 입력한 말투를 최대한 반영해야 한다.`;

  const text = await callGemini({
    userPrompt,
    maxTokens: 4096,
    responseSchema: GENERATE_SCHEMA,
  });
  return extractJson<{ prompt: string; description: string }>(text, GENERATE_SCHEMA);
}

async function reviewJudge(name: string, description: string, prompt: string): Promise<{ approved: boolean; reason: string }> {
  const reviewPrompt = `다음 AI 판사 캐릭터를 검토해주세요.

이름: ${name}
설명: ${description}
프롬프트: ${prompt}

이 판사는 커플/친구 간 갈등을 재미있게 판결하는 엔터테인먼트 캐릭터입니다.
유머러스하거나 장난스러운 표현, 인터넷 밈, 사투리, 반말 등은 전혀 문제 없습니다.

아래 경우에만 거절(approved: false)하세요:
- 특정 지역/성별/인종을 비하하는 심각한 혐오 표현
- 노골적인 성적 묘사
- 폭력을 직접적으로 조장하는 내용
- 특정 커뮤니티 기반의 혐오/비하 용어

위에 해당하지 않으면 반드시 approved: true로 응답하세요.`;

  const text = await callGemini({
    userPrompt: reviewPrompt,
    maxTokens: 1024,
    responseSchema: REVIEW_SCHEMA,
  });
  return extractJson<{ approved: boolean; reason: string }>(text, REVIEW_SCHEMA);
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createSupabaseClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { name, speech_style, q1, q2, q3, q4, q5 } = body;

    if (!name || !speech_style || !q1 || !q2 || !q3 || !q4 || !q5) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const inputError = validateInputs([
      { value: name, field: '판사 이름', max: 5 },
      { value: speech_style, field: '말투 스타일', max: 200 },
      { value: q1, field: '답변1', max: 100 },
      { value: q2, field: '답변2', max: 100 },
      { value: q3, field: '답변3', max: 100 },
      { value: q4, field: '답변4', max: 100 },
      { value: q5, field: '답변5', max: 100 },
    ]);
    if (inputError) {
      return new Response(
        JSON.stringify({ error: inputError }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Check banned terms BEFORE spending tokens
    const allText = `${name} ${speech_style}`;
    const bannedError = checkBannedTerms(allText);
    if (bannedError) {
      return new Response(
        JSON.stringify({ error: bannedError, code: 'INAPPROPRIATE_CONTENT' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Step 2: Ensure profile exists
    await supabaseAdmin.from('profiles').upsert(
      { id: user.id, updated_at: new Date().toISOString() },
      { onConflict: 'id', ignoreDuplicates: true }
    );

    // Step 3: Check balance (spend after success)
    const canAfford = await checkTokenBalance(supabaseAdmin, user.id, JUDGE_CREATE_COST);
    if (!canAfford) {
      return new Response(
        JSON.stringify({ error: `토큰이 부족합니다 (${JUDGE_CREATE_COST}개 필요)`, code: 'INSUFFICIENT_TOKENS' }),
        { status: 402, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Generate judge prompt
    const { prompt, description } = await generateJudgePrompt({
      name, speechStyle: speech_style, q1, q2, q3, q4, q5,
    });

    // Step 5: Immediate AI review
    const review = await reviewJudge(name, description, prompt);

    // Step 6: Insert judge
    const { data: judge, error: judgeError } = await supabaseAdmin
      .from('judges')
      .insert({
        name,
        description: description?.slice(0, 30) || null,
        prompt,
        is_user_created: true,
        is_approved: review.approved,
        reject_reason: review.approved ? null : (review.reason || 'AI 검토 거절'),
        created_by: user.id,
      })
      .select()
      .single();

    if (judgeError) {
      throw new Error(`Failed to create judge: ${judgeError.message}`);
    }

    // All succeeded — now spend tokens
    const newBalance = await spendTokens(supabaseAdmin, user.id, JUDGE_CREATE_COST, 'JUDGE_CREATE');

    return new Response(
      JSON.stringify({
        success: true,
        judge,
        approved: review.approved,
        reviewReason: review.reason,
        tokenBalance: newBalance ?? 0,
      }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('judge-create error:', err);
    return new Response(
      JSON.stringify({ error: '판사 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
