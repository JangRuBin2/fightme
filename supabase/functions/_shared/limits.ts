// Character limits per field, based on premium status.
// 0 = no limit (premium users). Backend mirrors src/lib/limits.ts

interface CharLimits {
  userName: number;
  opponentName: number;
  userClaim: number;
  opponentClaim: number;
  defenseSelf: number;
  judgeName: number;
  speechStyle: number;
  judgeAnswer: number;
}

const FREE_LIMITS: CharLimits = {
  userName: 10,
  opponentName: 10,
  userClaim: 200,
  opponentClaim: 200,
  defenseSelf: 300,
  judgeName: 5,
  speechStyle: 200,
  judgeAnswer: 100,
};

// 0 means skip validation
const PREMIUM_LIMITS: CharLimits = {
  userName: 0,
  opponentName: 0,
  userClaim: 0,
  opponentClaim: 0,
  defenseSelf: 0,
  judgeName: 0,
  speechStyle: 0,
  judgeAnswer: 0,
};

export function getCharLimits(isPremium: boolean): CharLimits {
  return isPremium ? PREMIUM_LIMITS : FREE_LIMITS;
}

export async function checkPremium(
  supabaseAdmin: { from: (table: string) => any },
  userId: string,
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('is_premium')
    .eq('id', userId)
    .single();
  return data?.is_premium === true;
}

export type { CharLimits };
