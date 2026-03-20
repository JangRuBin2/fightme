import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, createAdminClient } from '../_shared/supabase.ts';
import { spendTokens, checkTokenBalance } from '../_shared/tokens.ts';
import { callGemini, extractJson } from '../_shared/gemini.ts';
import { validateStringLength } from '../_shared/validate.ts';
import { checkPremium, getCharLimits } from '../_shared/limits.ts';

function getSingleDefenseSchema(isPremium: boolean) {
  return {
    type: 'object' as const,
    properties: {
      defense_text: { type: 'string' as const, description: isPremium ? '변론문을 상세하게 작성' : '변론문 300자 이내' },
    },
    required: ['defense_text'],
  };
}

interface DefenseSection {
  side: 'user' | 'opponent';
  text: string;
}

interface DefenseData {
  sections: DefenseSection[];
}

const PLAINTIFF_SYSTEM_PROMPT = `너는 원고 전담 변호사다. 반드시 원고의 입장만 대변해야 한다.
- 원고가 왜 정당한지 적극적으로 주장해라.
- 피고 주장의 모순점과 허점을 지적해라.
- 절대 피고의 입장에 동조하거나 원고의 잘못을 인정하지 마라.
- 감정적이 아닌 논리적으로, 하지만 강력하게 변론해라.`;

const DEFENDANT_SYSTEM_PROMPT = `너는 피고 전담 변호사다. 반드시 피고의 입장만 대변해야 한다.
- 피고가 왜 정당한지 적극적으로 주장해라.
- 원고 주장의 모순점과 허점을 지적해라.
- 절대 원고의 입장에 동조하거나 피고의 잘못을 인정하지 마라.
- 감정적이 아닌 논리적으로, 하지만 강력하게 변론해라.`;

async function generateSingleDefense(
  userClaim: string,
  opponentClaim: string,
  side: 'user' | 'opponent',
  isPremium = false,
): Promise<{ side: 'user' | 'opponent'; text: string }> {
  const isOpponent = side === 'opponent';
  const systemPrompt = isOpponent ? DEFENDANT_SYSTEM_PROMPT : PLAINTIFF_SYSTEM_PROMPT;

  const userPrompt = isOpponent
    ? `아래 싸움에서 피고를 변호해라.

[원고 주장]: ${userClaim}
[피고 주장]: ${opponentClaim}

피고의 입장이 왜 정당한지, 원고 주장의 어떤 점이 부당한지 강력하게 변론해라.`
    : `아래 싸움에서 원고를 변호해라.

[원고 주장]: ${userClaim}
[피고 주장]: ${opponentClaim}

원고의 입장이 왜 정당한지, 피고 주장의 어떤 점이 부당한지 강력하게 변론해라.`;

  const schema = getSingleDefenseSchema(isPremium);
  const text = await callGemini({
    systemPrompt,
    userPrompt,
    maxTokens: isPremium ? 8192 : 4096,
    responseSchema: schema,
  });
  const parsed = extractJson<{ defense_text: string }>(text, schema);
  return { side, text: parsed.defense_text };
}

async function generateAIDefense(
  userClaim: string,
  opponentClaim: string,
  defenseSide: string,
  isPremium = false,
): Promise<DefenseData> {
  if (defenseSide === 'both') {
    const [userDefense, opponentDefense] = await Promise.all([
      generateSingleDefense(userClaim, opponentClaim, 'user', isPremium),
      generateSingleDefense(userClaim, opponentClaim, 'opponent', isPremium),
    ]);
    return {
      sections: [userDefense, opponentDefense],
    };
  }

  const side = defenseSide === 'opponent' ? 'opponent' as const : 'user' as const;
  const defense = await generateSingleDefense(userClaim, opponentClaim, side, isPremium);
  return {
    sections: [defense],
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
    const isPremium = await checkPremium(supabaseAdmin, user.id);
    const charLimits = getCharLimits(isPremium);

    if (defense_type === 'self') {
      const lengthError = validateStringLength(defense_text, '변론 내용', charLimits.defenseSelf);
      if (lengthError) {
        return new Response(
          JSON.stringify({ error: lengthError }),
          { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }
    }

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

    // Check balance first (spend after success)
    if (defense_type === 'ai') {
      const canAfford = await checkTokenBalance(supabaseAdmin, user.id, 5);
      if (!canAfford) {
        return new Response(
          JSON.stringify({ error: '토큰이 부족합니다', code: 'INSUFFICIENT_TOKENS' }),
          { status: 402, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }
    }

    const side = defense_side || 'user';
    let defenseData: DefenseData;

    if (defense_type === 'ai') {
      defenseData = await generateAIDefense(fight.user_claim, fight.opponent_claim, side, isPremium);
    } else if (side === 'both') {
      // 직접 변호 양쪽: defense_text에 JSON { user, opponent } 형태로 전달됨
      try {
        const parsed = JSON.parse(defense_text);
        defenseData = {
          sections: [
            { side: 'user', text: String(parsed.user || '') },
            { side: 'opponent', text: String(parsed.opponent || '') },
          ].filter((s) => s.text.trim().length > 0),
        };
      } catch {
        // JSON 파싱 실패 시 user side로 저장
        defenseData = { sections: [{ side: 'user', text: defense_text }] };
      }
    } else {
      const selfSide = side === 'opponent' ? 'opponent' as const : 'user' as const;
      defenseData = {
        sections: [{ side: selfSide, text: defense_text }],
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

    // All succeeded — now spend tokens (AI only)
    let newBalance: number | null = null;
    if (defense_type === 'ai') {
      newBalance = await spendTokens(supabaseAdmin, user.id, 5, 'FIGHT_DEFENSE_AI');
    } else {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('token')
        .eq('id', user.id)
        .single();
      newBalance = profile?.token ?? 0;
    }

    return new Response(
      JSON.stringify({
        success: true,
        defense: defenseData,
        defense_text: defenseData.sections.map((s) => s.text).join('\n\n'),
        fight: updatedFight,
        tokenBalance: newBalance ?? 0,
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
