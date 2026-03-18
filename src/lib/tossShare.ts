/**
 * Toss 앱 공유 유틸리티
 *
 * - 토스 환경: getTossShareLink + share (딥링크 + OG 이미지)
 * - 테스트/브라우저: Web Share API / clipboard fallback
 *
 * intoss:// 스킴은 앱 정식 출시 후에만 동작.
 * 출시 전 테스트는 intoss-private://appsintoss?_deploymentId=XXX 사용.
 */

const APP_NAME = 'fightme';
const OG_IMAGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/og-image/share.png`;

export function isTossEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  return /toss|appintoss/i.test(navigator.userAgent);
}

function buildDeepLink(path: string): string {
  return `intoss://${APP_NAME}${path}`;
}

/**
 * 토스 공유 링크를 생성하고 share() 호출.
 * OG 이미지를 Canvas로 생성 → Storage 업로드 → 공유 링크에 포함.
 * 토스 환경이 아니면 Web Share API / clipboard fallback.
 */
export async function shareFightResult(
  fightId: string,
  comment?: string,
): Promise<'shared' | 'copied' | 'failed'> {
  // 토스 환경: getTossShareLink + share (고정 OG 이미지)
  if (isTossEnvironment()) {
    try {
      const { getTossShareLink, share } = await import('@apps-in-toss/web-framework');
      const deepLink = buildDeepLink(`/result/${fightId}`);
      const tossLink = await getTossShareLink(deepLink, OG_IMAGE_URL);
      const message = comment
        ? `"${comment}" - 나도 판결받아보기!\n${tossLink}`
        : `AI 판사의 판결 결과를 확인해보세요!\n${tossLink}`;
      await share({ message });
      return 'shared';
    } catch {
      // SDK 실패 시 fallback
    }
  }

  // 브라우저/테스트 환경: Web Share API
  const shareUrl = `${window.location.origin}/result/?id=${fightId}`;
  const shareData: ShareData = {
    title: '나랑 싸울래? - AI 판결 결과',
    text: comment ? `"${comment}" - 나도 판결받아보기!` : 'AI 판사의 판결 결과를 확인해보세요!',
    url: shareUrl,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return 'shared';
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return 'failed';
  }

  // Clipboard fallback
  try {
    await navigator.clipboard.writeText(shareUrl);
    return 'copied';
  } catch {
    return 'failed';
  }
}
