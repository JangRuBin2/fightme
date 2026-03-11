'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Swords, Clock, Inbox, Share2 } from 'lucide-react';
import ShareButton from '@/components/shared/ShareButton';
import { getUserFights } from '@/lib/api/fights';
import { useStore } from '@/store/useStore';
import type { Fight } from '@/types/database';

export default function HistoryPage() {
  const router = useRouter();
  const { userId, isLoggedIn } = useStore();
  const [fights, setFights] = useState<Fight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn || !userId) {
      setLoading(false);
      return;
    }

    getUserFights(userId)
      .then(setFights)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId, isLoggedIn]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-5">
        <p className="text-body1 text-gray-500 mb-4">로그인이 필요합니다</p>
        <button className="btn-primary max-w-[200px]" onClick={() => router.push('/login/')}>
          로그인하기
        </button>
      </div>
    );
  }

  if (fights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-5">
        <Inbox className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-h3 text-gray-500 mb-1">아직 싸움 기록이 없어요</h2>
        <p className="text-body2 text-gray-400 text-center">
          첫 번째 싸움을 시작해보세요!
        </p>
        <button
          className="btn-primary mt-6 max-w-[200px]"
          onClick={() => router.push('/')}
        >
          싸움 시작하기
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pb-8">
      {/* Header */}
      <div className="pt-6 pb-4">
        <h1 className="text-h2 text-gray-900">싸움 기록</h1>
        <p className="text-body2 text-gray-500 mt-1">
          지금까지의 판결 기록이에요
        </p>
      </div>

      {/* History List */}
      <div className="flex flex-col gap-3">
        {fights.map((fight, index) => (
          <motion.button
            key={fight.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card card-pressed w-full text-left"
            onClick={() => router.push(`/fight/?id=${fight.id}`)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-primary-400" />
                {fight.stage === 'APPEAL' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                    항소
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-caption text-gray-400">
                <Clock className="w-3 h-3" />
                {new Date(fight.created_at).toLocaleDateString('ko-KR')}
              </div>
            </div>

            {/* Claims preview */}
            <p className="text-body2 text-gray-700 mb-1 line-clamp-1">
              {fight.user_claim}
            </p>
            <p className="text-caption text-gray-400 mb-3 line-clamp-1">
              vs {fight.opponent_claim}
            </p>

            {/* Fault bars mini */}
            {fight.user_fault !== null && fight.opponent_fault !== null && (
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-caption text-gray-500">나</span>
                    <span className="text-caption font-medium text-primary-400">
                      {fight.user_fault}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-400"
                      style={{ width: `${fight.user_fault}%` }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-caption text-gray-500">상대</span>
                    <span className="text-caption font-medium text-accent-400">
                      {fight.opponent_fault}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-400"
                      style={{ width: `${fight.opponent_fault}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Share button for revealed fights */}
            {fight.is_revealed && (
              <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                <ShareButton fightId={fight.id} comment={fight.comment || undefined} />
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
