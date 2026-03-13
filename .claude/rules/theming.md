# 테마 시스템 가이드 (필수 참조)

프론트엔드 화면 개발 시 반드시 테마 호환성을 고려해야 합니다.

## 테마 구조

3개 테마가 CSS 변수로 정의되어 있으며, `html[data-theme]` 속성으로 전환됩니다.

| 테마 ID | 이름 | 특징 |
|---------|------|------|
| `warm` (기본) | Warm Verdict | 라이트, 따뜻한 톤 (테라코타 + 올리브) |
| `dark-court` | Dark Court | 다크, 법정 느낌 (보라 + 골드) |
| `neon-fight` | Neon Fight | 다크, 대결 느낌 (핫핑크 + 시안) |

## 색상 사용 규칙

### 반드시 Tailwind 시맨틱 컬러만 사용

```tsx
// GOOD - 테마에 따라 자동 변경됨
<div className="bg-gray-50 text-gray-900" />
<div className="bg-primary-400 text-white" />
<div className="border-gray-200" />

// BAD - 하드코딩된 색상은 테마 전환 시 깨짐
<div className="bg-[#FAFAF7]" />
<div style={{ color: '#333' }} />
<div className="bg-white" />  // bg-white는 테마 불변, 대신 카드 배경은 var(--color-card) 사용
```

### 사용 가능한 시맨틱 컬러

| 용도 | Tailwind 클래스 | 설명 |
|------|----------------|------|
| 주요 액션/강조 | `primary-50` ~ `primary-900` | 버튼, 활성 탭, 선택 상태 |
| 보조 강조 | `accent-50` ~ `accent-900` | 토큰, 골드, 상대측 게이지 |
| 텍스트/배경/보더 | `gray-50` ~ `gray-900` | 모든 중립 색상 |

### 배경색 계층

| 계층 | 라이트 테마 | 다크 테마 | 사용법 |
|------|-----------|----------|--------|
| 페이지 배경 | 밝은 회색 | 거의 검정 | `globals.css`의 `body` 스타일 (자동 적용) |
| 카드 배경 | 흰색 | 어두운 남색 | `.card` 클래스 사용 |
| 입력 필드 배경 | 연한 회색 | 더 어두운 배경 | `bg-gray-100` |
| 보더 | 연한 라인 | 어두운 라인 | `border-gray-200` 또는 `border-gray-100` |

## CSS 변수 직접 사용 (특수 케이스)

Tailwind 클래스로 해결 안 되는 경우에만 CSS 변수를 직접 참조합니다.

```tsx
// 반투명 배경 (backdrop-blur 등)
<nav style={{ backgroundColor: 'var(--color-nav-bg)' }} />

// 카드 배경 직접 참조
<div style={{ backgroundColor: 'var(--color-card)' }} />
```

### 사용 가능한 CSS 변수

```
--color-primary-{50~900}
--color-accent-{50~900}
--color-gray-{50~900}
--color-bg          // 페이지 배경
--color-card        // 카드 배경
--color-card-border // 카드 보더
--color-nav-bg      // 네비게이션 반투명 배경
```

## 컴포넌트 작성 체크리스트

새 컴포넌트나 페이지를 만들 때 확인할 사항:

1. **`bg-white` 사용 금지** - 카드/모달 배경은 `.card` 클래스 또는 `var(--color-card)` 사용
2. **`text-black` 사용 금지** - 대신 `text-gray-900` 사용
3. **하드코딩 HEX/RGB 금지** - `bg-[#xxx]`, `text-[#xxx]`, `style={{ color }}` 사용 금지
4. **모달/바텀시트 오버레이** - `bg-black/40`은 허용 (반투명 오버레이는 테마 무관)
5. **그림자** - `shadow-sm`, `shadow-lg` 등 Tailwind 기본값 사용 (다크에서도 동작)
6. **보더** - `border-gray-100` 또는 `border-gray-200` 사용

## 테마 상태 접근

```tsx
import { useStore } from '@/store/useStore';

// 현재 테마 읽기
const theme = useStore((s) => s.theme); // 'warm' | 'dark-court' | 'neon-fight'

// 테마별 분기가 필요한 경우 (최소화할 것)
const isDark = theme === 'dark-court' || theme === 'neon-fight';
```

## 테마 정의 위치

- CSS 변수 정의: `src/app/globals.css` (`:root` 및 `html[data-theme]`)
- Tailwind 매핑: `tailwind.config.ts` (`colors` 섹션)
- 상태 관리: `src/store/useStore.ts` (`theme`, `setTheme`)
- HTML 적용: `src/app/layout.tsx` (`data-theme` 속성)
- 선택 UI: `src/app/settings/page.tsx` (테마 선택 카드)
