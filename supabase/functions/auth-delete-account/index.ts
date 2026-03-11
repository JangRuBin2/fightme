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

    // Explicitly delete user data from all tables before deleting auth user
    // This ensures cleanup even if CASCADE constraints are misconfigured
    const tables = [
      'subscriptions',
      'judge_votes',
      'verdicts',
      'fights',
    ];

    for (const table of tables) {
      if (table === 'verdicts') {
        // Delete verdicts for user's fights
        const { data: userFights } = await supabaseAdmin
          .from('fights')
          .select('id')
          .eq('user_id', userId);

        if (userFights && userFights.length > 0) {
          const fightIds = userFights.map((f: { id: string }) => f.id);
          await supabaseAdmin.from('verdicts').delete().in('fight_id', fightIds);
        }
      } else {
        await supabaseAdmin.from(table).delete().eq('user_id', userId);
      }
    }

    // Set created_by to null for user-created judges (don't delete them)
    await supabaseAdmin
      .from('judges')
      .update({ created_by: null })
      .eq('created_by', userId);

    // Delete profile (which is the FK root for most tables)
    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    // Delete auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Failed to delete auth user:', deleteError.message);
      return new Response(
        JSON.stringify({ error: '계정 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.' }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

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
