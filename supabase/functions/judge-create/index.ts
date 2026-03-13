import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, createAdminClient } from '../_shared/supabase.ts';
import { callGemini, extractJson } from '../_shared/gemini.ts';

async function generateJudgePrompt(wizardData: {
  name: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
}): Promise<{ prompt: string; description: string }> {
  const userPrompt = `다음 MBTI형 위자드 답변을 기반으로 판사 캐릭터의 시스템 프롬프트와 한줄 설명을 만들어줘.

이름: ${wizardData.name}
Q1 (갈등 접근법): ${wizardData.q1}
Q2 (중시하는 것): ${wizardData.q2}
Q3 (말투): ${wizardData.q3}
Q4 (판결 스타일): ${wizardData.q4}
Q5 (특징): ${wizardData.q5}
Q6 (한마디): ${wizardData.q6}

반드시 아래 JSON 형식으로만 응답해.
{"prompt":"판사 시스템 프롬프트 150자 이내, 캐릭터의 판결 성향과 말투를 구체적으로 묘사","description":"판사 한줄 소개 30자 이내"}`;

  const text = await callGemini({ userPrompt, maxTokens: 512 });
  return extractJson<{ prompt: string; description: string }>(text);
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

    const body = await req.json();
    const { name, q1, q2, q3, q4, q5, q6 } = body;

    if (!name || !q1 || !q2 || !q3 || !q4 || !q5 || !q6) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, q1-q6' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Generate system prompt and description via Claude
    const { prompt, description } = await generateJudgePrompt({ name, q1, q2, q3, q4, q5, q6 });

    const supabaseAdmin = createAdminClient();

    // Insert judge with pending status (user-created)
    const { data: judge, error: judgeError } = await supabaseAdmin
      .from('judges')
      .insert({
        name,
        description: description?.slice(0, 30) || null,
        prompt,
        is_user_created: true,
        is_approved: false,
        created_by: user.id,
      })
      .select()
      .single();

    if (judgeError) {
      throw new Error(`Failed to create judge: ${judgeError?.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, judge }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('judge-create error:', err);
    return new Response(
      JSON.stringify({ error: '판사 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
