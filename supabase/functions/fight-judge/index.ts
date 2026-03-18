import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, createAdminClient } from '../_shared/supabase.ts';
import { spendTokens } from '../_shared/tokens.ts';
import { callGemini, extractJson } from '../_shared/gemini.ts';
import { validateInputs } from '../_shared/validate.ts';
import type { JudgmentResponse } from '../_shared/types.ts';

const JUDGE_COST = 3;

const JUDGMENT_SCHEMA = {
  type: 'object' as const,
  properties: {
    user_fault: { type: 'integer' as const, description: '원고 과실 비율 0-100' },
    opponent_fault: { type: 'integer' as const, description: '피고 과실 비율 0-100' },
    comment: { type: 'string' as const, description: '한줄 판결 50자 이내' },
    verdict_detail: { type: 'string' as const, description: '판결 이유 2~3문장, 300자 이내' },
  },
  required: ['user_fault', 'opponent_fault', 'comment', 'verdict_detail'],
};

function buildUserPrompt(
  judge: { name: string; prompt: string },
  userClaim: string,
  opponentClaim: string,
  userName: string,
  opponentName: string,
): string {
  return `너는 "${judge.name}" 판사다.

아래 싸움을 판결해라.

[원고(${userName}) 주장]: ${userClaim}
[피고(${opponentName}) 주장]: ${opponentClaim}

판결할 때 원고를 "${userName}", 피고를 "${opponentName}"이라고 불러라.
주의: user_fault + opponent_fault = 100. 캐릭터에 맞는 말투로 재미있게 판결해라.`;
}

async function getJudgment(systemPrompt: string, userPrompt: string): Promise<JudgmentResponse> {
  const text = await callGemini({
    systemPrompt,
    userPrompt,
    maxTokens: 4096,
    responseSchema: JUDGMENT_SCHEMA,
  });
  return extractJson<JudgmentResponse>(text, JUDGMENT_SCHEMA);
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

    const { user_claim, opponent_claim, judge_id, user_name, opponent_name } = await req.json();

    if (!user_claim || !opponent_claim || !judge_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_claim, opponent_claim, judge_id' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const inputError = validateInputs([
      { value: user_claim, field: '내 주장', max: 200 },
      { value: opponent_claim, field: '상대 주장', max: 200 },
      { value: user_name, field: '내 이름', max: 20, required: false },
      { value: opponent_name, field: '상대 이름', max: 20, required: false },
    ]);
    if (inputError) {
      return new Response(
        JSON.stringify({ error: inputError }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Get judge data
    const { data: judge, error: judgeError } = await supabaseAdmin
      .from('judges')
      .select('*')
      .eq('id', judge_id)
      .single();

    if (judgeError || !judge) {
      return new Response(
        JSON.stringify({ error: 'Judge not found' }),
        { status: 404, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Ensure profile exists (fights.user_id references profiles.id)
    await supabaseAdmin.from('profiles').upsert(
      { id: user.id, updated_at: new Date().toISOString() },
      { onConflict: 'id', ignoreDuplicates: true }
    );

    // Spend 3 tokens for judgment
    const newBalance = await spendTokens(supabaseAdmin, user.id, JUDGE_COST, 'FIGHT_JUDGE');
    if (newBalance === null) {
      return new Response(
        JSON.stringify({ error: '토큰이 부족합니다 (3개 필요)', code: 'INSUFFICIENT_TOKENS' }),
        { status: 402, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Call Gemini API
    const systemPrompt = judge.prompt;
    const userName = user_name || '원고';
    const opponentNameStr = opponent_name || '피고';
    const userPrompt = buildUserPrompt(judge, user_claim, opponent_claim, userName, opponentNameStr);
    const judgment = await getJudgment(systemPrompt, userPrompt);

    // Validate fault sum = 100
    const faultSum = judgment.user_fault + judgment.opponent_fault;
    if (faultSum !== 100) {
      const ratio = 100 / faultSum;
      judgment.user_fault = Math.round(judgment.user_fault * ratio);
      judgment.opponent_fault = 100 - judgment.user_fault;
    }

    // Create fight record with verdict data merged
    const { data: fight, error: fightError } = await supabaseAdmin
      .from('fights')
      .insert({
        user_id: user.id,
        judge_id,
        user_name: user_name || null,
        opponent_name: opponent_name || null,
        user_claim,
        opponent_claim,
        user_fault: judgment.user_fault,
        opponent_fault: judgment.opponent_fault,
        comment: judgment.comment,
        verdict_detail: judgment.verdict_detail,
        stage: 'INITIAL',
        is_revealed: true,
      })
      .select()
      .single();

    if (fightError || !fight) {
      throw new Error(`Failed to create fight: ${fightError?.message}`);
    }

    // Increment judge usage_count
    const { error: usageError } = await supabaseAdmin
      .from('judges')
      .update({ usage_count: judge.usage_count + 1 })
      .eq('id', judge_id);
    if (usageError) {
      console.warn('Failed to increment judge usage_count:', usageError.message);
    }

    return new Response(
      JSON.stringify({ success: true, fight }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('fight-judge error:', err);
    return new Response(
      JSON.stringify({ error: '판결 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
