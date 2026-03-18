import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, createAdminClient } from '../_shared/supabase.ts';

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
    const userId = user.id;

    // Hard-delete user data (fights, token_logs, judge_votes)
    const tablesToClean = ['token_logs', 'judge_votes', 'fights'];
    for (const table of tablesToClean) {
      const { error } = await supabaseAdmin.from(table).delete().eq('user_id', userId);
      if (error) {
        console.warn(`Failed to delete from ${table}:`, error.message);
      }
    }

    // Unlink user-created judges (keep judges, remove ownership)
    const { error: judgeError } = await supabaseAdmin
      .from('judges')
      .update({ created_by: null })
      .eq('created_by', userId);
    if (judgeError) {
      console.warn('Failed to unlink judges:', judgeError.message);
    }

    // Soft-delete profile: keep record but mark as deleted, reset token/premium
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        deleted_at: new Date().toISOString(),
        token: 0,
        is_premium: false,
        premium_expires_at: null,
        last_premium_grant: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Failed to soft-delete profile:', profileError.message);
      return new Response(
        JSON.stringify({ error: '계정 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.' }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Auth user is kept (not deleted) for potential reactivation

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('auth-delete-account error:', err);
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
