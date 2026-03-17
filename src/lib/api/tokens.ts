// Token API functions

import { createClient } from '@/lib/supabase/client';
import { callEdgeFunction } from './edge';
import { adRewardResponseSchema } from '@/lib/schemas';
import type { TokenLog } from '@/types/database';

// Get token balance
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
  return data.token ?? 0;
}

// Watch ad for token reward
export async function watchAdForTokens() {
  return callEdgeFunction('token-ad-reward', adRewardResponseSchema);
}

// Get token logs
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
  return data ?? [];
}
