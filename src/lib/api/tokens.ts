// Token API 함수

import { createClient } from '@/lib/supabase/client';
import { callEdgeFunction } from './edge';
import type { TokenLog } from '@/types/database';

// 토큰 잔액 조회
export async function getTokenBalance(): Promise<number> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data, error } = await supabase
    .from('profiles')
    .select('token')
    .eq('id', user.id)
    .single();

  if (error) return 0;
  return data?.token ?? 0;
}

// 광고 시청 후 토큰 지급
export async function watchAdForTokens(): Promise<{
  amount: number;
  tokenBalance: number;
}> {
  return callEdgeFunction<{ amount: number; tokenBalance: number }>('token-ad-reward');
}

// 토큰 사용 내역 조회
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
