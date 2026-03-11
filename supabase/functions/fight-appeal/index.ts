import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, createAdminClient } from '../_shared/supabase.ts';
import { spendTokens } from '../_shared/tokens.ts';
import type { JudgmentResponse } from '../_shared/types.ts';

function buildAppealUserPrompt(
  judge: { name: string },
  userClaim: string,
  opponentClaim: string,
  originalFight: { user_fault: number; opponent_fault: number; comment: string; verdict_detail: string | null },
  defense: string | null
): string {
  let prompt = `너는 "${judge.name}" 판사다.

이것은 항소심이다. 원심 판결을 검토하고, 변론이 있다면 이를 고려하여 재판결해라.

[원고 주장]: ${userClaim}
[피고 주장]: ${opponentClaim}

[원심 판결]:
- 원고 과실: ${originalFight.user_fault}%
- 피고 과실: ${originalFight.opponent_fault}%
- 판결: ${originalFight.comment}
- 이유: ${originalFight.verdict_detail || '없음'}`;

  if (defense) {
    prompt += `\n\n[원고측 변론]: ${defense}`;
  }

  prompt += `\n\n반드시 아래 JSON 형식으로만 응답해. 다른 텍스트는 절대 포함하지 마.
{"user_fault":0-100,"opponent_fault":0-100,"comment":"한줄 판결 40자 이내","verdict_detail":"판결 이유 200자 이내"}

주의: user_fault + opponent_fault = 100. 캐릭터에 맞는 말투로 재미있게 판결해라. 변론 내용이 타당하다면 판결을 수정해도 된다.`;

  return prompt;
}

async function callClaude(systemPrompt: string, userPrompt: string): Promise<JudgmentResponse> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) {
    throw new Error('Empty response from Claude API');
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse JSON from Claude response');
  }

  return JSON.parse(jsonMatch[0]) as JudgmentResponse;
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

    const { fight_id, judge_id } = await req.json();

    if (!fight_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: fight_id' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Get fight
    const { data: fight, error: fightError } = await supabaseAdmin
      .from('fights')
      .select('*')
      .eq('id', fight_id)
      .eq('user_id', user.id)
      .single();

    if (fightError || !fight) {
      return new Response(
        JSON.stringify({ error: 'Fight not found' }),
        { status: 404, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (fight.stage === 'APPEAL') {
      return new Response(
        JSON.stringify({ error: 'This fight has already been appealed' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Spend 2 tokens
    const newBalance = await spendTokens(supabaseAdmin, user.id, 2, 'FIGHT_APPEAL');
    if (newBalance === null) {
      return new Response(
        JSON.stringify({ error: '토큰이 부족합니다', code: 'INSUFFICIENT_TOKENS' }),
        { status: 402, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Use different judge if specified
    const appealJudgeId = judge_id || fight.judge_id;

    const { data: judge, error: judgeError } = await supabaseAdmin
      .from('judges')
      .select('*')
      .eq('id', appealJudgeId)
      .single();

    if (judgeError || !judge) {
      return new Response(
        JSON.stringify({ error: 'Judge not found' }),
        { status: 404, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Call Claude API for appeal
    const userPrompt = buildAppealUserPrompt(
      judge,
      fight.user_claim,
      fight.opponent_claim,
      fight,
      fight.defense
    );
    const judgment = await callClaude(judge.prompt, userPrompt);

    // Update fight directly with new verdict
    const { data: updatedFight, error: updateError } = await supabaseAdmin
      .from('fights')
      .update({
        stage: 'APPEAL',
        judge_id: appealJudgeId,
        user_fault: judgment.user_fault,
        opponent_fault: judgment.opponent_fault,
        comment: judgment.comment,
        verdict_detail: judgment.verdict_detail,
        is_revealed: false,
      })
      .eq('id', fight.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update fight: ${updateError?.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, fight: updatedFight, tokenBalance: newBalance }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('fight-appeal error:', err);
    return new Response(
      JSON.stringify({ error: '항소심 판결 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
