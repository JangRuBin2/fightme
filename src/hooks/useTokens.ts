'use client';

import { useCallback, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { getTokenBalance, watchAdForTokens, checkPremiumMonthly } from '@/lib/api/tokens';

export function useTokens() {
  const { tokenBalance, setTokenBalance, adjustTokens, isLoggedIn } = useStore();

  const refresh = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      // Check premium monthly grant first (on-demand)
      const premiumResult = await checkPremiumMonthly();
      if (premiumResult.granted && premiumResult.tokenBalance !== null) {
        setTokenBalance(premiumResult.tokenBalance);
        return;
      }

      const balance = await getTokenBalance();
      if (balance !== null) {
        setTokenBalance(balance);
      }
    } catch {
      // silent fail - keep existing store value
    }
  }, [isLoggedIn, setTokenBalance]);

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
