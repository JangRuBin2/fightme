'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Swords, Sparkles } from 'lucide-react';
import FaultGauge from '@/components/fight/FaultGauge';
import { getPublicFight } from '@/lib/api/fights';
import type { Fight, Judge } from '@/types/database';


export default function ResultPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-3 border-primary-400 border-t-transparent rounded-full animate-spin" /></div>}>
      <ResultContent />
    </Suspense>
  );
}

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // /result/?id=xxx (쿼리) 또는 /result/{id} (path param, 토스 딥링크) 둘 다 지원
  const fightId = useMemo(() => {
    const fromQuery = searchParams.get('id');
    if (fromQuery) return fromQuery;

    // path param: /result/{uuid}
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length >= 2 && segments[0] === 'result') {
      return segments[1];
    }
    return null;
  }, [searchParams, pathname]);
  const [fight, setFight] = useState<Fight | null>(null);
  const [judge, setJudge] = useState<Judge | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!fightId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    async function load() {
      const result = await getPublicFight(fightId!);
      if (!result) {
        setNotFound(true);
      } else {
        setFight(result.fight);
        setJudge(result.judge);
      }
      setLoading(false);
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

  if (notFound || !fight) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-5 text-center">
        <Swords className="w-12 h-12 text-gray-300 mb-4" />
        <h1 className="text-h3 text-gray-700 mb-2">판결을 찾을 수 없습니다</h1>
        <p className="text-body2 text-gray-500 mb-6">공유된 링크가 만료되었거나 잘못된 링크입니다</p>
        <button
          className="btn-primary max-w-[200px]"
          onClick={() => router.push('/')}
        >
          나도 재판받기
        </button>
      </div>
    );
  }

  const judgeName = judge?.name || '판사';

  return (
    <div className="px-5 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-16 pb-6 text-center"
      >
        <div className="inline-flex items-center gap-2 mb-3">
          <Swords className="w-6 h-6 text-primary-400" />
          <span className="text-body2 font-medium text-gray-500">AI 판결 결과</span>
        </div>

        {fight.stage === 'APPEAL' && (
          <span className="block mb-2 px-2.5 py-0.5 rounded-full text-caption font-medium bg-accent-100 text-accent-700 w-fit mx-auto">
            항소심
          </span>
        )}
      </motion.div>

      {/* Judge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center mb-6"
      >
        <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mb-2">
          <Sparkles className="w-6 h-6 text-primary-400" />
        </div>
        <h2 className="text-h3 text-gray-900">{judgeName}</h2>
        {judge?.description && (
          <span className="text-caption text-gray-500 mt-1">{judge.description}</span>
        )}
      </motion.div>

      {/* Fault Gauge */}
      {fight.user_fault !== null && fight.opponent_fault !== null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-5 mb-4"
        >
          <FaultGauge
            myFault={fight.user_fault}
            opponentFault={fight.opponent_fault}
            myName={fight.user_name || '나'}
            opponentName={fight.opponent_name || '상대'}
            animated
          />
        </motion.div>
      )}

      {/* Comment */}
      {fight.comment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-primary-50 rounded-2xl p-5 mb-6"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-body2 font-medium text-primary-500 mb-1">판사의 한마디</p>
              <p className="text-body1 text-gray-800 font-medium">&ldquo;{fight.comment}&rdquo;</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="text-center"
      >
        <button
          className="btn-primary flex items-center justify-center gap-2 mx-auto max-w-[280px]"
          onClick={() => router.push('/')}
        >
          <Swords className="w-5 h-5" />
          나도 재판받기
        </button>
        <p className="text-caption text-gray-400 mt-3">나랑 싸울래? | AI 판결 서비스</p>
      </motion.div>
    </div>
  );
}
