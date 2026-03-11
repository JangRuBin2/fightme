# Agent Orchestration

## Available Agents

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| planner | 구현 계획 수립 | 복잡한 기능, 대규모 변경 |
| build-error-resolver | 빌드 에러 수정 | pnpm build 실패 시 |
| security-reviewer | 보안 검토 | 커밋/배포 전 |

## Immediate Agent Usage

사용자 요청 없이 자동 사용:
1. 빌드 실패 → **build-error-resolver** agent
2. 복잡한 기능 요청 → **planner** agent
3. 배포 준비 → **security-reviewer** agent

## Parallel Task Execution

독립적인 작업은 항상 병렬 실행:

```markdown
# GOOD: 병렬 실행
Launch 3 agents in parallel:
1. court-designer: 판결 결과 UI 개선
2. verdict-engine: AI 프롬프트 최적화
3. qa-prosecutor: 빌드 검증

# BAD: 불필요한 순차 실행
First agent 1, then agent 2, then agent 3
```

## Team 판결단 Integration

/team 커맨드 또는 복잡한 작업 시:
1. `.claude/teams/판결단.json` 읽기
2. `.claude/teams/teammates/{id}.md` 컨텍스트 로드
3. Agent tool로 팀원 병렬 스폰
4. 결과 종합 후 사용자에게 보고
