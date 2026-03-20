'use client';

import { useCallback, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { getTokenBalance, watchAdForTokens, checkPremiumMonthly } from '@/lib/api/tokens';

export function useTokens() {
  const { tokenBalance, setTokenBalance, adjustTokens, isLoggedIn, setPremium } = useStore();

  const refresh = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      // Check premium monthly grant first (on-demand)
      const premiumResult = await checkPremiumMonthly();
      if (premiumResult.granted && premiumResult.tokenBalance !== null) {
        setTokenBalance(premiumResult.tokenBalance);
        setPremium(true);
        return;
      }

      const balance = await getTokenBalance();
      if (balance !== null) {
        setTokenBalance(balance);
      }

      // Sync premium status
      const { checkPremiumStatus } = await import('@/lib/api/tokens');
      const premium = await checkPremiumStatus();
      setPremium(premium);
    } catch {
      // silent fail - keep existing store value
    }
  }, [isLoggedIn, setTokenBalance, setPremium]);

  // Refresh on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  const canAfford = useCallback(
    (cost: number) => tokenBalance >= cost,
    [tokenBalance]
  );

  const spend = useCallback(
    (amount: number) => {
      adjustTokens(-amount);
    },
    [adjustTokens]
  );

  const earn = useCallback(
    (amount: number) => {
      adjustTokens(amount);
    },
    [adjustTokens]
  );

  const earnFromAd = useCallback(async (): Promise<boolean> => {
    try {
      const result = await watchAdForTokens();
      setTokenBalance(result.tokenBalance);
      return true;
    } catch {
      return false;
    }
  }, [setTokenBalance]);

  return {
    balance: tokenBalance,
    canAfford,
    spend,
    earn,
    earnFromAd,
    refresh,
  };
}
