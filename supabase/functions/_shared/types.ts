import type { SupabaseClient as _SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Re-export SupabaseClient type for use across edge functions
export type SupabaseClient = _SupabaseClient;

// === Profile Types ===

export interface Profile {
  id: string;
  nickname: string | null;
  token: number;
  is_premium: boolean;
  premium_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// === Judge Types ===

export interface Judge {
  id: string;
  name: string;
  description: string | null;
  prompt: string;
  is_user_created: boolean;
  is_approved: boolean;
  reject_reason: string | null;
  score: number;
  usage_count: number;
  created_by: string | null;
  created_at: string;
}

// === Fight Types (verdicts merged) ===

export interface OriginalVerdict {
  judge_id: string;
  user_fault: number | null;
  opponent_fault: number | null;
  comment: string | null;
  verdict_detail: string | null;
  defense: string | null;
}

export interface Fight {
  id: string;
  user_id: string;
  judge_id: string;
  user_name: string | null;
  opponent_name: string | null;
  user_claim: string;
  opponent_claim: string;
  user_fault: number | null;
  opponent_fault: number | null;
  comment: string | null;
  verdict_detail: string | null;
  stage: 'INITIAL' | 'APPEAL';
  defense: string | null;
  original_verdict: OriginalVerdict | null;
  is_revealed: boolean;
  created_at: string;
}

// === AI Response Types ===

export interface JudgmentResponse {
  user_fault: number;
  opponent_fault: number;
  comment: string;
  verdict_detail: string;
}

export interface DefenseResponse {
  defense_text: string;
}

// === Judge Vote Types ===

export interface JudgeVote {
  id: string;
  user_id: string;
  judge_id: string;
  is_upvote: boolean;
  created_at: string;
}

// === Token Types ===

export type TokenReason =
  | 'SIGNUP_BONUS'
  | 'AD_REWARD'
  | 'FIGHT_JUDGE'
  | 'FIGHT_REVEAL'
  | 'FIGHT_DETAIL'
  | 'FIGHT_APPEAL'
  | 'FIGHT_DEFENSE_AI'
  | 'FIGHT_DEFENSE_SELF'
  | 'JUDGE_CREATE'
  | 'IAP_PURCHASE';

export interface TokenLog {
  id: string;
  user_id: string;
  amount: number;
  reason: TokenReason;
  created_at: string;
}
