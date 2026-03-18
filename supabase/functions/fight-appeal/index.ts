import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, createAdminClient } from '../_shared/supabase.ts';
import { spendTokens, checkTokenBalance } from '../_shared/tokens.ts';
import { callGemini, extractJson } from '../_shared/gemini.ts';
import type { JudgmentResponse } from '../_shared/types.ts';

interface DefenseSection {
  side: 'user' | 'opponent';
  text: string;
}

interface DefenseData {
  sections: DefenseSection[];
}

function formatDefenseForPrompt(defense: DefenseData | null): string {
  if (!defense || !defense.sections || defense.sections.length === 0) return '';

  const parts: string[] = [];
  for (const section of defense.sections) {
    const label = section.side === 'user' ? '원고' : '피고';
    parts.push(`[${label} 측 변론]: ${section.text}`);
  }
  return '\n\n' + parts.join('\n\n');
}

function buildAppealUserPrompt(
  judge: { name: string },
  userClaim: string,
  opponentClaim: string,
  originalFight: { user_fault: number; opponent_fault: number; comment: string; verdict_detail: string | null },
  defense: DefenseData | null,
  userName: string,
  opponentName: string,
): string {
  let prompt = `너는 "${judge.name}" 판사다.

이것은 항소심이다. 원심 판결을 검토하고, 변론이 있다면 이를 고려하여 재판결해라.

[${userName}(원고) 주장]: ${userClaim}
[${opponentName}(피고) 주장]: ${opponentClaim}

[원심 판결]:
- ${userName} 과실: ${originalFight.user_fault}%
- ${opponentName} 과실: ${originalFight.opponent_fault}%
- 판결: ${originalFight.comment}
- 이유: ${originalFight.verdict_detail || '없음'}`;

  const defenseText = formatDefenseForPrompt(defense);
  if (defenseText) {
    prompt += defenseText;
  }

  prompt += `\n\n판결할 때 원고를 "${userName}", 피고를 "${opponentName}"이라고 불러라.
주의: user_fault + opponent_fault = 100. 캐릭터에 맞는 말투로 재미있게 판결해라. 변론 내용이 타당하다면 판결을 수정해도 된다.`;

  return prompt;
}

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

async function getJudgment(systemPrompt: string, userPrompt: string): Promise<JudgmentResponse> {
  const text = await callGemini({ systemPrompt, userPrompt, maxTokens: 4096, responseSchema: JUDGMENT_SCHEMA });
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

    // Check balance first (spend after success)
    const canAfford = await checkTokenBalance(supabaseAdmin, user.id, 5);
    if (!canAfford) {
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

    // Parse defense from jsonb
    const defenseData: DefenseData | null = fight.defense ?? null;
    const userName = fight.user_name || '원고';
    const opponentName = fight.opponent_name || '피고';

    // Call Gemini API for appeal
    const userPrompt = buildAppealUserPrompt(
      judge,
      fight.user_claim,
      fight.opponent_claim,
      fight,
      defenseData,
      userName,
      opponentName,
    );
    const judgment = await getJudgment(judge.prompt, userPrompt);

    // Validate fault sum = 100
    const faultSum = judgment.user_fault + judgment.opponent_fault;
    if (faultSum !== 100) {
      const ratio = 100 / faultSum;
      judgment.user_fault = Math.round(judgment.user_fault * ratio);
      judgment.opponent_fault = 100 - judgment.user_fault;
    }

    // Save original verdict before overwriting
    const originalVerdict = {
      judge_id: fight.judge_id,
      user_fault: fight.user_fault,
      opponent_fault: fight.opponent_fault,
      comment: fight.comment,
      verdict_detail: fight.verdict_detail,
      defense: fight.defense,
    };

    // Update fight with new verdict
    const { data: updatedFight, error: updateError } = await supabaseAdmin
      .from('fights')
      .update({
        stage: 'APPEAL',
        judge_id: appealJudgeId,
        user_fault: judgment.user_fault,
        opponent_fault: judgment.opponent_fault,
        comment: judgment.comment,
        verdict_detail: judgment.verdict_detail,
        original_verdict: originalVerdict,
        is_revealed: true,
      })
      .eq('id', fight.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update fight: ${updateError.message}`);
    }

    // All succeeded — now spend tokens
    const newBalance = await spendTokens(supabaseAdmin, user.id, 5, 'FIGHT_APPEAL');

    return new Response(
      JSON.stringify({ success: true, fight: updatedFight, tokenBalance: newBalance ?? 0 }),
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
