# 나랑 싸울래? - 배포 체크리스트

현재 상태: 개발 완료, 인프라/배포 설정 미진행

---

## 1. Supabase 설정

- [ ] Supabase 프로젝트 생성 (https://supabase.com/dashboard)
- [ ] 프로젝트 URL, anon key, service role key 확보
- [ ] `.env` 파일 생성 (`.env.example` 참고)
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  ```
- [ ] Supabase CLI 로그인: `npx supabase login`
- [ ] 프로젝트 링크: `npx supabase link --project-ref <project-id>`
- [ ] DB 마이그레이션 실행: `npx supabase db push`
  - profiles, judges, fights, judge_votes, token_logs 테이블 생성
  - RLS 정책 적용
  - 기본 판사 4명 시드 데이터 삽입

## 2. Supabase Edge Functions 배포

- [ ] Anthropic API 키 설정
  ```bash
  npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
  ```
- [ ] 토스 인증 관련 시크릿 설정
  ```bash
  npx supabase secrets set TOSS_AUTH_SECRET=<랜덤 시크릿>
  npx supabase secrets set TOSS_DISCONNECT_AUTH=<Basic auth base64>
  npx supabase secrets set APPS_IN_TOSS_MTLS_CERT=<인증서 base64>
  npx supabase secrets set APPS_IN_TOSS_MTLS_KEY=<키 base64>
  npx supabase secrets set APPS_IN_TOSS_API_URL=https://apps-in-toss-api.toss.im
  ```
- [ ] Edge Functions 배포
  ```bash
  pnpm deploy:functions
  ```
- [ ] 배포된 함수 목록 확인 (총 11개)
  - auth-toss, auth-toss-disconnect, auth-delete-account
  - fight-judge, fight-appeal, fight-defense, fight-detail, fight-reveal, fight-public
  - judge-create, judge-review
  - token-ad-reward

## 3. 토스 앱인토스 (Partner Console) 설정

- [ ] 토스 Partner Console 접속
- [ ] 앱 등록 및 App ID 발급
- [ ] mTLS 인증서 발급 (Partner Console에서)
- [ ] OAuth2 콜백 URL 설정
- [ ] 앱 기본 정보 입력
  - 앱 이름: 나랑 싸울래?
  - 부제: AI 판사가 너희 싸움을 판결합니다
  - 가로형 썸네일: 1932 x 828px
  - 앱 검색 키워드: 싸움, 판결, AI판사, 커플싸움, 갈등해결, 연애, 친구, 재판, 논쟁, 중재
  - 상세 설명 작성

## 4. 빌드 및 .ait 업로드

- [ ] `.env`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 확인
- [ ] 로컬 빌드 테스트: `pnpm build`
- [ ] .ait 번들 생성: `pnpm build:ait`
- [ ] `fightme.ait` 파일을 Partner Console에 업로드

## 5. 검수 전 확인사항

- [ ] 토스 앱에서 로그인 플로우 테스트
- [ ] 판사 선택 -> 주장 입력 -> 판결 결과 확인
- [ ] 항소/변론 기능 테스트
- [ ] 판결 공유 기능 테스트
- [ ] 토큰 차감/충전 정상 동작 확인
- [ ] granite.config.ts의 `brand.icon` 아이콘 경로 설정 (현재 빈 문자열)

## 6. 심사 제출

- [ ] Partner Console에서 심사 요청
- [ ] 심사 통과 대기

---

## 빠른 참고

```bash
# 전체 배포 한번에
pnpm deploy:all

# Edge Function 개별 배포
npx supabase functions deploy fight-judge

# DB 마이그레이션
npx supabase db push

# 시크릿 확인
npx supabase secrets list
```
