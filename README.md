# 나랑 싸울래?

커플, 친구 사이 갈등과 논쟁을 AI 판사가 판결해주는 토스 미니앱입니다.

## 주요 기능

- **AI 판결** - 양쪽 주장을 입력하면 AI 판사가 과실 비율을 판결
- **변론 추가** - AI 변호사 또는 직접 변론으로 판결에 영향
- **항소(2심)** - 판사를 바꿔서 재판결
- **판사 만들기** - 말투와 성격을 설정해서 나만의 AI 판사 생성
- **공유하기** - 토스 딥링크 공유 + 판결 이미지 저장
- **프리미엄** - 매월 50토큰 자동 지급

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 14 (Static Export), React 18, TypeScript, TailwindCSS |
| State | Zustand (localStorage persist) |
| Backend | Supabase Edge Functions (Deno) |
| Database | Supabase PostgreSQL (RLS) |
| AI | Google Gemini API (gemini-2.5-flash) |
| Platform | 토스 앱인토스 SDK (@apps-in-toss/web-framework) |

## 시작하기

### 사전 요구사항

- Node.js 20+
- pnpm
- Supabase CLI
- 토스 앱인토스 CLI (@apps-in-toss/cli)

### 환경 변수

`.env.local` 파일을 생성하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_AI_API_KEY=
NEXT_PUBLIC_DEBUG=false
```

### 설치 및 실행

```bash
pnpm install
pnpm dev          # 로컬 개발 서버 (http://localhost:3000)
```

### 빌드 및 배포

```bash
pnpm build              # Next.js 빌드 + SPA fallback 처리
pnpm build:ait          # .ait 번들 생성 + Edge Functions 배포
pnpm deploy:functions   # Edge Functions만 배포
```

빌드 후 생성된 `.ait` 파일을 [토스 Partner Console](https://partner.toss.im)에 업로드합니다.

## 프로젝트 구조

```
src/
├── app/                    # 페이지
│   ├── page.tsx            # 홈 (판결 생성)
│   ├── login/              # 토스 로그인
│   ├── fight/              # 판결 결과
│   │   ├── defense/        # 변론 추가
│   │   └── appeal/         # 항소
│   ├── judges/             # 판사 목록
│   │   └── create/         # 판사 만들기
│   ├── result/             # 공유 결과 (비로그인)
│   ├── my/                 # 마이페이지
│   │   ├── fights/         # 내 판결문
│   │   └── judges/         # 내 판사
│   └── shop/               # 상점 (토큰 충전)
├── components/
│   ├── fight/              # VerdictCard, FaultGauge
│   ├── judge/              # JudgeSelector, JudgeCreateWizard
│   ├── shared/             # ShareButton, AdModal
│   └── layout/             # HamburgerMenu
├── hooks/                  # useTokens, useIap, useProcessingGuard
├── lib/
│   ├── api/                # Edge Function 호출 (fights, judges, tokens, iap)
│   ├── apps-in-toss/       # 토스 SDK 래퍼 (로그인, IAP, 광고)
│   ├── supabase/           # Supabase 클라이언트
│   ├── schemas.ts          # Zod 스키마 (모든 서버 응답 검증)
│   ├── shareImage.ts       # Canvas 판결 이미지 생성
│   └── tossShare.ts        # 토스 딥링크 공유
├── store/                  # Zustand 상태관리
└── types/                  # TypeScript 타입 정의

supabase/
├── functions/              # Edge Functions
│   ├── _shared/            # 공용 모듈 (tokens, gemini, cors, validate)
│   ├── fight-judge/        # 1심 판결
│   ├── fight-appeal/       # 2심 항소
│   ├── fight-defense/      # AI/직접 변론
│   ├── fight-detail/       # 상세 판결 보기
│   ├── fight-reveal/       # 판결 공개
│   ├── fight-public/       # 공유 결과 조회 (비인증)
│   ├── judge-create/       # 판사 생성
│   ├── judge-manage/       # 판사 관리 (재심사, 삭제)
│   ├── judge-review/       # 판사 일괄 심사 (CRON)
│   ├── token-ad-reward/    # 광고 보상
│   ├── token-premium-check/# 프리미엄 월간 토큰
│   ├── iap-activate/       # IAP 결제 활성화
│   ├── auth-toss/          # 토스 OAuth2 로그인
│   ├── auth-toss-disconnect/ # 토스 연동 해제
│   └── auth-delete-account/  # 회원 탈퇴 (soft-delete)
├── migrations/             # DB 마이그레이션
└── config.toml
```

## 판결 흐름

```
양쪽 주장 입력 + 판사 선택
         │
         ▼
    1심 판결 (AI)
         │
    ┌────┴────┐
    │         │
 변론 추가   공유하기
 (AI/직접)     │
    │       결과 페이지
    ▼       (비로그인)
  2심 항소
  (재판결)
    │
    ▼
  최종 결과
```

## 토큰 비용

| 기능 | 비용 |
|------|------|
| 판결 (1심) | 3 토큰 |
| 항소 (2심) | 5 토큰 |
| AI 변론 | 5 토큰 |
| 직접 변론 | 무료 |
| 상세 판결 보기 | 2 토큰 (1회) |
| 판사 만들기 | 100 토큰 |
| 광고 시청 보상 | +5 토큰 |
| 프리미엄 월간 | +50 토큰 |

## 테마

3가지 테마를 지원합니다:

- **Warm Verdict** (기본) - 따뜻한 라이트 테마
- **Dark Court** - 어두운 법정 테마
- **Neon Fight** - 네온 대결 테마

`src/app/globals.css`에 CSS 변수로 정의되어 있으며, 모든 컴포넌트는 시맨틱 컬러(`primary`, `accent`, `gray`)만 사용합니다.

## 스크립트

```bash
node scripts/gen-og.mjs          # OG 이미지 생성 (puppeteer)
node scripts/upload-og.mjs       # OG 이미지 Supabase Storage 업로드
node scripts/fix-root-html.mjs   # SPA fallback 처리 (빌드 시 자동)
```
