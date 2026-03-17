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
