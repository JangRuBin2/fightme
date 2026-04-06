'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus,
  TrendingUp,
  ThumbsUp,
  Inbox,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  EyeOff,
} from 'lucide-react';
import { getMyJudges, retryJudgeReview, deleteJudge, deactivateJudge } from '@/lib/api/judges';
import { useStore } from '@/store/useStore';
import { getErrorMessage } from '@/lib/errors';
import type { Judge } from '@/types/database';

function getStatusBadge(judge: Judge) {
  if (judge.is_approved) {
    return { label: '승인', className: 'bg-accent-100 text-accent-700', icon: CheckCircle };
  }
  if (judge.reject_reason) {
    return { label: '반려', className: 'bg-primary-100 text-primary-700', icon: XCircle };
  }
  return { label: '대기중', className: 'bg-gray-200 text-gray-600', icon: Clock };
}

export default function MyJudgesPage() {
  const router = useRouter();
  const { isLoggedIn } = useStore();
  const [judges, setJudges] = useState<Judge[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadJudges = () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    getMyJudges()
      .then(setJudges)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadJudges();
  }, [isLoggedIn]);

  const handleRetry = async (judgeId: string) => {
    setActionLoading(judgeId);
    setError(null);
    setSuccessMsg(null);
    try {
      const result = await retryJudgeReview(judgeId);
      if (result.approved) {
        setSuccessMsg('AI 검토를 통과했습니다!');
      } else {
        setError(`재심사 거절: ${result.reviewReason || 'AI 검토 거절'}`);
      }
      loadJudges();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (judgeId: string, judgeName: string) => {
    if (!confirm(`"${judgeName}" 판사를 삭제하시겠습니까?`)) return;
    setActionLoading(judgeId);
    setError(null);
    setSuccessMsg(null);
    try {
      await deleteJudge(judgeId);
      setSuccessMsg('판사가 삭제되었습니다');
      setJudges((prev) => prev.filter((j) => j.id !== judgeId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (judgeId: string, judgeName: string) => {
    if (!confirm(`"${judgeName}" 판사를 비활성화하시겠습니까?\n다른 사용자에게 더 이상 노출되지 않습니다.`)) return;
    setActionLoading(judgeId);
    setError(null);
    setSuccessMsg(null);
    try {
      await deactivateJudge(judgeId);
      setSuccessMsg('판사가 비활성화되었습니다');
      loadJudges();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pb-24">
      {/* Header */}
      <div className="pt-16 pb-4">
        <h1 className="text-h2 text-gray-900">내 판사</h1>
        <p className="text-body2 text-gray-500 mt-1">
          내가 만든 판사 {judges.length}명
        </p>
      </div>

      {/* Messages */}
      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-body2 text-red-500 text-center mb-3">
          {error}
        </motion.p>
      )}
      {successMsg && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-body2 text-green-600 text-center mb-3">
          {successMsg}
        </motion.p>
      )}

      {/* Judge List */}
      {judges.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Inbox className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-h3 text-gray-500 mb-1">아직 만든 판사가 없어요</h2>
          <p className="text-body2 text-gray-400 text-center">
            나만의 판사를 만들어보세요!
          </p>
          <button
            className="btn-primary mt-6 max-w-[200px]"
            onClick={() => router.push('/judges/create/')}
          >
            판사 만들기
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {judges.map((judge, index) => {
            const status = getStatusBadge(judge);
            const StatusIcon = status.icon;
            const isLoading = actionLoading === judge.id;
            const canRetry = !judge.is_approved && judge.reject_reason !== '소유자에 의해 비활성화됨';
            const canDelete = !judge.is_approved || judge.usage_count === 0;
            const canDeactivate = judge.is_approved && judge.usage_count > 0;
            const isDeactivated = !judge.is_approved && judge.reject_reason === '소유자에 의해 비활성화됨';

            return (
              <motion.div
                key={judge.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`card ${isDeactivated ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex-shrink-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary-400">
                      {judge.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-body1 font-semibold text-gray-900">
                        {judge.name}
                      </h3>
                      {isDeactivated ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-500">
                          <EyeOff className="w-2.5 h-2.5" />
                          비활성
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${status.className}`}>
                          <StatusIcon className="w-2.5 h-2.5" />
                          {status.label}
                        </span>
                      )}
                    </div>
                    {judge.description && (
                      <p className="text-body2 text-gray-500 mb-2">
                        {judge.description}
                      </p>
                    )}

                    {judge.reject_reason && !isDeactivated && (
                      <p className="text-caption text-primary-400 mb-2">
                        반려 사유: {judge.reject_reason}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-caption text-gray-400">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {judge.usage_count.toLocaleString()}회 사용
                      </span>
                      {judge.score > 0 && (
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3.5 h-3.5" />
                          {judge.score.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-3">
                      {canRetry && (
                        <button
                          onClick={() => handleRetry(judge.id)}
                          disabled={isLoading}
                          className="flex-1 py-2 rounded-lg bg-primary-400 text-white text-caption font-medium flex items-center justify-center gap-1 active:bg-primary-500 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" />
                              재심사 요청
                            </>
                          )}
                        </button>
                      )}
                      {isDeactivated && (
                        <button
                          onClick={() => handleRetry(judge.id)}
                          disabled={isLoading}
                          className="flex-1 py-2 rounded-lg bg-accent-400 text-white text-caption font-medium flex items-center justify-center gap-1 active:bg-accent-500 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" />
                              다시 활성화
                            </>
                          )}
                        </button>
                      )}
                      {canDeactivate && (
                        <button
                          onClick={() => handleDeactivate(judge.id, judge.name)}
                          disabled={isLoading}
                          className="py-2 px-3 rounded-lg border border-gray-200 text-gray-500 text-caption font-medium flex items-center justify-center gap-1 active:bg-gray-100 disabled:opacity-50"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          비활성화
                        </button>
                      )}
                      {canDelete && !isDeactivated && (
                        <button
                          onClick={() => handleDelete(judge.id, judge.name)}
                          disabled={isLoading}
                          className="py-2 px-3 rounded-lg border border-gray-200 text-gray-500 text-caption font-medium flex items-center justify-center gap-1 active:bg-gray-100 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Judge FAB */}
      <button
        className="fixed right-5 w-14 h-14 rounded-full bg-primary-400 text-white
                   shadow-lg flex items-center justify-center active:bg-primary-500
                   transition-colors duration-150 z-40"
        style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
        onClick={() => router.push('/judges/create/')}
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
