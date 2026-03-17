import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, createAdminClient } from '../_shared/supabase.ts';
import { spendTokens } from '../_shared/tokens.ts';
import { callGemini, extractJson } from '../_shared/gemini.ts';

const SINGLE_DEFENSE_SCHEMA = {
  type: 'object' as const,
  properties: {
    defense_text: { type: 'string' as const, description: '변론문 300자 이내' },
  },
  required: ['defense_text'],
};

const BOTH_DEFENSE_SCHEMA = {
  type: 'object' as const,
  properties: {
    user_defense: { type: 'string' as const, description: '원고 변론문 200자 이내' },
    opponent_defense: { type: 'string' as const, description: '피고 변론문 200자 이내' },
  },
  required: ['user_defense', 'opponent_defense'],
};

interface DefenseSection {
  side: 'user' | 'opponent';
  text: string;
}

interface DefenseData {
  sections: DefenseSection[];
}

async function generateAIDefense(
  userClaim: string,
  opponentClaim: string,
  defenseSide: string,
): Promise<DefenseData> {
  if (defenseSide === 'both') {
    const userPrompt = `너는 유능한 AI 변호사다. 원고와 피고 각각의 입장을 따로 변호해야 한다.

[원고 주장]: ${userClaim}
[피고 주장]: ${opponentClaim}

원고 편 변론과 피고 편 변론을 각각 작성해라. 각각 상대방보다 덜 잘못한 이유를 설득력 있게 주장해야 한다.`;

    const text = await callGemini({
      userPrompt,
      maxTokens: 4096,
      responseSchema: BOTH_DEFENSE_SCHEMA,
    });
    const parsed = extractJson<{ user_defense: string; opponent_defense: string }>(text, BOTH_DEFENSE_SCHEMA);
    return {
      sections: [
        { side: 'user', text: parsed.user_defense },
        { side: 'opponent', text: parsed.opponent_defense },
      ],
    };
  }

  const isOpponent = defenseSide === 'opponent';
  const userPrompt = isOpponent
    ? `너는 유능한 AI 변호사다. 피고(상대방)의 입장을 최대한 변호해야 한다.
[원고 주장]: ${userClaim}
[피고 주장]: ${opponentClaim}
피고의 입장에서 왜 피고가 덜 잘못했는지 설득력 있게 변론해라.`
    : `너는 유능한 AI 변호사다. 의뢰인(원고)의 입장을 최대한 변호해야 한다.
[의뢰인 주장]: ${userClaim}
[상대방 주장]: ${opponentClaim}
의뢰인의 입장에서 왜 의뢰인이 덜 잘못했는지 설득력 있게 변론해라.`;

  const text = await callGemini({
    userPrompt,
    maxTokens: 4096,
    responseSchema: SINGLE_DEFENSE_SCHEMA,
  });
  const parsed = extractJson<{ defense_text: string }>(text, SINGLE_DEFENSE_SCHEMA);
  return {
    sections: [
      { side: isOpponent ? 'opponent' : 'user', text: parsed.defense_text },
    ],
  };
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

    const { fight_id, defense_type, defense_text, defense_side } = await req.json();

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

    // Spend tokens: AI defense = 5, self defense = free
    let newBalance: number | null = null;
    if (defense_type === 'ai') {
      newBalance = await spendTokens(supabaseAdmin, user.id, 5, 'FIGHT_DEFENSE_AI');
      if (newBalance === null) {
        return new Response(
          JSON.stringify({ error: '토큰이 부족합니다', code: 'INSUFFICIENT_TOKENS' }),
          { status: 402, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }
    } else {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('token')
        .eq('id', user.id)
        .single();
      newBalance = profile?.token ?? 0;
    }

    const side = defense_side || 'user';
    let defenseData: DefenseData;

    if (defense_type === 'ai') {
      defenseData = await generateAIDefense(fight.user_claim, fight.opponent_claim, side);
    } else {
      defenseData = {
        sections: [
          { side: side === 'opponent' ? 'opponent' : 'user', text: defense_text },
        ],
      };
    }

    // Update fight with structured defense JSON
    const { data: updatedFight, error: updateError } = await supabaseAdmin
      .from('fights')
      .update({ defense: defenseData })
      .eq('id', fight.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update fight: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        defense: defenseData,
        defense_text: defenseData.sections.map((s) => s.text).join('\n\n'),
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
