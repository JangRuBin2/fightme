# FightMe (나랑 싸울래?) - Claude Code 프로젝트 설정

## 프로젝트 요약
커플/친구 간 갈등을 AI 판사가 판결하는 토스 미니앱 (앱인토스).

## 기술 스택
- Frontend: Next.js 14 (Static Export), React 18, TypeScript, TailwindCSS
- State: Zustand (localStorage persist)
- Backend: Supabase Edge Functions (Deno)
- DB: Supabase PostgreSQL (RLS)
- AI: Google Gemini API - gemini-2.5-flash
- Platform: 토스 앱인토스 SDK (@apps-in-toss/web-framework)

## 핵심 규칙
1. **Static Export 전용** - SSR/API Routes 사용 불가, 서버 로직은 Edge Functions
2. **document.write() 절대 금지** - 토스 SDK 브릿지 파괴
3. **모든 페이지 'use client'** - Static Export 필수
4. **CORS 필수** - Edge Function에 getCorsHeaders() + handleCors() 사용
5. **mTLS** - Toss API 호출 시 fixPem() + createHttpClient() 사용
6. **테마 호환 필수** - `bg-white`/하드코딩 색상 금지, 시맨틱 컬러만 사용 (`.claude/rules/theming.md` 참조)

## 주요 명령어
```bash
pnpm dev          # 로컬 개발
pnpm build        # 빌드 (+ fix-root-html.mjs)
pnpm build:ait    # .ait 번들 생성
pnpm deploy:functions  # Edge Functions 배포
```

## 디렉토리 구조
- `src/app/` - 페이지 (홈, 로그인, 판사, 판결, 히스토리, 설정)
- `src/components/` - UI 컴포넌트
- `src/lib/apps-in-toss/` - 토스 SDK 래퍼
- `src/lib/api/` - Edge Function 호출
- `src/lib/supabase/` - Supabase 클라이언트
- `supabase/functions/` - Edge Functions (auth, fight-judge, fight-appeal, fight-defense, judge-create)
- `supabase/migrations/` - DB 스키마

## 참조 프로젝트
- `/Users/rubinjang/web/acorn/refrigerator-receipt/` - 토스 앱인토스 패턴 참조용
