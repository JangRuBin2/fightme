'use client';

import { useState, useCallback } from 'react';
import {
  isAdMobSupported,
  loadRewardedAd,
  showRewardedAd,
} from '@/lib/apps-in-toss/ads';
import type { AdState, AdShowResult, AdGroupId } from '@/types/apps-in-toss-ads';
import { AD_GROUP_IDS } from '@/types/apps-in-toss-ads';
import { watchAdForTokens } from '@/lib/api/tokens';
import { useStore } from '@/store/useStore';

interface UseAppsInTossAdsReturn {
  isAvailable: boolean;
  adState: AdState;
  loadRewardedAd: (adGroupId?: AdGroupId) => Promise<boolean>;
  showRewardedAd: (adGroupId?: AdGroupId) => Promise<AdShowResult>;
  watchAdForTokenReward: (adGroupId?: AdGroupId) => Promise<boolean>;
}

export function useAppsInTossAds(): UseAppsInTossAdsReturn {
  const [adState, setAdState] = useState<AdState>('idle');
  const setTokenBalance = useStore((s) => s.setTokenBalance);

  // 매 호출 시점에 지원 여부 확인 (초기화 시점 고정 방지)
  const checkAvailable = () => typeof window !== 'undefined' && isAdMobSupported();

  const handleLoadRewardedAd = useCallback(
    async (adGroupId: AdGroupId = AD_GROUP_IDS.FIGHT_REWARDED): Promise<boolean> => {
      if (!checkAvailable()) return false;

      setAdState('loading');
      const result = await loadRewardedAd(adGroupId);

      if (result.type === 'success') {
        setAdState('loaded');
        return true;
      }

      setAdState('error');
      return false;
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleShowRewardedAd = useCallback(
    async (adGroupId: AdGroupId = AD_GROUP_IDS.FIGHT_REWARDED): Promise<AdShowResult> => {
      if (!checkAvailable()) {
        return {
          type: 'error',
          adType: 'rewarded',
          errorCode: 'SDK_NOT_AVAILABLE',
          errorMessage: '토스 앱에서만 광고를 시청할 수 있습니다',
        };
      }

      setAdState('showing');
      const result = await showRewardedAd(adGroupId);

      setAdState('idle');
      return result;
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Watch ad and receive token reward
  // Throws on edge function failure so callers can show the error message
  const watchAdForTokenReward = useCallback(
    async (adGroupId: AdGroupId = AD_GROUP_IDS.FIGHT_REWARDED): Promise<boolean> => {
      const loaded = await handleLoadRewardedAd(adGroupId);
      if (!loaded) {
        throw new Error('광고를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      }

      const result = await handleShowRewardedAd(adGroupId);

      if (result.type === 'error') {
        throw new Error(result.errorMessage || '광고 재생 중 오류가 발생했습니다.');
      }

      if (result.type === 'success' && result.rewarded) {
        // Throws if edge function fails (rate limit, network, etc.)
        const tokenResult = await watchAdForTokens();
        setTokenBalance(tokenResult.tokenBalance);
        return true;
      }

      // 광고는 봤지만 보상 조건 미충족 (일찍 닫음 등)
      return false;
    },
    [handleLoadRewardedAd, handleShowRewardedAd, setTokenBalance]
  );

  return {
    isAvailable: checkAvailable(),
    adState,
    loadRewardedAd: handleLoadRewardedAd,
    showRewardedAd: handleShowRewardedAd,
    watchAdForTokenReward,
  };
}
