import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, createAdminClient } from '../_shared/supabase.ts';
import { spendTokens } from '../_shared/tokens.ts';
import { callGemini, extractJson } from '../_shared/gemini.ts';
import type { DefenseResponse } from '../_shared/types.ts';

async function generateAIDefense(userClaim: string, opponentClaim: string): Promise<string> {
  const userPrompt = `너는 유능한 AI 변호사다. 의뢰인의 입장을 최대한 변호해야 한다.
[의뢰인 주장]: ${userClaim}
[상대방 주장]: ${opponentClaim}
반드시 아래 JSON 형식으로만 응답해.
{"defense_text":"변론문 200자 이내, 설득력 있게"}`;

  const text = await callGemini({ userPrompt, maxTokens: 1024 });
  const parsed = extractJson<DefenseResponse>(text);
  return parsed.defense_text;
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

    const { fight_id, defense_type, defense_text } = await req.json();

    if (!fight_id || !defense_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: fight_id, defense_type' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (defense_type !== 'ai' && defense_type !== 'self') {
      return new Response(
        JSON.stringify({ error: 'defense_type must be "ai" or "self"' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (defense_type === 'self' && !defense_text) {
      return new Response(
        JSON.stringify({ error: 'defense_text is required for self defense' }),
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

    // Spend tokens: AI defense = 2, self defense = 1
    const tokenCost = defense_type === 'ai' ? 2 : 1;
    const tokenReason = defense_type === 'ai' ? 'FIGHT_DEFENSE_AI' : 'FIGHT_DEFENSE_SELF';
    const newBalance = await spendTokens(supabaseAdmin, user.id, tokenCost, tokenReason);
    if (newBalance === null) {
      return new Response(
        JSON.stringify({ error: '토큰이 부족합니다', code: 'INSUFFICIENT_TOKENS' }),
        { status: 402, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    let finalDefenseText = defense_text;

    if (defense_type === 'ai') {
      finalDefenseText = await generateAIDefense(fight.user_claim, fight.opponent_claim);
    }

    // Update fight with defense
    const { data: updatedFight, error: updateError } = await supabaseAdmin
      .from('fights')
      .update({ defense: finalDefenseText })
      .eq('id', fight.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update fight: ${updateError?.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        defense_text: finalDefenseText,
        fight: updatedFight,
        tokenBalance: newBalance,
      }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('fight-defense error:', err);
    return new Response(
      JSON.stringify({ error: '변론 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
