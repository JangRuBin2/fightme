// Token API functions

import { createClient } from '@/lib/supabase/client';
import { callEdgeFunction } from './edge';
import {
  adRewardResponseSchema,
  premiumCheckResponseSchema,
  deleteAccountResponseSchema,
  profileTokenSchema,
  tokenLogSchema,
  safeParseArray,
  safeParseSingle,
} from '@/lib/schemas';
import type { TokenLog } from '@/types/database';

// Get token balance (Zod validated)
export async function getTokenBalance(): Promise<number | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('token')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;

  const parsed = safeParseSingle(profileTokenSchema, data);
  return parsed?.token ?? 0;
}

// Watch ad for token reward
export async function watchAdForTokens() {
  return callEdgeFunction('token-ad-reward', adRewardResponseSchema);
}

// Check and grant premium monthly tokens (on-demand)
export async function checkPremiumMonthly(): Promise<{ granted: boolean; tokenBalance: number | null }> {
  try {
    return await callEdgeFunction('token-premium-check', premiumCheckResponseSchema);
  } catch {
    return { granted: false, tokenBalance: null };
  }
}

// Get token logs (Zod validated)
export async function getTokenLogs(limit = 20): Promise<TokenLog[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('token_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return safeParseArray(tokenLogSchema, data ?? []) as TokenLog[];
}

// Delete account (calls auth-delete-account Edge Function)
export async function deleteAccount(): Promise<boolean> {
  try {
    await callEdgeFunction('auth-delete-account', deleteAccountResponseSchema);
    return true;
  } catch {
    return false;
  }
}
