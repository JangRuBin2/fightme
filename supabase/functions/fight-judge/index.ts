import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, createAdminClient } from '../_shared/supabase.ts';
import { spendTokens } from '../_shared/tokens.ts';
import { callGemini, extractJson } from '../_shared/gemini.ts';
import type { JudgmentResponse } from '../_shared/types.ts';

function buildUserPrompt(
  judge: { name: string; prompt: string },
  userClaim: string,
  opponentClaim: string
): string {
  return `너는 "${judge.name}" 판사다.

아래 싸움을 판결해라.

[원고 주장]: ${userClaim}
[피고 주장]: ${opponentClaim}

반드시 아래 JSON 형식으로만 응답해. 다른 텍스트는 절대 포함하지 마.
{"user_fault":0-100,"opponent_fault":0-100,"comment":"한줄 판결 40자 이내","verdict_detail":"판결 이유 200자 이내"}

주의: user_fault + opponent_fault = 100. 캐릭터에 맞는 말투로 재미있게 판결해라.`;
}

async function getJudgment(systemPrompt: string, userPrompt: string): Promise<JudgmentResponse> {
  const text = await callGemini({ systemPrompt, userPrompt, maxTokens: 1024 });
  const parsed = extractJson<JudgmentResponse>(text);

  if (
    typeof parsed.user_fault !== 'number' ||
    typeof parsed.opponent_fault !== 'number' ||
    typeof parsed.comment !== 'string' ||
    typeof parsed.verdict_detail !== 'string'
  ) {
    throw new Error('Invalid judgment response structure');
  }

  return parsed;
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

    const { user_claim, opponent_claim, judge_id } = await req.json();

    if (!user_claim || !opponent_claim || !judge_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_claim, opponent_claim, judge_id' }),
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

    // Call Gemini API
    const systemPrompt = judge.prompt;
    const userPrompt = buildUserPrompt(judge, user_claim, opponent_claim);
    const judgment = await getJudgment(systemPrompt, userPrompt);

    // Create fight record with verdict data merged
    const { data: fight, error: fightError } = await supabaseAdmin
      .from('fights')
      .insert({
        user_id: user.id,
        judge_id,
        user_claim,
        opponent_claim,
        user_fault: judgment.user_fault,
        opponent_fault: judgment.opponent_fault,
        comment: judgment.comment,
        verdict_detail: judgment.verdict_detail,
        stage: 'INITIAL',
        is_revealed: false,
      })
      .select()
      .single();

    if (fightError || !fight) {
      throw new Error(`Failed to create fight: ${fightError?.message}`);
    }

    // Increment judge usage_count
    await supabaseAdmin
      .from('judges')
      .update({ usage_count: judge.usage_count + 1 })
      .eq('id', judge_id)
      .catch(() => {
        console.warn('Failed to increment judge usage_count');
      });

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
