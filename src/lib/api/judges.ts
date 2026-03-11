// Judge API 함수
// Supabase DB 읽기 및 Edge Function 호출

import { createClient } from '@/lib/supabase/client';
import { callEdgeFunction } from './edge';
import type { Judge, JudgeVote } from '@/types/database';

export interface CreateJudgeWizardData {
  name: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
}

// 판사 목록 조회 (공식/유저 필터)
export async function getJudges(
  type: 'official' | 'user' | 'all' = 'all',
  sort: 'score' | 'recent' = 'score'
): Promise<Judge[]> {
  const supabase = createClient();

  let query = supabase
    .from('judges')
    .select('*')
    .eq('is_approved', true);

  if (type === 'official') {
    query = query.eq('is_user_created', false);
  } else if (type === 'user') {
    query = query.eq('is_user_created', true);
  }

  if (sort === 'score') {
    query = query.order('score', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

// 공식 판사 목록 조회
export async function getOfficialJudges(): Promise<Judge[]> {
  return getJudges('official', 'score');
}

// 판사 단건 조회
export async function getJudge(judgeId: string): Promise<Judge | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('judges')
    .select('*')
    .eq('id', judgeId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }

  return data;
}

// 내가 만든 판사 조회
export async function getMyJudges(): Promise<Judge[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('judges')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// 판사 생성 (MBTI 위자드 데이터) (Edge Function)
export async function createJudge(
  wizardData: CreateJudgeWizardData
): Promise<{ judge: Judge }> {
  return callEdgeFunction<{ judge: Judge }>('judge-create', {
    body: wizardData,
  });
}

// 판사 투표 (upsert, boolean)
export async function voteJudge(
  judgeId: string,
  isUpvote: boolean
): Promise<JudgeVote> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('judge_votes')
    .upsert(
      {
        user_id: user.id,
        judge_id: judgeId,
        is_upvote: isUpvote,
      },
      { onConflict: 'user_id,judge_id' }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// 사용자의 판사 투표 조회
export async function getUserVotes(
  judgeIds: string[]
): Promise<JudgeVote[]> {
  if (judgeIds.length === 0) return [];

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('judge_votes')
    .select('*')
    .eq('user_id', user.id)
    .in('judge_id', judgeIds);

  if (error) throw new Error(error.message);
  return data ?? [];
}
