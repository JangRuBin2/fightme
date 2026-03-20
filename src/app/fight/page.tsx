'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Swords,
  RotateCcw,
  Shield,
  Coins,
} from 'lucide-react';
import Link from 'next/link';
import VerdictCard from '@/components/fight/VerdictCard';
import ShareButton from '@/components/shared/ShareButton';
import { getFight } from '@/lib/api/fights';
import { getJudge } from '@/lib/api/judges';
import { useTokens } from '@/hooks/useTokens';
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
  const { balance } = useTokens();

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

      {/* Verdict Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <VerdictCard
          fight={fight}
          judge={judge || { id: fight.judge_id, name: '판사' }}
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
          {!fight.defense ? (
            <Link
              href={`/fight/defense/?id=${fightId}`}
              className="w-full py-3.5 rounded-xl font-semibold text-body1 text-center bg-primary-400 text-white active:bg-primary-500 flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5" />
              변론 추가하기
            </Link>
          ) : (
            <div className="w-full py-3.5 rounded-xl font-semibold text-body1 text-center bg-gray-200 text-gray-400 flex items-center justify-center gap-2 cursor-not-allowed">
              <Shield className="w-5 h-5" />
              변론 완료
            </div>
          )}
          <Link
            href={`/fight/appeal/?id=${fightId}`}
            className="w-full py-3.5 rounded-xl font-semibold text-body1 text-center border-2 border-primary-400 text-primary-400 active:bg-primary-50 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            항소하기 (토큰 5개)
          </Link>
          <ShareButton fight={fight} judgeName={judge?.name || '판사'} />
        </motion.div>
      )}

      {fight.stage === 'APPEAL' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <ShareButton fight={fight} judgeName={judge?.name || '판사'} />
        </motion.div>
      )}
    </div>
  );
}
