'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Swords, ChevronRight, Coins } from 'lucide-react';
import JudgeSelector from '@/components/judge/JudgeSelector';
import { getOfficialJudges } from '@/lib/api/judges';
import { createFight } from '@/lib/api/fights';
import { useStore } from '@/store/useStore';
import { useTokens } from '@/hooks/useTokens';
import type { Judge } from '@/types/database';

export default function HomePage() {
  const router = useRouter();
  const [userClaim, setUserClaim] = useState('');
  const [opponentClaim, setOpponentClaim] = useState('');
  const [selectedJudge, setSelectedJudge] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn } = useStore();
  const { balance } = useTokens();

  useEffect(() => {
    getOfficialJudges()
      .then(setJudges)
      .catch(() => {});
  }, []);

  const canSubmit =
    userClaim.trim().length > 0 &&
    opponentClaim.trim().length > 0 &&
    selectedJudge !== null;

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    if (!isLoggedIn) {
      router.push('/login/');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createFight(userClaim.trim(), opponentClaim.trim(), selectedJudge!);
      router.push(`/fight/?id=${result.fight.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-5 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-6 pb-8 text-center"
      >
        <div className="inline-flex items-center gap-2 mb-2">
          <Swords className="w-8 h-8 text-primary-400" />
        </div>
        <h1 className="text-h1 text-gray-900">나랑 싸울래?</h1>
        <p className="text-body2 text-gray-500 mt-1">
          AI 판사가 공정하게 판결해드립니다
        </p>
        {isLoggedIn && (
          <div className="inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full bg-accent-50 text-accent-600 text-caption font-medium">
            <Coins className="w-3.5 h-3.5" />
            토큰 {balance}개
          </div>
        )}
      </motion.div>

      {/* User Claim */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4"
      >
        <label className="block text-body2 font-medium text-gray-700 mb-2">
          내 주장
        </label>
        <textarea
          className="textarea-field h-28"
          placeholder="내가 왜 맞는지 적어주세요..."
          maxLength={100}
          value={userClaim}
          onChange={(e) => setUserClaim(e.target.value)}
        />
        <p className="text-caption text-gray-400 text-right mt-1">
          {userClaim.length}/100
        </p>
      </motion.div>

      {/* Opponent Claim */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <label className="block text-body2 font-medium text-gray-700 mb-2">
          상대 주장
        </label>
        <textarea
          className="textarea-field h-28"
          placeholder="상대방은 뭐라고 했나요..."
          maxLength={100}
          value={opponentClaim}
          onChange={(e) => setOpponentClaim(e.target.value)}
        />
        <p className="text-caption text-gray-400 text-right mt-1">
          {opponentClaim.length}/100
        </p>
      </motion.div>

      {/* Judge Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-3">
          <label className="text-body2 font-medium text-gray-700">
            판사 선택
          </label>
          <button
            className="flex items-center text-caption text-gray-400"
            onClick={() => router.push('/judges/')}
          >
            전체 보기
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {judges.length > 0 ? (
          <JudgeSelector
            judges={judges}
            selectedId={selectedJudge}
            onSelect={setSelectedJudge}
            showTabs
          />
        ) : (
          <div className="h-32 flex items-center justify-center text-body2 text-gray-400">
            판사 목록을 불러오는 중...
          </div>
        )}
      </motion.div>

      {/* Error */}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-body2 text-red-500 text-center mb-4"
        >
          {error}
        </motion.p>
      )}

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <button
          className="btn-primary flex items-center justify-center gap-2"
          disabled={!canSubmit || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Swords className="w-5 h-5" />
              판결 받기
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
