/**
 * Toss 앱 공유 유틸리티
 * @apps-in-toss/web-framework 딥링크 공유
 *
 * NOTE: intoss:// 스킴은 앱 정식 출시 후에만 동작.
 * 출시 전 테스트는 intoss-private://appsintoss?_deploymentId=XXX 사용.
 */

import type { Fight, Verdict } from '@/types/database';
import { generateVerdictImage, saveVerdictImageToDevice } from './shareImage';

export function isTossEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  return /TossApp/i.test(navigator.userAgent);
}

/**
 * 판결 결과를 토스 딥링크로 공유
 */
export async function shareVerdict(
  fight: Fight,
  verdict: Verdict
): Promise<void> {
  const { getTossShareLink, share } = await import('@apps-in-toss/web-framework');

  const deepLink = `intoss://fightme/fight/${fight.id}`;
  const ogImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public/og-verdict.png`;
  const tossLink = await getTossShareLink(deepLink, ogImageUrl);
  await share({ message: tossLink });
}

/**
 * 판결 이미지를 생성하여 디바이스에 저장
 */
export async function saveVerdictImage(
  fight: Fight,
  verdict: Verdict,
  judge: { name: string }
): Promise<void> {
  const base64 = await generateVerdictImage(
    fight,
    verdict,
    judge as import('@/types/database').Judge
  );
  await saveVerdictImageToDevice(base64);
}
