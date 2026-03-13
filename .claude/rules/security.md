# 보안 규칙

## 인증
- Toss OAuth2 → Supabase Auth 연동
- 모든 Edge Function은 Authorization 헤더 검증 (auth-toss, auth-toss-disconnect 제외)
- 비밀번호: HMAC-SHA256(toss_user_key, TOSS_AUTH_SECRET)

## RLS (Row Level Security)
- 모든 테이블에 RLS 활성화
- 사용자는 자신의 데이터만 접근 가능
- judges는 approved/default만 공개 읽기

## API 키
- GOOGLE_AI_API_KEY: Edge Function secrets에만 저장
- NEXT_PUBLIC_ 접두사: 클라이언트 노출 가능한 것만
- mTLS 인증서: Base64로 secrets에 저장

## CORS
- 허용 Origin 화이트리스트만 허용
- Toss WebView는 Origin 헤더 없이 요청할 수 있음 → 기본값 처리

## 입력 검증
- 주장 텍스트: 200자 제한
- AI 응답: JSON 파싱 실패 시 폴백 처리
- SQL Injection: Supabase 파라미터 바인딩으로 자동 방지
