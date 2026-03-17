'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Swords,
  RotateCcw,
  Shield,
  Share2,
  Lock,
  Coins,
} from 'lucide-react';
import Link from 'next/link';
import VerdictCard from '@/components/fight/VerdictCard';
import TokenGate from '@/components/shared/TokenGate';
import ShareButton from '@/components/shared/ShareButton';
import { getFight, revealFight, getFightDetail } from '@/lib/api/fights';
import { getJudge } from '@/lib/api/judges';
import { useTokens } from '@/hooks/useTokens';
import { isInsufficientTokens, getErrorMessage } from '@/lib/errors';
import type { Fight, Judge } from '@/types/database';

export default function FightResultPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-3 border-primary-400 border-t-transparent rounded-full animate-spin" /></div>}>
      <FightResultContent />
    </Suspense>
  );
}

function FightResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fightId = searchParams.get('id');
  const [fight, setFight] = useState<Fight | null>(null);
  const [judge, setJudge] = useState<Judge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verdictDetail, setVerdictDetail] = useState<string | null>(null);
  const [isRevealLoading, setIsRevealLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const { balance, refresh } = useTokens();

  useEffect(() => {
    if (!fightId) {
      setError('판결 ID가 없습니다');
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const fightData = await getFight(fightId!);
        if (!fightData) {
          setError('판결을 찾을 수 없습니다');
          return;
        }
        setFight(fightData);

        const judgeData = await getJudge(fightData.judge_id);
        setJudge(judgeData);
      } catch {
        setError('데이터를 불러오는 데 실패했습니다');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [fightId]);

  const handleReveal = async () => {
    if (!fight || isRevealLoading) return;
    setIsRevealLoading(true);
    try {
      const result = await revealFight(fight.id);
      setFight(result.fight);
      await refresh();
    } catch (err) {
      if (isInsufficientTokens(err)) {
        setError('토큰이 부족합니다. 광고를 시청해주세요.');
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setIsRevealLoading(false);
    }
  };

  const handleRequestDetail = async () => {
    if (!fight || isDetailLoading) return;
    setIsDetailLoading(true);
    try {
      const result = await getFightDetail(fight.id);
      setVerdictDetail(result.verdict_detail);
      await refresh();
    } catch (err) {
      if (isInsufficientTokens(err)) {
        setError('토큰이 부족합니다');
      }
    } finally {
      setIsDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !fight) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-5">
        <p className="text-body1 text-gray-500 mb-4">{error}</p>
        <button className="btn-primary max-w-[200px]" onClick={() => router.push('/')}>
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  if (!fight) return null;

  // Not yet revealed - show reveal gate
  const isRevealed = fight.user_fault !== null && fight.comment !== null;

  return (
    <div className="px-5 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pt-16 pb-4 text-center"
      >
        <div className="inline-flex items-center gap-2 mb-2">
          <Swords className="w-5 h-5 text-primary-400" />
          <span className="text-body2 font-medium text-gray-500">판결 결과</span>
        </div>
      </motion.div>

      {/* Token balance */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent-50 text-accent-600 text-caption font-medium">
          <Coins className="w-3.5 h-3.5" />
          토큰 {balance}개
        </div>
      </div>

      {isRevealed ? (
        <>
          {/* Verdict Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <VerdictCard
              fight={fight}
              judge={judge || { id: fight.judge_id, name: '판사' }}
              verdictDetail={verdictDetail}
              onRequestDetail={handleRequestDetail}
              isDetailLoading={isDetailLoading}
            />
          </motion.div>

          {/* Error */}
          {error && (
            <p className="text-body2 text-red-500 text-center mt-3">{error}</p>
          )}

          {/* Action Buttons */}
          {fight.stage === 'INITIAL' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col gap-3 mt-6"
            >
              <Link
                href={`/fight/defense/?id=${fightId}`}
                className="w-full py-3.5 rounded-xl font-semibold text-body1 text-center bg-primary-400 text-white active:bg-primary-500 flex items-center justify-center gap-2"
              >
                <Shield className="w-5 h-5" />
                변론 추가하기
              </Link>
              <Link
                href={`/fight/appeal/?id=${fightId}`}
                className="w-full py-3.5 rounded-xl font-semibold text-body1 text-center border-2 border-primary-400 text-primary-400 active:bg-primary-50 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                판사 바꿔서 다시 판결 (토큰 2개)
              </Link>
              {fight.is_revealed && (
                <ShareButton fightId={fight.id} comment={fight.comment || undefined} />
              )}
            </motion.div>
          )}

          {fight.stage === 'APPEAL' && fight.is_revealed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6"
            >
              <ShareButton fightId={fight.id} comment={fight.comment || undefined} />
            </motion.div>
          )}
        </>
      ) : (
        /* Reveal gate */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card text-center py-10"
        >
          <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-h3 text-gray-900 mb-2">판결이 완료되었습니다!</h2>
          <p className="text-body2 text-gray-500 mb-6">
            결과를 확인하려면 토큰 2개가 필요합니다
          </p>

          {error && (
            <p className="text-body2 text-red-500 mb-4">{error}</p>
          )}

          <button
            onClick={handleReveal}
            disabled={isRevealLoading}
            className="btn-primary max-w-[250px] mx-auto flex items-center justify-center gap-2"
          >
            {isRevealLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Coins className="w-5 h-5" />
                토큰 2개로 결과 보기
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
}
