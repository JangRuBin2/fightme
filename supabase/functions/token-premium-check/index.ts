import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, createAdminClient } from '../_shared/supabase.ts';
import { checkAndGrantPremiumMonthly } from '../_shared/tokens.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ granted: false }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createSupabaseClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ granted: false }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createAdminClient();
    const result = await checkAndGrantPremiumMonthly(supabaseAdmin, user.id);

    return new Response(
      JSON.stringify({
        granted: result !== null,
        tokenBalance: result?.newBalance ?? null,
        grantedAmount: result?.grantedAmount ?? 0,
      }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('token-premium-check error:', err);
    return new Response(
      JSON.stringify({ granted: false }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
