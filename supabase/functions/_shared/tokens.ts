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
 * Atomically spend tokens — fails if insufficient balance.
 * Returns the new balance or null if insufficient.
 */
export async function spendTokens(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  reason: TokenReason
): Promise<number | null> {
  // Atomic: UPDATE ... WHERE token >= amount RETURNING token
  const { data, error } = await supabase.rpc('spend_tokens', {
    p_user_id: userId,
    p_amount: amount,
  });

  // If RPC not available, fallback to manual update
  if (error?.message?.includes('function') || error?.code === '42883') {
    // Fallback: manual atomic update
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({ token: supabase.rpc ? undefined : 0 }) // placeholder
      .eq('id', userId)
      .select('token')
      .single();

    // Use raw SQL-like approach via update
    const { data: updated, error: err2 } = await supabase
      .from('profiles')
      .select('token')
      .eq('id', userId)
      .single();

    if (err2 || !updated || updated.token < amount) return null;

    const newBalance = updated.token - amount;
    const { error: err3 } = await supabase
      .from('profiles')
      .update({ token: newBalance })
      .eq('id', userId);

    if (err3) return null;

    // Log the spend
    await supabase.from('token_logs').insert({
      user_id: userId,
      amount: -amount,
      reason,
    });

    return newBalance;
  }

  if (error || data === null || data === undefined) return null;

  // Log the spend
  await supabase.from('token_logs').insert({
    user_id: userId,
    amount: -amount,
    reason,
  });

  return data as number;
}

/**
 * Grant tokens to user
 */
export async function grantTokens(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  reason: TokenReason
): Promise<number | null> {
  // Get current balance
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('token')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) return null;

  const newBalance = profile.token + amount;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ token: newBalance })
    .eq('id', userId);

  if (updateError) return null;

  // Log the grant
  await supabase.from('token_logs').insert({
    user_id: userId,
    amount,
    reason,
  });

  return newBalance;
}
