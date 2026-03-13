import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabase.ts';
import { callGemini, extractJson } from '../_shared/gemini.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Authenticate via CRON_SECRET
    const cronSecret = req.headers.get('x-cron-secret') || req.headers.get('Authorization')?.replace('Bearer ', '');
    const expectedSecret = Deno.env.get('CRON_SECRET');

    if (!expectedSecret || cronSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Get up to 10 unapproved user-created judges
    const { data: pendingJudges, error } = await supabaseAdmin
      .from('judges')
      .select('*')
      .eq('is_user_created', true)
      .eq('is_approved', false)
      .is('reject_reason', null)
      .order('created_at', { ascending: true })
      .limit(10);

    if (error || !pendingJudges || pendingJudges.length === 0) {
      return new Response(
        JSON.stringify({ success: true, reviewed: 0, message: 'No pending judges' }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    let approved = 0;
    let rejected = 0;

    for (const judge of pendingJudges) {
      try {
        const reviewPrompt = `다음 AI 판사 캐릭터를 검토해주세요. 부적절한 내용(혐오, 차별, 폭력 조장 등)이 포함되어 있는지 확인하세요.

이름: ${judge.name}
설명: ${judge.description || '없음'}
프롬프트: ${judge.prompt}

반드시 아래 JSON 형식으로만 응답해.
{"approved":true/false,"reason":"승인/거절 이유 50자 이내"}`;

        const text = await callGemini({ userPrompt: reviewPrompt, maxTokens: 256 });
        const review = extractJson<{ approved: boolean; reason?: string }>(text);

        if (review.approved) {
          await supabaseAdmin
            .from('judges')
            .update({ is_approved: true })
            .eq('id', judge.id);
          approved++;
        } else {
          await supabaseAdmin
            .from('judges')
            .update({ is_approved: false, reject_reason: review.reason || 'AI 검토 거절' })
            .eq('id', judge.id);
          rejected++;
        }
      } catch {
        // Skip individual judge review failures
        continue;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reviewed: pendingJudges.length,
        approved,
        rejected,
      }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('judge-review error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
