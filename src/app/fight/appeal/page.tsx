'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { RotateCcw, Coins } from 'lucide-react';
import JudgeSelector from '@/components/judge/JudgeSelector';
import AdModal from '@/components/shared/AdModal';
import { getFight, submitAppeal } from '@/lib/api/fights';
import { getOfficialJudges } from '@/lib/api/judges';
import { useTokens } from '@/hooks/useTokens';
import { isInsufficientTokens, getErrorMessage } from '@/lib/errors';
import type { Fight, Judge } from '@/types/database';

export default function AppealPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-3 border-primary-400 border-t-transparent rounded-full animate-spin" /></div>}>
      <AppealContent />
    </Suspense>
  );
}

function AppealContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fightId = searchParams.get('id');
  const [fight, setFight] = useState<Fight | null>(null);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [keepSameJudge, setKeepSameJudge] = useState(true);
  const [selectedJudge, setSelectedJudge] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const { balance, canAfford, refresh } = useTokens();

  useEffect(() => {
    async function load() {
      if (!fightId) return;
      try {
        const [fightData, judgesData] = await Promise.all([
          getFight(fightId),
          getOfficialJudges(),
        ]);
        setFight(fightData);
        setJudges(judgesData);
        if (fightData) {
          setSelectedJudge(fightData.judge_id);
        }
      } catch {
        setError('데이터를 불러오는 데 실패했습니다');
      }
    }
    load();
  }, [fightId]);

  const handleAppeal = async () => {
    if (!fight || !fightId || isSubmitting) return;

    if (!canAfford(2)) {
      setShowAdModal(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const judgeId = keepSameJudge ? undefined : (selectedJudge || undefined);
      const result = await submitAppeal(fightId, judgeId);
      await refresh();
      router.push(`/fight/?id=${fightId}`);
    } catch (err) {
      if (isInsufficientTokens(err)) {
        setShowAdModal(true);
      } else {
        setError(getErrorMessage(err));
      }
      setIsSubmitting(false);
    }
  };

  if (!fight) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (fight.stage === 'APPEAL') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-5">
        <p className="text-body1 text-gray-500 mb-4">이미 항소된 사건입니다</p>
        <button className="btn-primary max-w-[200px]" onClick={() => router.push(`/fight/?id=${fightId}`)}>
          판결 보기
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pb-24">
      <div className="pt-16 pb-6">
        <h1 className="text-h2 text-gray-900">항소하기</h1>
        <p className="text-body2 text-gray-500 mt-1">판결이 불만족스러우셨나요? 다시 판결받아보세요</p>
      </div>

      {/* Original Verdict Summary */}
      {fight.user_fault !== null && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="card mb-5">
          <h3 className="text-body2 font-medium text-gray-500 mb-3">기존 판결 요약</h3>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1 text-center">
              <p className="text-caption text-gray-400">내 잘못</p>
              <p className="text-h3 text-primary-400">{fight.user_fault}%</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="flex-1 text-center">
              <p className="text-caption text-gray-400">상대 잘못</p>
              <p className="text-h3 text-accent-400">{fight.opponent_fault}%</p>
            </div>
          </div>
          {fight.comment && (
            <p className="text-body2 text-gray-600">&ldquo;{fight.comment}&rdquo;</p>
          )}
        </motion.div>
      )}

      {/* Judge Selection */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
        <h3 className="text-body1 font-semibold text-gray-900 mb-3">판사 선택</h3>

        <button
          className={`w-full rounded-2xl p-4 shadow-sm mb-3 text-left border ${keepSameJudge ? 'ring-2 ring-primary-400 bg-primary-50 border-primary-400' : 'border-gray-200'}`}
          style={{ backgroundColor: keepSameJudge ? undefined : 'var(--color-card)' }}
          onClick={() => { setKeepSameJudge(true); setSelectedJudge(fight.judge_id); }}
        >
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${keepSameJudge ? 'border-primary-400 bg-primary-400' : 'border-gray-300'}`}>
              {keepSameJudge && <div className="w-2 h-2 rounded-full bg-gray-50" />}
            </div>
            <span className="text-body2 font-medium text-gray-800">같은 판사로 다시 판결</span>
          </div>
        </button>

        <button
          className={`w-full rounded-2xl p-4 shadow-sm mb-3 text-left border ${!keepSameJudge ? 'ring-2 ring-primary-400 bg-primary-50 border-primary-400' : 'border-gray-200'}`}
          style={{ backgroundColor: !keepSameJudge ? undefined : 'var(--color-card)' }}
          onClick={() => setKeepSameJudge(false)}
        >
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!keepSameJudge ? 'border-primary-400 bg-primary-400' : 'border-gray-300'}`}>
              {!keepSameJudge && <div className="w-2 h-2 rounded-full bg-gray-50" />}
            </div>
            <span className="text-body2 font-medium text-gray-800">다른 판사 선택</span>
          </div>
        </button>

        {!keepSameJudge && judges.length > 0 && (
          <JudgeSelector
            judges={judges.filter((j) => j.id !== fight.judge_id)}
            selectedId={selectedJudge}
            onSelect={setSelectedJudge}
          />
        )}
      </motion.div>

      {/* Token cost notice */}
      <div className="bg-accent-50 rounded-xl p-3 mb-6 flex items-center justify-center gap-2">
        <Coins className="w-4 h-4 text-accent-500" />
        <p className="text-caption text-accent-700 font-medium">토큰 2개 사용 (현재 {balance}개)</p>
      </div>

      {error && (
        <p className="text-body2 text-red-500 text-center mb-4">{error}</p>
      )}

      {/* Submit */}
      <button
        className="w-full py-3.5 rounded-xl font-semibold text-body1 bg-primary-400 text-white active:bg-primary-500 flex items-center justify-center gap-2 disabled:opacity-50"
        onClick={handleAppeal}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <RotateCcw className="w-5 h-5" />
            항소 제출하기
          </>
        )}
      </button>

      {showAdModal && <AdModal onClose={() => setShowAdModal(false)} />}
    </div>
  );
}
