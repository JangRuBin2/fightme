'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Swords, ChevronRight, Coins, Plus, ShoppingBag, AlertCircle } from 'lucide-react';
import JudgeSelector from '@/components/judge/JudgeSelector';
import VerdictLoading from '@/components/fight/VerdictLoading';
import AdModal from '@/components/shared/AdModal';
import { getJudges } from '@/lib/api/judges';
import { createFight, getLatestFight } from '@/lib/api/fights';
import { useStore } from '@/store/useStore';
import { useTokens } from '@/hooks/useTokens';
import { getErrorCode, getErrorMessage } from '@/lib/errors';
import { useProcessingGuard } from '@/hooks/useProcessingGuard';
import type { Judge } from '@/types/database';

export default function HomePage() {
  const router = useRouter();
  const {
    isLoggedIn,
    currentFight,
    setUserName: storeSetUserName,
    setOpponentName: storeSetOpponentName,
    setUserClaim: storeSetUserClaim,
    setOpponentClaim: storeSetOpponentClaim,
    setJudgeId: storeSetJudgeId,
    resetFight,
  } = useStore();
  const { startProcessing, stopProcessing } = useProcessingGuard();
  const userName = currentFight.userName;
  const opponentName = currentFight.opponentName;
  const userClaim = currentFight.userClaim;
  const opponentClaim = currentFight.opponentClaim;
  const selectedJudge = currentFight.judgeId;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const [pendingFightId, setPendingFightId] = useState<string | null>(null);
  const { balance, refresh } = useTokens();

  useEffect(() => {
    getJudges('all')
      .then(setJudges)
      .catch(() => {});

    // 미확인 판결 감지: 최근 5분 내 생성된 판결이 있으면 안내
    if (isLoggedIn) {
      getLatestFight().then((fight) => {
        if (!fight) return;
        const fiveMinAgo = Date.now() - 5 * 60 * 1000;
        const createdAt = new Date(fight.created_at).getTime();
        if (createdAt > fiveMinAgo) {
          setPendingFightId(fight.id);
        }
      }).catch(() => {});
    }
  }, [isLoggedIn]);

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
    startProcessing();
    setError(null);

    try {
      const result = await createFight(
        userClaim.trim(),
        opponentClaim.trim(),
        selectedJudge!,
        userName.trim() || undefined,
        opponentName.trim() || undefined,
      );
      stopProcessing();
      resetFight();
      router.push(`/fight/?id=${result.fight.id}`);
    } catch (err) {
      stopProcessing();
      if (getErrorCode(err) === 'AUTH_REQUIRED') {
        router.push('/login/');
        return;
      }
      setError(getErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return <VerdictLoading />;
  }

  return (
    <div className="px-5 pb-24">
      {/* Pending fight banner */}
      {pendingFightId && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-14 mb-2"
        >
          <button
            onClick={() => router.push(`/fight/?id=${pendingFightId}`)}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-primary-50 active:bg-primary-100 transition-colors"
          >
            <AlertCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-body2 font-medium text-primary-600">확인하지 않은 판결이 있어요</p>
              <p className="text-caption text-primary-400">탭해서 결과를 확인하세요</p>
            </div>
            <ChevronRight className="w-4 h-4 text-primary-400" />
          </button>
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-16 pb-8 text-center"
      >
        <div className="inline-flex items-center gap-2 mb-2">
          <Swords className="w-8 h-8 text-primary-400" />
        </div>
        <h1 className="text-h1 text-gray-900">나랑 싸울래?</h1>
        <p className="text-body2 text-gray-500 mt-1">
          AI 판사가 공정하게 판결해드립니다
        </p>
        {isLoggedIn && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent-50 text-accent-600 text-caption font-medium">
              <Coins className="w-3.5 h-3.5" />
              토큰 {balance}개
            </div>
            <button
              onClick={() => setShowAdModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-400 text-gray-50 text-caption font-medium active:bg-primary-500"
            >
              <Plus className="w-3 h-3" />
              충전
            </button>
            <button
              onClick={() => router.push('/shop/')}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent-500 text-gray-50 text-caption font-medium active:bg-accent-600"
            >
              <ShoppingBag className="w-3 h-3" />
              상점
            </button>
          </div>
        )}
      </motion.div>

      {/* Names */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4 flex gap-3"
      >
        <div className="flex-1">
          <label className="block text-body2 font-medium text-gray-700 mb-2">
            내 이름
          </label>
          <input
            className="input-field"
            placeholder="예: 철수"
            maxLength={10}
            value={userName}
            onChange={(e) => storeSetUserName(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="block text-body2 font-medium text-gray-700 mb-2">
            상대 이름
          </label>
          <input
            className="input-field"
            placeholder="예: 영희"
            maxLength={10}
            value={opponentName}
            onChange={(e) => storeSetOpponentName(e.target.value)}
          />
        </div>
      </motion.div>

      {/* User Claim */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-4"
      >
        <label className="block text-body2 font-medium text-gray-700 mb-2">
          {userName || '내'} 주장
        </label>
        <textarea
          className="textarea-field h-28"
          placeholder="내가 왜 맞는지 적어주세요..."
          maxLength={100}
          value={userClaim}
          onChange={(e) => storeSetUserClaim(e.target.value)}
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
          {opponentName || '상대'} 주장
        </label>
        <textarea
          className="textarea-field h-28"
          placeholder="상대방은 뭐라고 했나요..."
          maxLength={100}
          value={opponentClaim}
          onChange={(e) => storeSetOpponentClaim(e.target.value)}
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
            onSelect={storeSetJudgeId}
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
              판결 받기 (토큰 3개)
            </>
          )}
        </button>
      </motion.div>

      {showAdModal && <AdModal onClose={() => { setShowAdModal(false); refresh(); }} />}
    </div>
  );
}
