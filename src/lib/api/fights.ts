// Fight API 함수
// Supabase Edge Function 호출 및 DB 직접 읽기

import { createClient } from '@/lib/supabase/client';
import { callEdgeFunction, callPublicEdgeFunction } from './edge';
import type { Fight, Judge } from '@/types/database';

export interface CreateFightResponse {
  fight: Fight;
}

// 싸움 생성 + 판결 요청 (Edge Function)
export async function createFight(
  userClaim: string,
  opponentClaim: string,
  judgeId: string
): Promise<CreateFightResponse> {
  return callEdgeFunction<CreateFightResponse>('fight-judge', {
    body: { user_claim: userClaim, opponent_claim: opponentClaim, judge_id: judgeId },
  });
}

// 싸움 단건 조회
export async function getFight(fightId: string): Promise<Fight | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('fights')
    .select('*')
    .eq('id', fightId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw new Error(error.message);
  }

  return data;
}

// 사용자 싸움 목록 조회
export async function getUserFights(userId: string): Promise<Fight[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('fights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// 결과 공개 (토큰 2 차감) (Edge Function)
export async function revealFight(
  fightId: string
): Promise<{ fight: Fight; tokenBalance: number }> {
  return callEdgeFunction<{ fight: Fight; tokenBalance: number }>('fight-reveal', {
    body: { fight_id: fightId },
  });
}

// 상세 보기 (토큰 1 차감) (Edge Function)
export async function getFightDetail(
  fightId: string
): Promise<{ verdict_detail: string; tokenBalance: number }> {
  return callEdgeFunction<{ verdict_detail: string; tokenBalance: number }>('fight-detail', {
    body: { fight_id: fightId },
  });
}

// 공개 결과 조회 (인증 불필요)
export async function getPublicFight(
  fightId: string
): Promise<{ fight: Fight; judge: Judge } | null> {
  try {
    const result = await callPublicEdgeFunction<{ success: boolean; fight: Fight; judge: Judge }>('fight-public', {
      body: { fight_id: fightId },
    });
    if (!result.success) return null;
    return { fight: result.fight, judge: result.judge };
  } catch {
    return null;
  }
}

// 항소 제출 (Edge Function)
export async function submitAppeal(
  fightId: string,
  judgeId?: string
): Promise<{ fight: Fight; tokenBalance: number }> {
  return callEdgeFunction<{ fight: Fight; tokenBalance: number }>('fight-appeal', {
    body: { fight_id: fightId, judge_id: judgeId },
  });
}

// 반론 제출 (Edge Function)
export async function submitDefense(
  fightId: string,
  defenseText: string | null,
  defenseType: 'ai' | 'self'
): Promise<{ defense_text: string; fight: Fight; tokenBalance: number }> {
  return callEdgeFunction<{ defense_text: string; fight: Fight; tokenBalance: number }>('fight-defense', {
    body: { fight_id: fightId, defense_text: defenseText, defense_type: defenseType },
  });
}
