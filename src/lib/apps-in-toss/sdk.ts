// 앱인토스 SDK 클라이언트 래퍼
// SDK는 @apps-in-toss/web-framework에서 import
// 내부적으로 ReactNativeWebView.postMessage() 브릿지로 네이티브와 통신

import { appLogin } from '@apps-in-toss/web-framework';

// 앱인토스 환경 감지
export function isAppsInTossEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('toss') || userAgent.includes('appintoss');
}

// 토스 로그인 (OAuth2 인가코드 획득)
export async function tossAppLogin(): Promise<{
  authorizationCode: string;
  referrer: string;
} | null> {
  // Retry once on "signal is aborted" error (transient SDK bridge issue)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await appLogin();
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt === 0 && msg.includes('abort')) {
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      return null;
    }
  }
  return null;
}
