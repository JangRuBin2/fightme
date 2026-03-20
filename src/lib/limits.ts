// Character limits per field, based on premium status.
// null = no limit (premium users)

interface CharLimits {
  userName: number | null;
  opponentName: number | null;
  userClaim: number | null;
  opponentClaim: number | null;
  defenseSelf: number | null;
  judgeName: number | null;
  speechStyle: number | null;
  judgeAnswer: number | null;
}

const FREE_LIMITS: CharLimits = {
  userName: 10,
  opponentName: 10,
  userClaim: 100,
  opponentClaim: 100,
  defenseSelf: 300,
  judgeName: 5,
  speechStyle: 200,
  judgeAnswer: 100,
};

const PREMIUM_LIMITS: CharLimits = {
  userName: null,
  opponentName: null,
  userClaim: null,
  opponentClaim: null,
  defenseSelf: null,
  judgeName: null,
  speechStyle: null,
  judgeAnswer: null,
};

export function getCharLimits(isPremium: boolean): CharLimits {
  return isPremium ? PREMIUM_LIMITS : FREE_LIMITS;
}

export type { CharLimits };
