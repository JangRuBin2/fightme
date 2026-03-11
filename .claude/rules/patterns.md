# 개발 패턴

## Edge Function 패턴
```typescript
Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  try {
    // 인증 확인
    const authHeader = req.headers.get('Authorization');
    const supabase = createSupabaseClient(authHeader!);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: getCorsHeaders(req) });
    // 비즈니스 로직
    return new Response(JSON.stringify({ success: true, data }), { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: getCorsHeaders(req) });
  }
});
```

## Claude API 호출 패턴
```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  }),
});
// 반드시 JSON 파싱 + 폴백 처리
```

## Toss SDK 래퍼 패턴
- event-based SDK → Promise 래핑
- isSupported() 체크 후 호출
- try/catch로 SDK 미사용 환경 대응
- dynamic import로 토스 환경에서만 로드

## 공유 이미지 패턴
- Canvas API로 직접 그리기 (html-to-image 사용 불가)
- saveBase64Data()로 저장 (download 속성 불가)
- getTossShareLink() + share()로 공유
