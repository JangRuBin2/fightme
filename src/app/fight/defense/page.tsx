'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bot, PenLine, Shield, Coins } from 'lucide-react';
import AdModal from '@/components/shared/AdModal';
import { getFight, submitDefense } from '@/lib/api/fights';
import { useTokens } from '@/hooks/useTokens';
import type { Fight } from '@/types/database';

type DefenseTab = 'ai' | 'self';

export default function DefensePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-3 border-primary-400 border-t-transparent rounded-full animate-spin" /></div>}>
      <DefenseContent />
    </Suspense>
  );
}

function DefenseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fightId = searchParams.get('id');
  const [fight, setFight] = useState<Fight | null>(null);
  const [activeTab, setActiveTab] = useState<DefenseTab>('ai');
  const [selfDefense, setSelfDefense] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [aiDefenseText, setAiDefenseText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const { balance, canAfford, refresh } = useTokens();

  useEffect(() => {
    if (!fightId) return;
    getFight(fightId).then(setFight).catch(() => {});
  }, [fightId]);

  const handleAIDefense = async () => {
    if (!fight || !fightId || isSubmitting) return;

    if (!canAfford(2)) {
      setShowAdModal(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitDefense(fightId, null, 'ai');
      setAiDefenseText(result.defense_text);
      setAiGenerated(true);
      await refresh();
    } catch (err) {
      const errObj = err as Record<string, unknown>;
      if (errObj.code === 'INSUFFICIENT_TOKENS') {
        setShowAdModal(true);
      } else {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitSelfDefense = async () => {
    if (!fight || !fightId || isSubmitting || !selfDefense.trim()) return;

    if (!canAfford(1)) {
      setShowAdModal(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitDefense(fightId, selfDefense.trim(), 'self');
      await refresh();
      router.push(`/fight/appeal/?id=${fightId}`);
    } catch (err) {
      const errObj = err as Record<string, unknown>;
      if (errObj.code === 'INSUFFICIENT_TOKENS') {
        setShowAdModal(true);
      } else {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToAppeal = () => {
    router.push(`/fight/appeal/?id=${fightId}`);
  };

  if (!fight) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pb-8">
      <div className="pt-6 pb-4">
        <h1 className="text-h2 text-gray-900">변호하기</h1>
        <p className="text-body2 text-gray-500 mt-1">추가 변론으로 판결을 뒤집어보세요</p>
      </div>

      {/* Token balance */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent-50 text-accent-600 text-caption font-medium">
          <Coins className="w-3.5 h-3.5" />
          토큰 {balance}개
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          className={`flex-1 py-2.5 rounded-xl text-body2 font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'ai' ? 'bg-primary-400 text-white' : 'bg-gray-100 text-gray-600'}`}
          onClick={() => setActiveTab('ai')}
        >
          <Bot className="w-4 h-4" />
          AI 변호사 (2토큰)
        </button>
        <button
          className={`flex-1 py-2.5 rounded-xl text-body2 font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'self' ? 'bg-primary-400 text-white' : 'bg-gray-100 text-gray-600'}`}
          onClick={() => setActiveTab('self')}
        >
          <PenLine className="w-4 h-4" />
          직접 변호 (1토큰)
        </button>
      </div>

      {error && (
        <p className="text-body2 text-red-500 text-center mb-4">{error}</p>
      )}

      {/* AI Defense Tab */}
      {activeTab === 'ai' && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4">
          <div className="card text-center">
            <Bot className="w-12 h-12 text-primary-400 mx-auto mb-3" />
            <h3 className="text-body1 font-semibold text-gray-900 mb-1">AI 변호사</h3>
            <p className="text-body2 text-gray-500 mb-4">AI가 당신의 입장을 대신 변호해드립니다</p>

            {!aiGenerated ? (
              <button
                className="w-full py-3 rounded-xl font-semibold text-body1 bg-primary-400 text-white active:bg-primary-500 disabled:opacity-50"
                onClick={handleAIDefense}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    변호문 작성 중...
                  </div>
                ) : (
                  '원클릭 변호 생성'
                )}
              </button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-left">
                <div className="bg-primary-50 rounded-xl p-4 mb-4">
                  <p className="text-body2 font-medium text-primary-500 mb-2">AI 변호문</p>
                  <p className="text-body2 text-gray-700 leading-relaxed">{aiDefenseText}</p>
                </div>
                <button
                  onClick={handleGoToAppeal}
                  className="w-full py-3 rounded-xl font-semibold text-body1 bg-primary-400 text-white active:bg-primary-500 flex items-center justify-center gap-2"
                >
                  <Shield className="w-5 h-5" />
                  이 변론으로 항소하기
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Self Defense Tab */}
      {activeTab === 'self' && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4">
          <div className="card">
            <PenLine className="w-8 h-8 text-gray-400 mb-3" />
            <h3 className="text-body1 font-semibold text-gray-900 mb-1">직접 변호</h3>
            <p className="text-body2 text-gray-500 mb-4">직접 추가 변론을 작성해주세요</p>
            <textarea
              className="textarea-field h-36"
              placeholder="내가 왜 덜 잘못했는지 추가로 설명해주세요..."
              maxLength={300}
              value={selfDefense}
              onChange={(e) => setSelfDefense(e.target.value)}
            />
            <p className="text-caption text-gray-400 text-right mt-1">{selfDefense.length}/300</p>
          </div>

          {selfDefense.trim().length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <button
                className="w-full py-3.5 rounded-xl font-semibold text-body1 bg-primary-400 text-white active:bg-primary-500 flex items-center justify-center gap-2 disabled:opacity-50"
                onClick={handleSubmitSelfDefense}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    변호 제출하기
                  </>
                )}
              </button>
            </motion.div>
          )}
        </motion.div>
      )}

      {showAdModal && <AdModal onClose={() => setShowAdModal(false)} />}
    </div>
  );
}
