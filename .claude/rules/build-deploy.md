# 빌드 & 배포 규칙

## 토스 미니앱 (Static Export)
- Next.js `output: 'export'` 필수 → SSR/API Routes 사용 불가
- 서버 로직은 반드시 Supabase Edge Functions (Deno)
- `trailingSlash: true` 필수
- `images: { unoptimized: true }` 필수

## SPA 라우팅 (중요!)
- 토스 WebView는 모든 경로에 root index.html을 서빙 (SPA fallback)
- fix-root-html.mjs로 URL 정규화 스크립트 주입 필수
- `window.__FM_ACTUAL_PATH__`로 딥링크 경로 보존
- `document.write()` 절대 금지 → 토스 SDK 브릿지 파괴됨
- `history.replaceState()`만 사용

## 빌드 명령어
- `pnpm dev` → 로컬 개발
- `pnpm build` → Next.js 빌드 + fix-root-html
- `pnpm build:ait` → .ait 번들 생성
- `pnpm deploy:functions` → Edge Functions 배포

## mTLS 인증서
- PEM 인증서는 Base64로 인코딩해서 Supabase secrets에 저장
- fixPem() 함수로 런타임에 복원
- Deno 1.x/2.x 호환 파라미터명 사용 (cert+certChain, key+privateKey)

## 토스 WebView 제약
- `<a download>` 불가 → saveBase64Data() 사용
- Next.js Image 최적화 불가 → unoptimized: true
- pinch zoom 비활성화: user-scalable=no
- 최소 터치 타겟: 44px
