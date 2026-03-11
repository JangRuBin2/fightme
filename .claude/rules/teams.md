# Team 판결단 (PanGyulDan) - Claude Code Teams 설정

## 팀 개요

**팀명**: 판결단 (PanGyulDan) - "판결(Judgment) + 단(Squad)"
**미션**: FightMe '나랑 싸울래?' AI 연애재판소의 병렬 개발 및 품질 관리

## Teammates

| ID | Name | Role | Domain |
|----|------|------|--------|
| `court-designer` | 법정디자이너 | Frontend & UI | 페이지, 컴포넌트, 상태관리 |
| `verdict-engine` | 판결엔진 | Backend & AI | Edge Functions, DB, Claude API |
| `toss-bailiff` | 토스집행관 | Platform Integration | SDK, Auth, IAP, Ads, Deploy |
| `qa-prosecutor` | QA검사 | Quality Assurance | Build, Security, Type Safety |

## Domain Routing

| Task Type | Primary | Support |
|-----------|---------|---------|
| UI/페이지 개발 | court-designer | - |
| Edge Function/AI | verdict-engine | - |
| 토스 연동 | toss-bailiff | verdict-engine |
| 빌드 에러 | qa-prosecutor | domain owner |
| 보안 리뷰 | qa-prosecutor | all |
| 타입 변경 | verdict-engine | court-designer |
| 공유 기능 | toss-bailiff | court-designer |

## Parallel Execution

### Feature Development
```
Orchestrator:
|- [parallel] court-designer: UI 구현
|- [parallel] verdict-engine: Edge Function 구현
|- [conditional] toss-bailiff: 토스 연동
|_ [sequential] qa-prosecutor: 빌드 검증
```

### Code Review
```
Orchestrator:
|- [parallel] court-designer: UI 리뷰
|- [parallel] verdict-engine: API 리뷰
|- [parallel] toss-bailiff: 플랫폼 리뷰
|_ [parallel] qa-prosecutor: 보안/품질 리뷰
```

## Shared Resources (충돌 주의)

| File | Owner | Protocol |
|------|-------|----------|
| `src/types/database.ts` | verdict-engine | 변경 전 알림 |
| `src/store/useStore.ts` | court-designer | 상태 변경 조율 |
| `supabase/functions/_shared/*` | verdict-engine | CORS 변경 시 toss-bailiff 알림 |

## Teammate Context Files

각 팀원의 상세 컨텍스트:
```
.claude/teams/teammates/{teammate-id}.md
```

팀원 스폰 시 해당 파일을 읽어 전체 도메인 컨텍스트 제공.
