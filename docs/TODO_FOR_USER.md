# 사용자가 해야 할 작업 목록

개발자가 자러 간 동안 Claude가 개발 완료한 항목과, 사용자가 직접 처리해야 할 항목을 정리합니다.

---

## 개발 완료된 항목

### Frontend (빌드 성공 확인됨)
- [x] Next.js 14 프로젝트 (Static Export)
- [x] TailwindCSS + 토스 스타일 디자인 시스템
- [x] 홈 페이지 (싸움 입력 폼, 판사 선택)
- [x] 판결 결과 페이지 (애니메이션 게이지, 판사 코멘트)
- [x] 항소 페이지
- [x] 변호 페이지 (AI 변호사 / 직접 변호)
- [x] 판사 목록 & 랭킹 페이지
- [x] 판사 만들기 페이지
- [x] 싸움 히스토리 페이지
- [x] 로그인 페이지
- [x] 설정 페이지
- [x] 하단 네비게이션 바
- [x] Zustand 상태관리 (localStorage persist)
- [x] Toss SDK 래퍼 (인증, IAP, 광고)
- [x] 공유 이미지 생성 (Canvas)
- [x] 딥링크 핸들러

### Backend
- [x] Supabase Edge Functions (auth-toss, fight-judge, fight-appeal, fight-defense, judge-create)
- [x] DB 마이그레이션 스키마 (profiles, judges, fights, verdicts, judge_votes, subscriptions)
- [x] 기본 판사 4명 시드 데이터
- [x] Claude API 연동 (판결/변호/항소)
- [x] Toss OAuth2 + mTLS 인증
- [x] CORS 설정

### 설정
- [x] granite.config.ts (앱인토스)
- [x] fix-root-html.mjs (SPA 라우팅)
- [x] Claude Code 규칙 (.claude/rules/)
- [x] CLAUDE.md

---

## 사용자가 해야 할 작업

### 1. Supabase 프로젝트 생성 (필수)
1. https://supabase.com 에서 새 프로젝트 생성
2. 프로젝트 URL과 anon key 복사
3. `.env.local` 파일 생성:
```bash
cp .env.example .env.local
```
4. `.env.local`에 Supabase 정보 입력:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 2. DB 마이그레이션 실행 (필수)
```bash
# Supabase CLI 설치 (없다면)
brew install supabase/tap/supabase

# 프로젝트 링크
supabase link --project-ref <your-project-ref>

# 마이그레이션 실행
supabase db push
```
또는 Supabase Dashboard > SQL Editor에서 `supabase/migrations/001_initial.sql` 내용을 직접 실행

### 3. Claude API 키 발급 (필수)
1. https://console.anthropic.com 에서 API 키 발급
2. Supabase Dashboard > Edge Functions > Secrets에 추가:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Supabase Edge Functions Secrets 설정 (필수)
Supabase Dashboard > Edge Functions > Secrets에서 다음 시크릿 추가:
```
ANTHROPIC_API_KEY=sk-ant-...
TOSS_AUTH_SECRET=<랜덤 문자열 (openssl rand -hex 32)>
```

### 5. 토스 앱인토스 설정 (배포 시 필수)
1. https://console.apps-in-toss.toss.im 에서 앱 생성
2. mTLS 인증서 발급
3. OAuth2 설정 (콜백 URL 등록)
4. Edge Functions Secrets에 추가:
```
APPS_IN_TOSS_APP_ID=<앱 ID>
APPS_IN_TOSS_MTLS_CERT=<cert.pem을 base64 인코딩>
APPS_IN_TOSS_MTLS_KEY=<key.pem을 base64 인코딩>
APPS_IN_TOSS_API_URL=https://apps-in-toss-api.toss.im
TOSS_DISCONNECT_AUTH=<Basic Auth 토큰>
```

### 6. Edge Functions 배포 (필수)
```bash
# 모든 Edge Functions 배포
pnpm deploy:functions
```

### 7. 앱 아이콘 & OG 이미지 (배포 전)
- `public/icons/` 폴더에 앱 아이콘 추가 (72px ~ 512px)
- `public/og-default.png` (1200x600px) OG 이미지 추가
- `public/judges/` 폴더에 판사 아바타 이미지 추가 (선택)
- `granite.config.ts`의 `brand.icon` URL 업데이트

### 8. .ait 빌드 & 토스 콘솔 업로드 (배포)
```bash
# .ait 번들 생성
pnpm build:ait

# 생성된 fightme.ait 파일을 토스 Partner Console에 업로드
```

### 9. IAP 상품 등록 (수익화 시)
- 토스 Partner Console에서 구독 상품 등록 (monthly, yearly)
- Edge Functions에 iap-activate 함수 추가 (필요 시)

### 10. 광고 설정 (수익화 시)
- 토스 Partner Console에서 광고 그룹 생성
- `src/types/apps-in-toss-ads.ts`의 `AD_GROUP_IDS` 값을 실제 ID로 교체

---

## 로컬 개발 시작 방법

```bash
# .env.local 설정 후
pnpm dev
# http://localhost:3000 에서 확인
```

참고: 토스 SDK 기능 (로그인, IAP, 광고)은 토스 앱 내에서만 동작합니다.
로컬에서는 플레이스홀더 데이터로 UI만 확인할 수 있습니다.

---

## 추후 개발 사항 (Claude에게 요청 가능)

- [ ] 플레이스홀더 데이터를 실제 Supabase API로 연결
- [ ] 공유 이미지 디자인 커스터마이징
- [ ] 다크 모드 지원
- [ ] 판사 아바타 이미지 생성 (AI 이미지 생성)
- [ ] 푸시 알림
- [ ] 관리자 페이지 (판사 승인)
