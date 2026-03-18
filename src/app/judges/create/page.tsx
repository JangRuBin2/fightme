'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Gavel } from 'lucide-react';
import JudgeCreateWizard from '@/components/judge/JudgeCreateWizard';
import { createJudge } from '@/lib/api/judges';
import { useStore } from '@/store/useStore';
import { getErrorMessage } from '@/lib/errors';
import { useProcessingGuard } from '@/hooks/useProcessingGuard';

const LOADING_MESSAGES = [
  '판사 캐릭터를 생성하고 있어요...',
  'AI가 성격을 분석하고 있어요...',
  '말투를 학습하고 있어요...',
  '적합성을 검토하고 있어요...',
];

export default function CreateJudgePage() {
  const router = useRouter();
  const { setTokenBalance } = useStore();
  const { startProcessing, stopProcessing } = useProcessingGuard();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ approved: boolean; reason: string } | null>(null);

  const handleComplete = async (data: {
    name: string;
    speech_style: string;
    q1: string;
    q2: string;
    q3: string;
    q4: string;
    q5: string;
  }) => {
    setIsSubmitting(true);
    startProcessing();
    setError(null);
    setLoadingMsgIndex(0);

    // 로딩 메시지 순환
    const msgTimer = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);

    try {
      const res = await createJudge(data);
      setTokenBalance(res.tokenBalance);

      clearInterval(msgTimer);
      stopProcessing();
      if (res.approved) {
        setResult({ approved: true, reason: res.reviewReason });
        setTimeout(() => {
          router.push('/judges/');
        }, 2000);
      } else {
        setResult({ approved: false, reason: res.reviewReason });
        setIsSubmitting(false);
      }
    } catch (err) {
      clearInterval(msgTimer);
      stopProcessing();
      setError(getErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-5 text-center">
        <motion.div
          animate={{ rotate: [0, 10, -10, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-6"
        >
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
            <Gavel className="w-10 h-10 text-primary-400" />
          </div>
        </motion.div>

        <motion.div
          key={loadingMsgIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-4"
        >
          <p className="text-body1 font-medium text-gray-700">
            {LOADING_MESSAGES[loadingMsgIndex]}
          </p>
        </motion.div>

        <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary-400 rounded-full"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: '40%' }}
          />
        </div>

        <p className="text-caption text-gray-400 mt-4">AI가 판사를 만들고 검토하고 있어요</p>
      </div>
    );
  }

  if (result?.approved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-5 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <span className="text-3xl">&#x2705;</span>
        </div>
        <h2 className="text-h3 text-gray-900 mb-2">판사 등록 완료!</h2>
        <p className="text-body2 text-gray-500">
          AI 검토를 통과했습니다. 판사 목록에서 확인하세요!
        </p>
      </div>
    );
  }

  if (result && !result.approved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-5 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <span className="text-3xl">&#x274C;</span>
        </div>
        <h2 className="text-h3 text-gray-900 mb-2">AI 검토 거절</h2>
        <p className="text-body2 text-gray-500 mb-6">
          {result.reason}
        </p>
        <button
          className="btn-secondary"
          onClick={() => {
            setResult(null);
            setError(null);
          }}
        >
          다시 만들기
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pb-24">
      <div className="pt-16 pb-6">
        <h1 className="text-h2 text-gray-900">판사 만들기</h1>
        <p className="text-body2 text-gray-500 mt-1">
          질문에 답하고 말투를 설정하면 AI가 판사를 만들어드려요
        </p>
      </div>

      {error && (
        <p className="text-body2 text-red-500 text-center mb-4">{error}</p>
      )}

      <JudgeCreateWizard onComplete={handleComplete} isSubmitting={isSubmitting} />
    </div>
  );
}
