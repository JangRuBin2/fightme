import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, createAdminClient } from '../_shared/supabase.ts';
import { spendTokens } from '../_shared/tokens.ts';

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

    const { fight_id } = await req.json();

    if (!fight_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: fight_id' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Verify ownership
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

    // Spend 1 token
    const newBalance = await spendTokens(supabaseAdmin, user.id, 1, 'FIGHT_DETAIL');
    if (newBalance === null) {
      return new Response(
        JSON.stringify({ error: '토큰이 부족합니다', code: 'INSUFFICIENT_TOKENS' }),
        { status: 402, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        verdict_detail: fight.verdict_detail,
        tokenBalance: newBalance,
      }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('fight-detail error:', err);
    return new Response(
      JSON.stringify({ error: '상세 보기 중 오류가 발생했습니다.' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
