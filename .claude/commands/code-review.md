# Code Review Command

Team 판결단의 다중 관점 코드 리뷰를 실행합니다.

4명의 팀원이 병렬로 각자 도메인 관점에서 리뷰합니다:

1. **법정디자이너 (CourtDesigner)** - Frontend 관점
   - 컴포넌트 구조 및 재사용성
   - Tailwind CSS 일관성
   - 애니메이션 적절성
   - 접근성 (터치 타겟 44px)
   - Static Export 호환성

2. **판결엔진 (VerdictEngine)** - Backend/AI 관점
   - Edge Function 보안 (인증, CORS)
   - AI 프롬프트 품질
   - DB 스키마 정합성
   - RLS 정책 적절성
   - 에러 처리 견고성

3. **토스집행관 (TossBailiff)** - Platform 관점
   - 토스 SDK 호환성
   - document.write() 미사용
   - SPA 라우팅 정상 동작
   - 광고 정책 준수
   - mTLS/OAuth 보안

4. **QA검사 (QAProsecutor)** - Quality 관점
   - TypeScript 타입 안전성
   - 빌드 통과 여부
   - 보안 취약점 (OWASP Top 10)
   - 번들 사이즈 적절성
   - .env 키 노출 여부

각 팀원의 리뷰를 종합하여 우선순위별 개선 사항을 제시합니다.
