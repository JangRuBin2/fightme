# FightMe 앱 전체 점검 보고서

**점검일**: 2026-03-18
**점검 범위**: 전체 Edge Functions, 프론트엔드 API/훅/페이지, Zod 검증, ES6 문법

---

## 1. 기능/컨셉 버그

### 1-1. [치명] AI 변호사가 모두 피고 편을 드는 문제

**파일**: `supabase/functions/fight-defense/index.ts`

**원인 3가지**:
- 시스템 프롬프트 없음: `callGemini`에 `systemPrompt`를 전달하지 않아 AI가 변호사 역할에 몰입하지 못함
- "양쪽 다" 모드에서 한 번의 API 호출로 양측 변론을 동시 생성 → AI가 피고(방어측)에 자연스럽게 편향
- "왜 덜 잘못했는지"라는 소극적 프레이밍 → 양쪽 모두 방어적 톤

**수정**:
- 원고/피고 전담 시스템 프롬프트 분리 (`PLAINTIFF_SYSTEM_PROMPT`, `DEFENDANT_SYSTEM_PROMPT`)
- "양쪽 다" 모드: `Promise.all`로 독립 API 2회 호출
- "왜 정당한지 + 상대 주장의 어떤 점이 부당한지" 적극적 프레이밍으로 변경

---

### 1-2. [치명] fight-detail 중복 과금

**파일**: `supabase/functions/fight-detail/index.ts`

**원인**: 상세 판결 보기를 호출할 때마다 2토큰 차감. 이미 본 상세도 재방문 시 재과금됨.

**수정**:
- `fights` 테이블에 `detail_unlocked` boolean 컬럼 추가
- 첫 결제 시 `detail_unlocked = true`로 설정
- 이후 호출에서는 무료로 반환

---

### 1-3. [치명] 광고 보상 무제한 악용 가능

**파일**: `supabase/functions/token-ad-reward/index.ts`

**원인**: 쿨다운/레이트 리밋 없이 무한 호출 가능 → 무한 토큰 생성

**수정**:
- `token_logs`에서 최근 1분 내 `AD_REWARD` 기록 확인
- 쿨다운 중이면 429 (Too Many Requests) 응답

---

### 1-4. [치명] 회원 탈퇴 시 서버 데이터 미삭제

**파일**: `src/app/my/page.tsx`

**원인**: `handleDeleteAccount()`가 `clearAuth()`만 호출. `auth-delete-account` Edge Function을 호출하지 않아 서버의 유저 데이터(fights, token_logs, judges, profile, auth user)가 남아있음.

**수정**:
- `deleteAccount()` API 함수 추가 (`auth-delete-account` Edge Function 호출)
- My 페이지에서 실제 API 호출 후 로컬 상태 정리
- 로딩 상태 + 실패 시 복구 처리

---

### 1-5. [높음] 과실 합계 검증 없음

**파일**: `supabase/functions/fight-judge/index.ts`, `fight-appeal/index.ts`

**원인**: AI에게 `user_fault + opponent_fault = 100`을 프롬프트로만 요청. AI가 60/60 같은 값을 반환하면 그대로 저장됨.

**수정**:
- 서버에서 합계 검증 후 비율 보정: `Math.round(fault * (100 / sum))`, 나머지는 `100 - 보정값`

---

### 1-6. [중간] 직접 변호 "양쪽 다" 모드 버그

**파일**: `supabase/functions/fight-defense/index.ts`

**원인**: `defenseSide === 'both'`이고 `defenseType === 'self'`일 때, 코드가 `side === 'opponent' ? 'opponent' : 'user'`로 평가하여 'both'가 항상 'user'로 처리됨.

**수정**: 명시적으로 `selfSide` 변수로 분리하여 의도 명확화.

---

## 2. Zod 타입 검증 점검

### 2-1. Edge Function 응답 (callEdgeFunction 경유)

모든 Edge Function 응답은 `callEdgeFunction`에서 Zod `.parse()` 검증됨.

| API 함수 | Edge Function | Zod 스키마 | 상태 |
|----------|---------------|-----------|------|
| `createFight()` | `fight-judge` | `createFightResponseSchema` | OK |
| `revealFight()` | `fight-reveal` | `revealFightResponseSchema` | OK |
| `getFightDetail()` | `fight-detail` | `fightDetailResponseSchema` | OK |
| `getPublicFight()` | `fight-public` | `publicFightResponseSchema` | OK |
| `submitAppeal()` | `fight-appeal` | `appealResponseSchema` | OK |
| `submitDefense()` | `fight-defense` | `defenseResponseSchema` | OK |
| `createJudge()` | `judge-create` | `createJudgeResponseSchema` | OK |
| `retryJudgeReview()` | `judge-manage` | `judgeManageResponseSchema` | OK |
| `deleteJudge()` | `judge-manage` | `judgeManageResponseSchema` | OK |
| `watchAdForTokens()` | `token-ad-reward` | `adRewardResponseSchema` | OK |
| `checkPremiumMonthly()` | `token-premium-check` | `premiumCheckResponseSchema` | OK |
| `activatePurchase()` | `iap-activate` | `iapActivateResponseSchema` | OK |
| `deleteAccount()` | `auth-delete-account` | `deleteAccountResponseSchema` | **신규 추가** |

### 2-2. Supabase 직접 쿼리 (미검증 → 수정)

| API 함수 | 테이블 | 적용 스키마 | 수정 전 | 수정 후 |
|----------|--------|-----------|--------|--------|
| `getFight()` | fights | `fightSchema` | 미검증 | `safeParseSingle` |
| `getUserFights()` | fights | `fightSchema` | 미검증 | `safeParseArray` |
| `getJudges()` | judges | `judgeSchema` | 미검증 | `safeParseArray` |
| `getJudge()` | judges | `judgeSchema` | 미검증 | `safeParseSingle` |
| `getMyJudges()` | judges | `judgeSchema` | 미검증 | `safeParseArray` |
| `voteJudge()` | judge_votes | `judgeVoteSchema` | 미검증 | `safeParseSingle` |
| `getUserVotes()` | judge_votes | `judgeVoteSchema` | 미검증 | `safeParseArray` |
| `getTokenBalance()` | profiles | `profileTokenSchema` | 미검증 | `safeParseSingle` |
| `getTokenLogs()` | token_logs | `tokenLogSchema` | 미검증 | `safeParseArray` |

### 2-3. 신규 추가된 Zod 스키마

```typescript
// DB 직접 쿼리용
judgeVoteSchema    // judge_votes 테이블
tokenLogSchema     // token_logs 테이블
profileTokenSchema // profiles.token 단일 필드

// Edge Function 응답용
deleteAccountResponseSchema  // auth-delete-account
premiumCheckResponseSchema   // token-premium-check

// 헬퍼 함수
safeParseArray<T>(schema, data)   // 배열 검증 (실패 항목 제외)
safeParseSingle<T>(schema, data)  // 단일 객체 검증 (실패 시 null)
```

### 2-4. 검증 커버리지

| 카테고리 | 수정 전 | 수정 후 |
|---------|--------|--------|
| Edge Function 응답 | 12/12 (100%) | 13/13 (100%) |
| Supabase 직접 쿼리 | 0/9 (0%) | 9/9 (100%) |
| **전체** | **12/21 (57%)** | **22/22 (100%)** |

---

## 3. ES6 문법 점검

### 3-1. `.then()` 체인 → async/await

**파일**: `src/hooks/useSessionSync.ts`

```typescript
// Before (ES5 패턴)
supabase.auth.getSession().then(({ data: { session } }) => {
  if (!session) {
    clearAuth();
  }
});

// After (ES6 async/await)
const syncSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    clearAuth();
  }
};
syncSession();
```

### 3-2. 전체 ES6 준수 현황

| 패턴 | 파일 수 | 상태 |
|------|--------|------|
| `var` 사용 | 0 | OK |
| `function` 선언식 | 0 | OK (모든 함수 화살표 함수 또는 async) |
| `.then()` 체인 | 1 → 0 | **수정 완료** |
| `require()` | 0 | OK (전부 ES6 import) |
| `arguments` 객체 | 0 | OK |
| 템플릿 리터럴 미사용 | 0 | OK |

---

## 4. DB 마이그레이션

**파일**: `supabase/migrations/002_premium_monthly.sql`

```sql
-- 프리미엄 월간 토큰 지급 추적
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_premium_grant timestamptz;

-- 상세보기 중복과금 방지
ALTER TABLE fights ADD COLUMN IF NOT EXISTS detail_unlocked boolean DEFAULT false;

-- token_logs reason 제약조건 확장 (PREMIUM_MONTHLY 추가)
ALTER TABLE token_logs DROP CONSTRAINT IF EXISTS token_logs_reason_check;
ALTER TABLE token_logs ADD CONSTRAINT token_logs_reason_check
  CHECK (reason IN (..., 'PREMIUM_MONTHLY'));
```

---

## 5. 수정 파일 목록

| 파일 | 변경 유형 |
|------|----------|
| `supabase/functions/fight-defense/index.ts` | AI 변호사 프롬프트 전면 개편 |
| `supabase/functions/fight-judge/index.ts` | 과실 합계 검증 추가 |
| `supabase/functions/fight-appeal/index.ts` | 과실 합계 검증 추가 |
| `supabase/functions/fight-detail/index.ts` | 중복 과금 방지 로직 |
| `supabase/functions/token-ad-reward/index.ts` | 1분 쿨다운 추가 |
| `supabase/functions/token-premium-check/index.ts` | **신규** - 프리미엄 월간 체크 |
| `supabase/functions/_shared/tokens.ts` | `checkAndGrantPremiumMonthly` 추가 |
| `supabase/functions/_shared/types.ts` | `PREMIUM_MONTHLY` reason 추가 |
| `supabase/migrations/002_premium_monthly.sql` | **신규** - 컬럼/제약조건 추가 |
| `src/lib/schemas.ts` | DB 쿼리용 Zod 스키마 + 헬퍼 추가 |
| `src/lib/api/fights.ts` | Zod 검증 적용 |
| `src/lib/api/judges.ts` | Zod 검증 적용 |
| `src/lib/api/tokens.ts` | Zod 검증 + deleteAccount 추가 |
| `src/hooks/useTokens.ts` | 프리미엄 월간 체크 통합 |
| `src/hooks/useSessionSync.ts` | ES6 async/await 변환 |
| `src/app/my/page.tsx` | 회원탈퇴 실제 API 호출 |
| `src/app/shop/page.tsx` | 토큰 200 → 50 텍스트 |
| `src/types/iap.ts` | 토큰 200 → 50 |
| `src/types/database.ts` | `PREMIUM_MONTHLY` reason 추가 |

---

## 6. 추가 개선 사항

### 6-1. 하드코딩 색상 → 시맨틱 테마 컬러

테마 전환 시 깨지는 하드코딩 색상을 시맨틱 컬러로 변경.

| 파일 | 변경 |
|------|------|
| `VerdictCard.tsx` | `bg-amber-50/blue-50` → `bg-accent-50/primary-50` |
| `VerdictCard.tsx` | APPEAL 배지 `bg-amber-100` → `bg-accent-100` |
| `defense/page.tsx` | DefensePreview 동일 변경 |
| `result/page.tsx` | 항소심 배지 `bg-amber-100` → `bg-accent-100` |

### 6-2. Edge Function 입력값 길이 검증

공용 헬퍼 `_shared/validate.ts` 생성 후 각 함수에 적용.

| Edge Function | 필드 | 최대 길이 |
|---------------|------|-----------|
| `fight-judge` | user_claim, opponent_claim | 200자 |
| `fight-judge` | user_name, opponent_name | 20자 |
| `fight-defense` | defense_text (self) | 300자 |
| `judge-create` | name | 20자 |
| `judge-create` | speech_style | 50자 |
| `judge-create` | q1~q5 | 각 100자 |

### 6-3. Toss SDK 응답 Zod 검증

| SDK 함수 | 적용 스키마 |
|----------|------------|
| `getProductItemList()` | `z.array(tossProductSchema)` |
| `getPendingOrders()` | `z.array(tossPendingOrderSchema)` |
| `loadRewardedAd()` | 자체 구성 (검증 불필요) |
| `showRewardedAd()` | 자체 구성 (검증 불필요) |

---

## 7. 배포 순서

1. DB 마이그레이션 실행: `002_premium_monthly.sql`
2. Edge Functions 배포: `pnpm deploy:functions`
3. 프론트엔드 빌드/배포: `pnpm build:ait`
