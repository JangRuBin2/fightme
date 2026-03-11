# Plan Command

새 기능이나 대규모 변경 사항의 구현 계획을 수립합니다.

1. **요구사항 분석**
   - 사용자 요청 파악
   - 영향 범위 분석 (어떤 파일들이 변경되는지)
   - 기존 코드와의 충돌 가능성

2. **도메인 분류**
   - Frontend (court-designer): UI 변경 사항
   - Backend/AI (verdict-engine): Edge Function / DB 변경
   - Toss (toss-bailiff): SDK 연동 변경
   - QA (qa-prosecutor): 빌드/보안 영향

3. **구현 계획**
   - 단계별 작업 목록
   - 병렬 실행 가능한 작업 식별
   - 의존성 체인 (순차 실행 필요 작업)
   - 예상 변경 파일 목록

4. **위험 분석**
   - Static Export 호환성 이슈
   - 토스 WebView 제약사항 충돌
   - DB 마이그레이션 필요 여부
   - 기존 기능 회귀 가능성

5. **실행 순서 제안**
   - Team 판결단 워크플로우 기반
   - 병렬 가능 작업은 Agent tool로 동시 실행
   - 빌드 검증은 마지막 단계
