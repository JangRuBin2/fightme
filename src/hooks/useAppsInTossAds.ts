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
  const isAvailable = typeof window !== 'undefined' && isAdMobSupported();
  const setTokenBalance = useStore((s) => s.setTokenBalance);

  const handleLoadRewardedAd = useCallback(
    async (adGroupId: AdGroupId = AD_GROUP_IDS.FIGHT_REWARDED): Promise<boolean> => {
      if (!isAvailable) return false;

      setAdState('loading');
      const result = await loadRewardedAd(adGroupId);

      if (result.type === 'success') {
        setAdState('loaded');
        return true;
      }

      setAdState('error');
      return false;
    },
    [isAvailable]
  );

  const handleShowRewardedAd = useCallback(
    async (adGroupId: AdGroupId = AD_GROUP_IDS.FIGHT_REWARDED): Promise<AdShowResult> => {
      if (!isAvailable) {
        return {
          type: 'error',
          adType: 'rewarded',
          errorCode: 'SDK_NOT_AVAILABLE',
          errorMessage: 'AdMob not supported in this environment',
        };
      }

      setAdState('showing');
      const result = await showRewardedAd(adGroupId);

      setAdState('idle');
      return result;
    },
    [isAvailable]
  );

  // Watch ad and receive token reward
  const watchAdForTokenReward = useCallback(
    async (adGroupId: AdGroupId = AD_GROUP_IDS.FIGHT_REWARDED): Promise<boolean> => {
      const loaded = await handleLoadRewardedAd(adGroupId);
      if (!loaded) return false;

      const result = await handleShowRewardedAd(adGroupId);

      if (result.type === 'success' && result.rewarded) {
        // Call token-ad-reward edge function
        try {
          const tokenResult = await watchAdForTokens();
          setTokenBalance(tokenResult.tokenBalance);
          return true;
        } catch {
          return false;
        }
      }

      return false;
    },
    [handleLoadRewardedAd, handleShowRewardedAd, setTokenBalance]
  );

  return {
    isAvailable,
    adState,
    loadRewardedAd: handleLoadRewardedAd,
    showRewardedAd: handleShowRewardedAd,
    watchAdForTokenReward,
  };
}
