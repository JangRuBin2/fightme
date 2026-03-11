import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createPublicClient } from '../_shared/supabase.ts';

// No authentication required - public endpoint for shared results
Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { fight_id } = await req.json();

    if (!fight_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: fight_id' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createPublicClient();

    // Only get revealed fights (public RLS policy)
    const { data: fight, error } = await supabase
      .from('fights')
      .select('id, user_claim, opponent_claim, user_fault, opponent_fault, comment, stage, judge_id, created_at')
      .eq('id', fight_id)
      .eq('is_revealed', true)
      .single();

    if (error || !fight) {
      return new Response(
        JSON.stringify({ error: 'Fight not found or not public' }),
        { status: 404, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Get judge info
    const { data: judge } = await supabase
      .from('judges')
      .select('id, name, description')
      .eq('id', fight.judge_id)
      .single();

    return new Response(
      JSON.stringify({ success: true, fight, judge }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('fight-public error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
