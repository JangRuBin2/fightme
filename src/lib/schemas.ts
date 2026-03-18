// Zod schemas for runtime validation of server responses
import { z } from 'zod';

// ── Base entity schemas ──

const defenseSectionSchema = z.object({
  side: z.enum(['user', 'opponent']),
  text: z.string(),
});

const defenseDataSchema = z.object({
  sections: z.array(defenseSectionSchema),
});

const originalVerdictSchema = z.object({
  judge_id: z.string(),
  user_fault: z.number().nullable(),
  opponent_fault: z.number().nullable(),
  comment: z.string().nullable(),
  verdict_detail: z.string().nullable(),
  defense: defenseDataSchema.nullable().optional(),
});

export const fightSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  judge_id: z.string(),
  user_name: z.string().nullable().optional(),
  opponent_name: z.string().nullable().optional(),
  user_claim: z.string(),
  opponent_claim: z.string(),
  user_fault: z.number().nullable(),
  opponent_fault: z.number().nullable(),
  comment: z.string().nullable(),
  verdict_detail: z.string().nullable(),
  stage: z.enum(['INITIAL', 'APPEAL']),
  defense: defenseDataSchema.nullable().optional(),
  original_verdict: originalVerdictSchema.nullable().optional(),
  is_revealed: z.boolean(),
  detail_unlocked: z.boolean().optional(),
  created_at: z.string(),
});

export const judgeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  prompt: z.string(),
  is_user_created: z.boolean(),
  is_approved: z.boolean(),
  reject_reason: z.string().nullable(),
  score: z.number(),
  usage_count: z.number(),
  created_by: z.string().nullable(),
  created_at: z.string(),
});

// ── DB direct query schemas ──

export const judgeVoteSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  judge_id: z.string(),
  is_upvote: z.boolean(),
  created_at: z.string(),
});

export const tokenLogSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  amount: z.number(),
  reason: z.string(),
  created_at: z.string(),
});

export const profileTokenSchema = z.object({
  token: z.number(),
});

/**
 * Safe parse helpers for Supabase direct queries.
 * Zod 검증 실패 시 로그 출력 + raw data fallback (데이터 유실 방지).
 */
export function safeParseArray<T>(schema: z.ZodType<T>, data: unknown[]): T[] {
  return data.map((item) => {
    const result = schema.safeParse(item);
    if (result.success) return result.data;
    console.warn('[Zod] array item validation failed:', result.error.issues);
    return item as T;
  });
}

export function safeParseSingle<T>(schema: z.ZodType<T>, data: unknown): T | null {
  if (!data) return null;
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  console.warn('[Zod] single validation failed:', result.error.issues);
  return data as T; // fallback: 검증 실패해도 raw data 반환
}

// ── Edge Function response schemas ──

export const createFightResponseSchema = z.object({
  fight: fightSchema,
});

export const revealFightResponseSchema = z.object({
  fight: fightSchema,
  tokenBalance: z.number(),
});

export const fightDetailResponseSchema = z.object({
  verdict_detail: z.string(),
  tokenBalance: z.number(),
});

export const publicFightResponseSchema = z.object({
  success: z.boolean(),
  fight: fightSchema,
  judge: judgeSchema,
});

export const appealResponseSchema = z.object({
  fight: fightSchema,
  tokenBalance: z.number(),
});

export const defenseResponseSchema = z.object({
  defense: defenseDataSchema,
  defense_text: z.string(),
  fight: fightSchema,
  tokenBalance: z.number(),
});

export const createJudgeResponseSchema = z.object({
  judge: judgeSchema,
  approved: z.boolean(),
  reviewReason: z.string(),
  tokenBalance: z.number(),
});

export const judgeManageResponseSchema = z.object({
  success: z.boolean(),
  approved: z.boolean().optional(),
  reviewReason: z.string().optional(),
});

export const adRewardResponseSchema = z.object({
  amount: z.number(),
  tokenBalance: z.number(),
});

export const premiumCheckResponseSchema = z.object({
  granted: z.boolean(),
  tokenBalance: z.number().nullable(),
  grantedAmount: z.number().optional(),
});

export const deleteAccountResponseSchema = z.object({
  success: z.boolean(),
});

// ── Auth response schema ──

export const authSessionSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number().optional(),
});

export const iapActivateResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    orderId: z.string(),
    sku: z.string(),
    activatedAt: z.string(),
    tokenBalance: z.number().optional(),
    isPremium: z.boolean().optional(),
  }).optional(),
  error: z.string().optional(),
});

export const authResponseSchema = z.object({
  success: z.boolean(),
  session: authSessionSchema.optional(),
  user: z.object({
    id: z.string(),
    email: z.string().optional(),
  }).optional(),
  isNewUser: z.boolean().optional(),
  error: z.string().optional(),
});
