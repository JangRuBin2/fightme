// FightMe 데이터베이스 타입 정의
// Supabase 스키마와 1:1 매칭

export interface Profile {
  id: string;
  nickname: string | null;
  token: number;
  is_premium: boolean;
  premium_expires_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

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

export interface DefenseSection {
  side: 'user' | 'opponent';
  text: string;
}

export interface DefenseData {
  sections: DefenseSection[];
}

export interface OriginalVerdict {
  judge_id: string;
  user_fault: number | null;
  opponent_fault: number | null;
  comment: string | null;
  verdict_detail: string | null;
  defense: DefenseData | null;
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
  defense: DefenseData | null;
  original_verdict: OriginalVerdict | null;
  is_revealed: boolean;
  created_at: string;
}

export interface JudgeVote {
  id: string;
  user_id: string;
  judge_id: string;
  is_upvote: boolean;
  created_at: string;
}

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
  | 'IAP_PURCHASE'
  | 'PREMIUM_MONTHLY';

export interface TokenLog {
  id: string;
  user_id: string;
  amount: number;
  reason: TokenReason;
  created_at: string;
}

// Supabase 제네릭 타입
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      judges: {
        Row: Judge;
        Insert: Omit<Judge, 'id' | 'score' | 'usage_count' | 'created_at'>;
        Update: Partial<Omit<Judge, 'id' | 'created_at'>>;
      };
      fights: {
        Row: Fight;
        Insert: Omit<Fight, 'id' | 'created_at'>;
        Update: Partial<Omit<Fight, 'id' | 'user_id' | 'created_at'>>;
      };
      judge_votes: {
        Row: JudgeVote;
        Insert: Omit<JudgeVote, 'id' | 'created_at'>;
        Update: Partial<Pick<JudgeVote, 'is_upvote'>>;
      };
      token_logs: {
        Row: TokenLog;
        Insert: Omit<TokenLog, 'id' | 'created_at'>;
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
