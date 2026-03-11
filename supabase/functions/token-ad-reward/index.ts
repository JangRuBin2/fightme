import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, createAdminClient } from '../_shared/supabase.ts';
import { grantTokens } from '../_shared/tokens.ts';

const AD_REWARD_AMOUNT = 3;

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

    const supabaseAdmin = createAdminClient();

    // Grant tokens for watching ad
    const newBalance = await grantTokens(supabaseAdmin, user.id, AD_REWARD_AMOUNT, 'AD_REWARD');

    if (newBalance === null) {
      throw new Error('Failed to grant tokens');
    }

    return new Response(
      JSON.stringify({
        success: true,
        amount: AD_REWARD_AMOUNT,
        tokenBalance: newBalance,
      }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('token-ad-reward error:', err);
    return new Response(
      JSON.stringify({ error: '토큰 지급 중 오류가 발생했습니다.' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
