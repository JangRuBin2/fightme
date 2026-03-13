# 나랑 싸울래? - 배포 체크리스트

---

## 1. Supabase 설정

- [x] Supabase 프로젝트 생성
- [x] `.env.local` 키 입력 완료
- [x] `supabase link` 완료
- [x] DB 마이그레이션 실행 완료
- [x] Edge Functions 전체 배포 완료 (12개)

### 등록된 시크릿
- [x] `GOOGLE_AI_API_KEY` (Gemini 2.5 Flash)
- [x] `TOSS_DISCONNECT_AUTH` (연결 끊기 콜백 인증)
- [ ] `TOSS_AUTH_SECRET` (토스 로그인 비밀번호 생성용)
- [ ] `TOSS_DECRYPT_KEY` (토스 개인정보 복호화)
- [ ] `APPS_IN_TOSS_API_URL` (https://apps-in-toss-api.toss.im)
- [ ] `APPS_IN_TOSS_MTLS_CERT` (mTLS 인증서 base64)
- [ ] `APPS_IN_TOSS_MTLS_KEY` (mTLS 키 base64)

## 2. 토스 Partner Console 설정

- [ ] mTLS 인증서 발급 & 다운로드
- [ ] 약관 URL 등록: `https://fightme.apps.tossmini.com/terms/`
- [ ] 연결 끊기 콜백 등록 & 테스트 통과
- [ ] OAuth2 설정
- [ ] 앱 기본 정보 (이름, 썸네일, 키워드)
- [ ] 앱 아이콘

## 3. 빌드 & 업로드

- [ ] `pnpm build:ait` 실행
- [ ] `fightme.ait` → Partner Console 업로드

## 4. 검수

- [ ] 로그인 플로우 테스트
- [ ] 핵심 기능 테스트 (판결, 항소, 변론)
- [ ] 검수 제출

---

## 빠른 참고

```bash
# 전체 배포
pnpm deploy:all

# .ait 빌드 + 함수 배포
pnpm build:ait

# Edge Function 개별 배포
npx supabase functions deploy fight-judge

# 시크릿 확인
npx supabase secrets list

# mTLS cert Base64 인코딩 (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("경로\cert.pem")) | Set-Clipboard
```
