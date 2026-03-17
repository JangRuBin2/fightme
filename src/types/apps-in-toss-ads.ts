// 앱인토스 광고 SDK 타입 정의
// https://developers-apps-in-toss.toss.im/ads/develop.html

export type AdType = 'interstitial' | 'rewarded';

export interface AdLoadResult {
  type: 'success' | 'error';
  adType: AdType;
  errorCode?: AdErrorCode;
  errorMessage?: string;
}

export interface AdShowResult {
  type: 'success' | 'error' | 'canceled';
  adType: AdType;
  rewarded?: boolean;
  errorCode?: AdErrorCode;
  errorMessage?: string;
}

export type AdErrorCode =
  | 'AD_NOT_LOADED'
  | 'AD_ALREADY_SHOWING'
  | 'AD_LOAD_FAILED'
  | 'AD_SHOW_FAILED'
  | 'USER_CANCELED'
  | 'NETWORK_ERROR'
  | 'SDK_NOT_AVAILABLE'
  | 'UNKNOWN_ERROR';

export type AdState = 'idle' | 'loading' | 'loaded' | 'showing' | 'error';

// 광고 그룹 ID 상수
export const AD_GROUP_IDS = {
  TEST_INTERSTITIAL: 'ait-ad-test-interstitial-id',
  TEST_REWARDED: 'ait-ad-test-rewarded-id',

  // 프로덕션 보상형 광고 ID (토큰 5개 보상)
  FIGHT_REWARDED: 'ait.v2.live.b16fc5093de345e2',
} as const;

export type AdGroupId = typeof AD_GROUP_IDS[keyof typeof AD_GROUP_IDS];

export const BANNER_AD_IDS = {
  TEST_BANNER: 'ait-ad-test-banner-id',

  // 프로덕션 배너 광고 ID
  HOME_BANNER: 'fightme.banner.home',
} as const;

export type BannerAdId = typeof BANNER_AD_IDS[keyof typeof BANNER_AD_IDS];
