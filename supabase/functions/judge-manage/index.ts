import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, createAdminClient } from '../_shared/supabase.ts';
import { callGemini, extractJson } from '../_shared/gemini.ts';

const REVIEW_SCHEMA = {
  type: 'object' as const,
  properties: {
    approved: { type: 'boolean' as const, description: '승인 여부' },
    reason: { type: 'string' as const, description: '승인/거절 이유 50자 이내' },
  },
  required: ['approved', 'reason'],
};

async function reviewJudge(name: string, description: string | null, prompt: string): Promise<{ approved: boolean; reason: string }> {
  const reviewPrompt = `다음 AI 판사 캐릭터를 검토해주세요.

이름: ${name}
설명: ${description || '없음'}
프롬프트: ${prompt}

이 판사는 커플/친구 간 갈등을 재미있게 판결하는 엔터테인먼트 캐릭터입니다.
유머러스하거나 장난스러운 표현, 인터넷 밈, 사투리, 반말 등은 전혀 문제 없습니다.

아래 경우에만 거절(approved: false)하세요:
- 특정 지역/성별/인종을 비하하는 심각한 혐오 표현
- 노골적인 성적 묘사
- 폭력을 직접적으로 조장하는 내용
- 일베 등 커뮤니티의 혐오 용어 (예: "딱 좋노", "이기야" 등)

위에 해당하지 않으면 반드시 approved: true로 응답하세요.`;

  const text = await callGemini({
    userPrompt: reviewPrompt,
    maxTokens: 1024,
    responseSchema: REVIEW_SCHEMA,
  });
  return extractJson<{ approved: boolean; reason: string }>(text, REVIEW_SCHEMA);
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

    const { action, judge_id } = await req.json();

    if (!action || !judge_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: action, judge_id' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Verify ownership
    const { data: judge, error: judgeError } = await supabaseAdmin
      .from('judges')
      .select('*')
      .eq('id', judge_id)
      .eq('created_by', user.id)
      .single();

    if (judgeError || !judge) {
      return new Response(
        JSON.stringify({ error: '판사를 찾을 수 없습니다' }),
        { status: 404, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'retry') {
      // Only rejected or pending judges can be retried
      if (judge.is_approved) {
        return new Response(
          JSON.stringify({ error: '이미 승인된 판사입니다' }),
          { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }

      const review = await reviewJudge(judge.name, judge.description, judge.prompt);

      const { error: updateError } = await supabaseAdmin
        .from('judges')
        .update({
          is_approved: review.approved,
          reject_reason: review.approved ? null : (review.reason || 'AI 검토 거절'),
        })
        .eq('id', judge_id);

      if (updateError) {
        throw new Error(`Failed to update judge: ${updateError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          approved: review.approved,
          reviewReason: review.reason,
        }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete') {
      // Only non-approved judges can be deleted by user (or approved ones with 0 usage)
      if (judge.is_approved && judge.usage_count > 0) {
        return new Response(
          JSON.stringify({ error: '사용된 판사는 삭제할 수 없습니다. 비활성화를 이용해주세요.' }),
          { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }

      const { error: deleteError } = await supabaseAdmin
        .from('judges')
        .delete()
        .eq('id', judge_id)
        .eq('created_by', user.id);

      if (deleteError) {
        throw new Error(`Failed to delete judge: ${deleteError.message}`);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'deactivate') {
      // 사용된 판사를 삭제하지 않고 비활성화 (다른 사용자에게 노출 X)
      if (!judge.is_approved) {
        return new Response(
          JSON.stringify({ error: '이미 비활성화 상태입니다' }),
          { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }

      const { error: updateError } = await supabaseAdmin
        .from('judges')
        .update({ is_approved: false, reject_reason: '소유자에 의해 비활성화됨' })
        .eq('id', judge_id);

      if (updateError) {
        throw new Error(`Failed to deactivate judge: ${updateError.message}`);
      }

      return new Response(
        JSON.stringify({ success: true, deactivated: true }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "retry", "delete", or "deactivate"' }),
      { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('judge-manage error:', err);
    return new Response(
      JSON.stringify({ error: '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
