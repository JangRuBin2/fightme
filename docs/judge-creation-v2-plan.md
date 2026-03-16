# 판사 만들기 v2 - 이용권 + 캐릭터 이미지 생성

## 개요

기존: 누구나 무료로 무제한 판사 생성
변경: 판사 제작 이용권 보유자만 생성 가능, 캐릭터 이미지 자동 생성

---

## 사용자 플로우

```
판사 만들기 진입
    ↓
[이용권 확인] ─── 없음 ──→ 이용권 구매 화면
    │                         ├ 토큰 N개로 구매
    │ 있음                    └ (추후) 토스 IAP
    ↓
Step 1: 판사 이름 입력 (기존)
    ↓
Step 2-7: 성향 6문항 선택 (기존)
    ↓
Step 8: 기타 요청사항 입력 (신규)
    - 텍스트 입력: "외모, 성격, 특이사항 등 추가 요청"
    - 예시: "고양이 귀 달린 판사", "선글라스 쓴 할머니"
    ↓
Step 9: AI 생성 중 (로딩 화면)
    - 캐릭터 이미지 생성 (Gemini 이미지 생성)
    - 시스템 프롬프트 생성 (기존 Gemini 텍스트)
    ↓
Step 10: 미리보기 + 확인
    - 생성된 캐릭터 이미지
    - 판사 이름 + 한줄 소개
    - [다시 생성] [확정하기] 버튼
    ↓
완료 → /my/judges/ 이동
```

---

## DB 변경

### judges 테이블

```sql
ALTER TABLE judges ADD COLUMN avatar_url text;
```

### profiles 테이블

```sql
ALTER TABLE profiles ADD COLUMN judge_tickets integer DEFAULT 0;
```

### token_logs reason 추가

```
JUDGE_TICKET_PURCHASE  -- 이용권 구매 시 토큰 차감
```

---

## Edge Function 변경

### judge-create (수정)

기존 플로우에 추가:

1. **이용권 검증**: `profiles.judge_tickets > 0` 확인
2. **이용권 차감**: `judge_tickets -= 1`
3. **이미지 생성**: Gemini 이미지 생성 API 호출
4. **이미지 저장**: Supabase Storage `judge-avatars` 버킷에 업로드
5. **judge 레코드에 avatar_url 저장**

요청 body 변경:
```typescript
// 기존
{ name, q1, q2, q3, q4, q5, q6 }

// 변경
{ name, q1, q2, q3, q4, q5, q6, customRequest?: string }
```

응답 변경:
```typescript
// 기존
{ success: true, judge: Judge }

// 변경 (미리보기 단계 추가 시)
{ success: true, judge: Judge, avatarUrl: string }
```

### judge-ticket-purchase (신규)

```
POST /functions/v1/judge-ticket-purchase
Body: { method: 'token' }  // 추후 'iap' 추가
Response: { success: true, tickets: number, tokenBalance: number }
```

- 토큰 N개 차감 (가격 미정 - 결정 필요)
- `profiles.judge_tickets += 1`
- `token_logs` 기록

---

## 이미지 생성

### API

Gemini 2.0 Flash 이미지 생성 사용:

```typescript
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent

{
  "contents": [{
    "parts": [{ "text": "캐릭터 생성 프롬프트" }]
  }],
  "generationConfig": {
    "responseModalities": ["TEXT", "IMAGE"]
  }
}
```

### 프롬프트 구성

```
Create a cartoon character avatar for an AI judge with these traits:

Name: {name}
Personality: {위자드 답변 기반 성격 요약}
Style: {판결 스타일}
Custom request: {사용자 기타 요청사항}

Requirements:
- Cartoon/illustration style, colorful
- Single character, front-facing portrait
- Friendly but authoritative look
- White or transparent background
- Square aspect ratio (1:1)
- No text in the image
```

### 저장

- Supabase Storage 버킷: `judge-avatars`
- 파일명: `{judge_id}.png`
- 공개 읽기 (RLS: public read)
- URL 형식: `{SUPABASE_URL}/storage/v1/object/public/judge-avatars/{judge_id}.png`

---

## 프론트엔드 변경

### JudgeCreateWizard.tsx

기존 7단계 → 10단계:

| Step | 내용 | 상태 |
|------|------|------|
| 0 | 이용권 확인 게이트 | 신규 |
| 1 | 판사 이름 입력 | 기존 |
| 2-7 | 성향 6문항 | 기존 |
| 8 | 기타 요청사항 (textarea) | 신규 |
| 9 | AI 생성 중 (로딩) | 신규 |
| 10 | 미리보기 + 확인/재생성 | 신규 |

### judges/create/page.tsx

- 이용권 없으면 구매 유도 UI 표시
- 구매 후 위자드 진입

### JudgeCard.tsx / JudgeSelector.tsx

- `avatar_url`이 있으면 이미지 표시
- 없으면 기존 이니셜 아바타 유지 (하위 호환)

### my/judges/page.tsx

- 아바타 이미지 표시

---

## 미결정 사항

| 항목 | 선택지 | 비고 |
|------|--------|------|
| 이용권 가격 (토큰) | 5? 10? 15? | 토큰 획득 난이도 고려 |
| 토스 IAP 병행 여부 | 토큰만 / IAP도 | 앱인토스 IAP 설정 필요 |
| 이미지 재생성 횟수 | 1회? 3회? 무제한? | 이용권 1장당 |
| 이미지 생성 모델 | gemini-2.0-flash-exp | 안정성 확인 필요 |
| Supabase Storage 버킷 | 수동 생성 필요 | Dashboard에서 생성 |
| 기존 판사 아바타 | 기본 이미지 / 이니셜 유지 | 공식 판사는 별도 이미지? |

---

## 파일 변경 목록

### 신규 생성
- `supabase/migrations/00X_judge_avatar_tickets.sql`
- `supabase/functions/judge-ticket-purchase/index.ts`
- `src/lib/api/judgeTickets.ts`

### 수정
- `supabase/functions/judge-create/index.ts` - 이용권 검증 + 이미지 생성
- `supabase/functions/_shared/gemini.ts` - 이미지 생성 함수 추가
- `src/types/database.ts` - Judge에 avatar_url, Profile에 judge_tickets
- `src/lib/schemas.ts` - 스키마 업데이트
- `src/components/judge/JudgeCreateWizard.tsx` - 전체 리뉴얼
- `src/app/judges/create/page.tsx` - 이용권 게이트 추가
- `src/components/judge/JudgeCard.tsx` - 아바타 이미지 표시
- `src/components/judge/JudgeSelector.tsx` - 아바타 이미지 표시
- `src/app/judges/page.tsx` - 목록에서 아바타 표시
- `src/app/my/judges/page.tsx` - 내 판사 아바타 표시
