# Build Fix Command

빌드 에러를 점진적으로 수정합니다:

1. 빌드 실행: `pnpm build`

2. 에러 분석:
   - 파일별 그룹핑
   - 심각도별 정렬
   - Static Export 호환성 우선 체크

3. 에러별 수정:
   - 에러 컨텍스트 표시 (전후 5줄)
   - 원인 설명
   - 최소 변경으로 수정
   - 빌드 재실행
   - 해결 확인

4. 중단 조건:
   - 수정이 새 에러를 유발할 때
   - 같은 에러가 3회 시도 후에도 지속될 때

5. 결과 요약:
   - 수정된 에러 수
   - 남은 에러 수
   - 새로 발생한 에러

6. 자주 발생하는 FightMe 특화 에러:
   - useSearchParams without Suspense → Suspense 래핑
   - Dynamic route [id] → 쿼리 파라미터 전환
   - Module not found → @/ alias 경로 확인

한 번에 하나의 에러만 수정합니다!
