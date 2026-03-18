import type { SupabaseClient, TokenReason } from './types.ts';

/**
 * Check if user has enough tokens
 */
export async function checkTokenBalance(
  supabase: SupabaseClient,
  userId: string,
  required: number
): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('token')
    .eq('id', userId)
    .single();

  return (data?.token ?? 0) >= required;
}

/**
 * Spend tokens. Read current balance, check, then write decremented value.
 * Returns new balance or null if insufficient.
 */
export async function spendTokens(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  reason: TokenReason
): Promise<number | null> {
  // Read current balance
  const { data: profile, error: readError } = await supabase
    .from('profiles')
    .select('token')
    .eq('id', userId)
    .single();

  if (readError || !profile) return null;

  const currentBalance = profile.token ?? 0;
  if (currentBalance < amount) return null;

  const newBalance = currentBalance - amount;

  // Write decremented balance
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ token: newBalance, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (updateError) return null;

  // Log the spend
  await supabase.from('token_logs').insert({
    user_id: userId,
    amount: -amount,
    reason,
  });

  return newBalance;
}

/**
 * Grant tokens to user.
 */
export async function grantTokens(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  reason: TokenReason
): Promise<number | null> {
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('token')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) return null;

  const newBalance = (profile.token ?? 0) + amount;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ token: newBalance, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (updateError) return null;

  await supabase.from('token_logs').insert({
    user_id: userId,
    amount,
    reason,
  });

  return newBalance;
}

const PREMIUM_MONTHLY_AMOUNT = 50;

/**
 * Calculate how many months of premium tokens are owed.
 * Counts from the month after lastGrant up to and including the current month.
 */
function calcOwedMonths(lastGrant: Date | null, now: Date): number {
  if (!lastGrant) return 1; // First grant ever

  const lastYear = lastGrant.getUTCFullYear();
  const lastMonth = lastGrant.getUTCMonth(); // 0-based
  const nowYear = now.getUTCFullYear();
  const nowMonth = now.getUTCMonth();

  const months = (nowYear - lastYear) * 12 + (nowMonth - lastMonth);
  return Math.max(0, months);
}

/**
 * Check if premium user has unclaimed monthly tokens.
 * Grants 50 tokens x number of missed months (cumulative).
 * Returns { newBalance, grantedAmount } if granted, null if nothing owed.
 */
export async function checkAndGrantPremiumMonthly(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ newBalance: number; grantedAmount: number } | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('token, is_premium, last_premium_grant')
    .eq('id', userId)
    .single();

  if (error || !profile || !profile.is_premium) return null;

  const now = new Date();
  const lastGrant = profile.last_premium_grant
    ? new Date(profile.last_premium_grant)
    : null;

  const owedMonths = calcOwedMonths(lastGrant, now);
  if (owedMonths <= 0) return null;

  const grantedAmount = PREMIUM_MONTHLY_AMOUNT * owedMonths;
  const newBalance = (profile.token ?? 0) + grantedAmount;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      token: newBalance,
      last_premium_grant: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', userId)
    .eq('is_premium', true);

  if (updateError) return null;

  await supabase.from('token_logs').insert({
    user_id: userId,
    amount: grantedAmount,
    reason: 'PREMIUM_MONTHLY' as TokenReason,
  });

  return { newBalance, grantedAmount };
}
