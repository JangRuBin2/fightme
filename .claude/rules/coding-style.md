# 코딩 스타일 가이드

## 프로젝트 구조
- `src/app/` → Next.js pages (모두 'use client')
- `src/components/` → 재사용 컴포넌트
- `src/hooks/` → Custom hooks
- `src/lib/` → 유틸리티, API 클라이언트
- `src/store/` → Zustand 상태관리
- `src/types/` → TypeScript 타입
- `supabase/functions/` → Edge Functions (Deno)

## TypeScript
- strict mode 사용
- interface 우선 (type은 유니온/인터섹션에만)
- any 사용 금지 → unknown 사용

## 상태관리 (Zustand)
- localStorage persist 패턴
- 낙관적 UI 업데이트 (로컬 먼저, DB 비동기 동기화)
- DB 실패는 silent (새로고침으로 복구 가능)

## 컴포넌트
- 'use client' 지시어 필수 (static export)
- Props interface는 컴포넌트 파일 내에 정의
- lucide-react 아이콘 사용
- framer-motion 애니메이션
- TailwindCSS 클래스 사용 (인라인 스타일 금지)

## API 패턴
- Edge Function 호출: src/lib/api/edge.ts의 callEdgeFunction() 사용
- Supabase 직접 쿼리: src/lib/supabase/client.ts의 createClient() 사용
- 에러 처리: try/catch + 사용자 친화적 메시지

## 색상 테마
- primary: #ff6b6b (빨간 계열, 싸움/판결 테마)
- accent: #f4a31a (주황/골드, 강조)
- gray: 토스 스타일 neutral (191F28 ~ F9FAFB)
