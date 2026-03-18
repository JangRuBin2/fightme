// Fight API functions
// Supabase Edge Function calls + DB direct reads

import { createClient } from '@/lib/supabase/client';
import { callEdgeFunction, callPublicEdgeFunction } from './edge';
import {
  createFightResponseSchema,
  revealFightResponseSchema,
  fightDetailResponseSchema,
  publicFightResponseSchema,
  appealResponseSchema,
  defenseResponseSchema,
  fightSchema,
  safeParseArray,
  safeParseSingle,
} from '@/lib/schemas';
import type { Fight, Judge } from '@/types/database';

// Create fight + request verdict (Edge Function)
export async function createFight(
  userClaim: string,
  opponentClaim: string,
  judgeId: string,
  userName?: string,
  opponentName?: string,
) {
  return callEdgeFunction('fight-judge', createFightResponseSchema, {
    body: {
      user_claim: userClaim,
      opponent_claim: opponentClaim,
      judge_id: judgeId,
      user_name: userName,
      opponent_name: opponentName,
    },
  });
}

// Get single fight (Zod validated)
export async function getFight(fightId: string): Promise<Fight | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('fights')
    .select('*')
    .eq('id', fightId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }

  return safeParseSingle(fightSchema, data) as Fight | null;
}

// Get user's fight list (Zod validated)
export async function getUserFights(userId: string): Promise<Fight[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('fights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return safeParseArray(fightSchema, data ?? []) as Fight[];
}

// Reveal verdict (spend 2 tokens) (Edge Function)
export async function revealFight(fightId: string) {
  return callEdgeFunction('fight-reveal', revealFightResponseSchema, {
    body: { fight_id: fightId },
  });
}

// Get verdict detail (spend 1 token) (Edge Function)
export async function getFightDetail(fightId: string) {
  return callEdgeFunction('fight-detail', fightDetailResponseSchema, {
    body: { fight_id: fightId },
  });
}

// Get public fight result (no auth needed)
export async function getPublicFight(
  fightId: string
): Promise<{ fight: Fight; judge: Judge } | null> {
  try {
    const result = await callPublicEdgeFunction(
      'fight-public',
      publicFightResponseSchema,
      { body: { fight_id: fightId } },
    );
    if (!result.success) return null;
    return { fight: result.fight, judge: result.judge };
  } catch {
    return null;
  }
}

// Submit appeal (Edge Function)
export async function submitAppeal(fightId: string, judgeId?: string) {
  return callEdgeFunction('fight-appeal', appealResponseSchema, {
    body: { fight_id: fightId, judge_id: judgeId },
  });
}

// Submit defense (Edge Function)
export async function submitDefense(
  fightId: string,
  defenseText: string | null,
  defenseType: 'ai' | 'self',
  defenseSide: 'user' | 'opponent' | 'both' = 'user',
) {
  return callEdgeFunction('fight-defense', defenseResponseSchema, {
    body: { fight_id: fightId, defense_text: defenseText, defense_type: defenseType, defense_side: defenseSide },
  });
}
