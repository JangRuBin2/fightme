'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import JudgeCreateWizard from '@/components/judge/JudgeCreateWizard';
import { createJudge } from '@/lib/api/judges';

export default function CreateJudgePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleComplete = async (data: {
    name: string;
    q1: string;
    q2: string;
    q3: string;
    q4: string;
    q5: string;
    q6: string;
  }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await createJudge(data);
      setSuccess(true);
      setTimeout(() => {
        router.push('/judges/');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-5 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <span className="text-3xl">&#x2705;</span>
        </div>
        <h2 className="text-h3 text-gray-900 mb-2">판사 등록 완료!</h2>
        <p className="text-body2 text-gray-500">
          AI 검토 후 승인되면 목록에 표시됩니다
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 pb-8">
      <div className="pt-6 pb-6">
        <h1 className="text-h2 text-gray-900">판사 만들기</h1>
        <p className="text-body2 text-gray-500 mt-1">
          6가지 질문에 답하면 AI가 판사를 만들어드려요
        </p>
      </div>

      {error && (
        <p className="text-body2 text-red-500 text-center mb-4">{error}</p>
      )}

      <JudgeCreateWizard onComplete={handleComplete} isSubmitting={isSubmitting} />
    </div>
  );
}
