# 나랑 싸울래? (FightMe) - 프로젝트 개발 계획서

## 1. 프로젝트 개요

"나랑 싸울래?"는 커플/친구 간 갈등 상황을 AI 판사가 판결하는 재미형 콘텐츠 토스 미니앱.

### 핵심 가치
- 재미있는 AI 판결 콘텐츠
- SNS 바이럴 공유
- 사용자 제작 판사 생태계

---

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 14 (Static Export), React 18, TypeScript |
| Styling | TailwindCSS |
| State | Zustand (localStorage persist) |
| Backend | Supabase Edge Functions (Deno) |
| Database | Supabase PostgreSQL (RLS) |
| AI | Claude API (Anthropic SDK) |
| Auth | Toss OAuth2 (앱인토스 SDK) |
| Ads | Toss Ads + Google AdMob (통합 SDK) |
| Share | getTossShareLink + share API |
| Build | granite CLI → .ait 번들 |

---

## 3. 데이터베이스 스키마

### profiles
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK, FK auth.users) | Supabase auth user ID |
| nickname | text | 닉네임 |
| created_at | timestamptz | 가입일 |
| updated_at | timestamptz | 수정일 |

### judges
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | 판사 ID |
| name | text NOT NULL | 판사 이름 |
| description | text | 판사 설명 |
| style | text NOT NULL | 판결 스타일 (예: 냉정, 공감, 유머) |
| personality | text NOT NULL | 성격 키워드 |
| tone | text NOT NULL | 말투 (예: 반말, 존댓말, 사투리) |
| prompt | text NOT NULL | AI 시스템 프롬프트 |
| avatar_url | text | 프로필 이미지 URL |
| is_default | boolean DEFAULT false | 기본 제공 판사 여부 |
| is_premium | boolean DEFAULT false | 프리미엄 전용 여부 |
| created_by | uuid (FK profiles) | 제작자 (NULL=시스템) |
| status | text DEFAULT 'pending' | pending/approved/rejected |
| upvotes | integer DEFAULT 0 | 추천 수 |
| downvotes | integer DEFAULT 0 | 비추천 수 |
| use_count | integer DEFAULT 0 | 사용 횟수 |
| created_at | timestamptz | 생성일 |

### fights
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | 싸움 ID |
| user_id | uuid (FK profiles) NOT NULL | 사용자 ID |
| title | text | 사건명 (AI 자동 생성) |
| my_claim | text NOT NULL | 내 주장 (max 200자) |
| opponent_claim | text NOT NULL | 상대 주장 (max 200자) |
| judge_id | uuid (FK judges) NOT NULL | 담당 판사 |
| status | text DEFAULT 'pending' | pending/judged/appealed/final |
| created_at | timestamptz | 생성일 |

### verdicts
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | 판결 ID |
| fight_id | uuid (FK fights) NOT NULL | 싸움 ID |
| judge_id | uuid (FK judges) NOT NULL | 판결 판사 |
| my_fault_pct | integer NOT NULL | 내 과실 % (0-100) |
| opponent_fault_pct | integer NOT NULL | 상대 과실 % (0-100) |
| comment | text NOT NULL | 판사 한줄 코멘트 |
| reasoning | text | 판결 이유 (상세) |
| verdict_type | text NOT NULL | 'original' / 'appeal' |
| defense_text | text | 변호 내용 (있는 경우) |
| defense_type | text | 'ai' / 'self' / NULL |
| created_at | timestamptz | 판결일 |

### judge_votes
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| user_id | uuid (FK profiles) NOT NULL | |
| judge_id | uuid (FK judges) NOT NULL | |
| vote | text NOT NULL | 'up' / 'down' |
| created_at | timestamptz | |
| UNIQUE(user_id, judge_id) | | 1인 1표 |

### subscriptions
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| user_id | uuid (FK profiles) NOT NULL | |
| plan | text NOT NULL | 'monthly' / 'yearly' |
| status | text DEFAULT 'active' | active/expired/cancelled |
| started_at | timestamptz | |
| expires_at | timestamptz | |
| order_id | text | Toss IAP order ID |
| created_at | timestamptz | |

---

## 4. 페이지 구조

```
/                    → 홈 (싸움 입력 폼)
/judges              → 판사 목록 & 랭킹
/judges/create       → 내 판사 만들기
/judge/[id]          → 판사 상세
/fight/[id]          → 판결 결과
/fight/[id]/appeal   → 항소 진행
/fight/[id]/defense  → 변호 (AI/자기변호)
/history             → 내 싸움 히스토리
/settings            → 설정
/login               → 토스 로그인
```

---

## 5. Supabase Edge Functions

| Function | Method | Description |
|----------|--------|-------------|
| auth-toss | POST | Toss OAuth2 인증 → Supabase 세션 |
| auth-toss-disconnect | POST | Toss 연동 해제 웹훅 |
| auth-delete-account | POST | 회원 탈퇴 |
| fight-judge | POST | AI 판결 생성 (Claude API) |
| fight-appeal | POST | 항소 판결 생성 |
| fight-defense | POST | AI 변호사 변론 생성 |
| judge-create | POST | 사용자 판사 생성 (프롬프트 자동 생성) |

---

## 6. AI 프롬프트 설계

### 판결 시스템 프롬프트 (Base)
```
너는 "{judge_name}" 판사다.
성격: {personality}
말투: {tone}
판결 스타일: {style}

아래 싸움을 판결해라.

[원고 주장]: {my_claim}
[피고 주장]: {opponent_claim}
{defense_text ? "[변호 내용]: " + defense_text : ""}

반드시 아래 JSON 형식으로만 응답:
{
  "title": "사건명 (재미있게 10자 이내)",
  "my_fault_pct": 0-100,
  "opponent_fault_pct": 0-100,
  "comment": "한줄 판결 코멘트 (40자 이내)",
  "reasoning": "판결 이유 (200자 이내)"
}

주의:
- my_fault_pct + opponent_fault_pct = 100
- 캐릭터에 맞는 말투와 성격으로 판결
- 재미있고 공유하고 싶은 판결을 내려라
```

### AI 변호사 프롬프트
```
너는 유능한 AI 변호사다.
의뢰인의 입장을 최대한 변호해야 한다.

[의뢰인 주장]: {my_claim}
[상대방 주장]: {opponent_claim}

반드시 아래 JSON 형식으로만 응답:
{
  "defense_text": "변론문 (200자 이내, 설득력 있게)"
}
```

### 판사 생성 프롬프트
```
사용자가 아래 정보로 판사를 만들고 싶어한다.
이름: {name}
스타일: {style}
성격: {personality}
말투: {tone}

이 캐릭터에 맞는 판사 시스템 프롬프트를 생성해라.
반드시 아래 JSON 형식으로만 응답:
{
  "prompt": "생성된 시스템 프롬프트",
  "description": "판사 소개 (50자 이내)"
}
```

---

## 7. 광고 정책

### Free 사용자 광고 트리거
| 행동 | 광고 유형 |
|------|----------|
| 판결 결과 확인 | Rewarded |
| 판결문(상세) 확인 | Interstitial |
| AI 변호사 선임 | Rewarded |
| 항소 진행 | Rewarded |
| 자기변호 결과 확인 | Interstitial |

### Premium 사용자
- 모든 광고 제거
- 프리미엄 판사 사용 가능
- 월 ₩1,900 / 연 ₩15,900

---

## 8. 공유 기능

### 공유 이미지 (Canvas 생성)
- 사건명
- 판사 이름 & 아바타
- 과실 비율 (원형 차트)
- 판사 코멘트
- 앱 로고 워터마크

### 딥링크
```
intoss://fightme/fight/{fight_id}
```

### OG 이미지
- 1200x600px
- 판결 결과 요약 포함
- Supabase Storage에 저장

---

## 9. 개발 단계

### Phase 1: 기본 구조 (현재)
- [x] 프로젝트 계획서 작성
- [ ] Next.js 프로젝트 초기화 (Static Export)
- [ ] TailwindCSS 설정
- [ ] granite.config.ts 설정
- [ ] Supabase 프로젝트 연결
- [ ] 기본 레이아웃 & 라우팅
- [ ] DB 마이그레이션 (스키마)

### Phase 2: 핵심 기능
- [ ] 홈 화면 (싸움 입력 폼)
- [ ] 판사 선택 UI
- [ ] AI 판결 Edge Function (Claude)
- [ ] 판결 결과 화면
- [ ] 판결 히스토리

### Phase 3: 부가 기능
- [ ] 항소 시스템
- [ ] 변호 시스템 (AI/자기변호)
- [ ] 판사 생성 & 등록
- [ ] 판사 추천/비추천
- [ ] 판사 랭킹

### Phase 4: 수익화 & 배포
- [ ] Toss OAuth 인증
- [ ] 광고 시스템
- [ ] IAP 구독
- [ ] 공유 기능 (이미지 생성 + 딥링크)
- [ ] .ait 빌드 & 배포

---

## 10. 디렉토리 구조

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # 홈 (싸움 입력)
│   ├── login/page.tsx          # 로그인
│   ├── judges/
│   │   ├── page.tsx            # 판사 목록 & 랭킹
│   │   └── create/page.tsx     # 판사 만들기
│   ├── judge/[id]/page.tsx     # 판사 상세
│   ├── fight/[id]/
│   │   ├── page.tsx            # 판결 결과
│   │   ├── appeal/page.tsx     # 항소
│   │   └── defense/page.tsx    # 변호
│   ├── history/page.tsx        # 히스토리
│   └── settings/page.tsx       # 설정
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── BottomNav.tsx
│   │   ├── BackButton.tsx
│   │   └── DeepLinkHandler.tsx
│   ├── fight/
│   │   ├── FightForm.tsx       # 싸움 입력 폼
│   │   ├── VerdictCard.tsx     # 판결 결과 카드
│   │   ├── FaultGauge.tsx      # 과실 비율 게이지
│   │   └── DefenseForm.tsx     # 변호 폼
│   ├── judge/
│   │   ├── JudgeCard.tsx       # 판사 카드
│   │   ├── JudgeSelector.tsx   # 판사 선택
│   │   ├── JudgeCreateForm.tsx # 판사 생성 폼
│   │   └── JudgeRanking.tsx    # 판사 랭킹
│   ├── shared/
│   │   ├── AdGate.tsx          # 광고 게이트
│   │   ├── ShareButton.tsx     # 공유 버튼
│   │   └── Loading.tsx         # 로딩
│   └── premium/
│       ├── PremiumGate.tsx
│       └── PremiumModal.tsx
├── hooks/
│   ├── useFight.ts
│   ├── useJudges.ts
│   ├── useAppsInToss.ts
│   ├── useAppsInTossAds.ts
│   └── usePremium.ts
├── lib/
│   ├── apps-in-toss/
│   │   ├── sdk.ts              # Toss SDK 래퍼
│   │   └── ads.ts              # 광고 SDK 래퍼
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   └── types.ts            # Generated DB types
│   ├── api/
│   │   ├── fights.ts           # Fight CRUD
│   │   ├── judges.ts           # Judge CRUD
│   │   └── verdicts.ts         # Verdict API
│   ├── shareImage.ts           # Canvas 이미지 생성
│   └── tossShare.ts            # 딥링크 + 공유
├── store/
│   └── useStore.ts             # Zustand store
├── types/
│   ├── database.ts             # DB types
│   ├── apps-in-toss.ts         # SDK types
│   └── fight.ts                # Fight domain types
└── styles/
    └── globals.css             # Tailwind + custom

supabase/
├── functions/
│   ├── _shared/
│   │   ├── cors.ts
│   │   ├── supabase.ts
│   │   └── types.ts
│   ├── auth-toss/index.ts
│   ├── auth-toss-disconnect/index.ts
│   ├── auth-delete-account/index.ts
│   ├── fight-judge/index.ts
│   ├── fight-appeal/index.ts
│   ├── fight-defense/index.ts
│   └── judge-create/index.ts
└── migrations/
    └── 001_initial.sql

scripts/
├── fix-root-html.mjs
└── generate-og-image.mjs

public/
├── icons/
├── og-default.png
├── judges/                     # 기본 판사 아바타
└── manifest.json
```
