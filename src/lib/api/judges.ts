// Judge API functions
// Supabase DB reads + Edge Function calls

import { createClient } from '@/lib/supabase/client';
import { callEdgeFunction } from './edge';
import {
  createJudgeResponseSchema,
  judgeManageResponseSchema,
  judgeSchema,
  judgeVoteSchema,
  safeParseArray,
  safeParseSingle,
} from '@/lib/schemas';
import type { Judge, JudgeVote } from '@/types/database';

export interface CreateJudgeWizardData {
  name: string;
  speech_style: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
}

// Judge list (official/user filter) - Zod validated
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
  return safeParseArray(judgeSchema, data ?? []) as Judge[];
}

// Official judges
export async function getOfficialJudges(): Promise<Judge[]> {
  return getJudges('official', 'score');
}

// Single judge - Zod validated
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

  return safeParseSingle(judgeSchema, data) as Judge | null;
}

// My judges - Zod validated
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
  return safeParseArray(judgeSchema, data ?? []) as Judge[];
}

// Create judge (Edge Function)
export async function createJudge(wizardData: CreateJudgeWizardData) {
  return callEdgeFunction('judge-create', createJudgeResponseSchema, {
    body: wizardData,
  });
}

// Retry review for rejected/pending judge
export async function retryJudgeReview(judgeId: string) {
  return callEdgeFunction('judge-manage', judgeManageResponseSchema, {
    body: { action: 'retry', judge_id: judgeId },
  });
}

// Delete a judge
export async function deleteJudge(judgeId: string) {
  return callEdgeFunction('judge-manage', judgeManageResponseSchema, {
    body: { action: 'delete', judge_id: judgeId },
  });
}

// Vote on judge (upsert) - Zod validated
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

  const parsed = safeParseSingle(judgeVoteSchema, data);
  if (!parsed) throw new Error('Invalid vote response');
  return parsed as JudgeVote;
}

// Get user's votes for judges - Zod validated
export async function getUserVotes(judgeIds: string[]): Promise<JudgeVote[]> {
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
  return safeParseArray(judgeVoteSchema, data ?? []) as JudgeVote[];
}
