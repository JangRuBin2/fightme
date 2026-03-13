# 사용자가 해야 할 작업 목록

---

## 완료된 항목

### Supabase
- [x] Supabase 프로젝트 생성
- [x] `.env.local` 생성 및 키 입력
- [x] `supabase link` 완료
- [x] DB 마이그레이션 실행
- [x] Edge Functions 전체 배포 (12개)

### 시크릿 등록 (모두 완료)
- [x] `GOOGLE_AI_API_KEY`
- [x] `TOSS_DISCONNECT_AUTH`
- [x] `TOSS_AUTH_SECRET`
- [x] `TOSS_DECRYPT_KEY`
- [x] `APPS_IN_TOSS_API_URL`
- [x] `APPS_IN_TOSS_MTLS_CERT`
- [x] `APPS_IN_TOSS_MTLS_KEY`

### Frontend
- [x] 3개 테마 시스템, 네비게이션, MY 페이지
- [x] 서비스 이용약관 페이지 (`/terms/`)
- [x] AI: Gemini 2.5 Flash 전환
- [x] SDK 2.x 업그레이드

---

## 다음 할 일 (순서대로)

### 1. 토스 콘솔 설정 (사용자)
- [ ] **연결 끊기 콜백 테스트 통과** (CORS 수정 + 시크릿 등록 완료, 재시도)
- [ ] **약관 URL 등록**: `https://fightme.apps.tossmini.com/terms/`
- [ ] **OAuth2 설정** (콜백 URL 등록)
- [ ] 앱 기본 정보 입력 (이름, 썸네일, 키워드)

### 2. 앱 아이콘 & 리소스 (사용자)
- [ ] `granite.config.ts`의 `brand.icon` 경로 설정 (현재 빈 문자열)
- [ ] `public/og-default.png` OG 이미지 (1200x600px)
- [ ] 가로형 썸네일 (1932x828px) for 토스 콘솔

### 3. .ait 빌드 & 배포
```bash
pnpm build:ait
# 생성된 fightme.ait → 토스 Partner Console에 업로드
```

### 4. 검수 전 테스트
- [ ] 토스 앱에서 로그인 플로우
- [ ] 판사 선택 -> 주장 입력 -> 판결 결과
- [ ] 항소/변론 기능
- [ ] 판결 공유
- [ ] 토큰 차감/충전

### 5. 검수 제출
- [ ] Partner Console에서 심사 요청

---

## 기술 현황

| 항목 | 상태 |
|------|------|
| AI 엔진 | Gemini 2.5 Flash |
| SDK 버전 | @apps-in-toss 2.0.5 |
| Supabase | aqnegjrzsngxqvedxoow |
| Edge Functions | 12개 배포 완료 |
| 시크릿 | 11개 등록 완료 |
| 테마 | 3개 (warm, dark-court, neon-fight) |
