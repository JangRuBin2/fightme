'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Swords, Clock, Inbox, ArrowLeft } from 'lucide-react';
import ShareButton from '@/components/shared/ShareButton';
import { getUserFights } from '@/lib/api/fights';
import { useStore } from '@/store/useStore';
import type { Fight } from '@/types/database';

type FilterTab = 'all' | 'win' | 'lose';

export default function MyFightsPage() {
  const router = useRouter();
  const { userId, isLoggedIn } = useStore();
  const [fights, setFights] = useState<Fight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');

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

  const filtered = useMemo(() => {
    if (filter === 'all') return fights;
    return fights.filter((f) => {
      if (f.user_fault === null || f.opponent_fault === null) return false;
      return filter === 'win'
        ? f.user_fault < f.opponent_fault
        : f.user_fault >= f.opponent_fault;
    });
  }, [fights, filter]);

  const winCount = useMemo(
    () => fights.filter((f) => f.user_fault !== null && f.opponent_fault !== null && f.user_fault < f.opponent_fault).length,
    [fights]
  );
  const loseCount = useMemo(
    () => fights.filter((f) => f.user_fault !== null && f.opponent_fault !== null && f.user_fault >= f.opponent_fault).length,
    [fights]
  );

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
        <button
          className="flex items-center gap-1 text-body2 text-gray-500 mb-3"
          onClick={() => router.push('/my/')}
        >
          <ArrowLeft className="w-4 h-4" />
          MY
        </button>
        <h1 className="text-h2 text-gray-900">내 판결문</h1>
        <p className="text-body2 text-gray-500 mt-1">
          총 {fights.length}건 (승소 {winCount} / 패소 {loseCount})
        </p>
      </div>

      {/* Filter Tabs */}
      {fights.length > 0 && (
        <div className="flex gap-2 mb-5">
          {([
            { key: 'all' as const, label: `전체 ${fights.length}` },
            { key: 'win' as const, label: `승소 ${winCount}` },
            { key: 'lose' as const, label: `패소 ${loseCount}` },
          ]).map(({ key, label }) => (
            <button
              key={key}
              className={`tab ${filter === key ? 'tab-active' : 'tab-inactive'}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {fights.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Inbox className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-h3 text-gray-500 mb-1">아직 판결 기록이 없어요</h2>
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
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-body2 text-gray-400">해당 조건의 판결이 없습니다</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((fight, index) => {
            const isWin = fight.user_fault !== null && fight.opponent_fault !== null && fight.user_fault < fight.opponent_fault;

            return (
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
                    {fight.user_fault !== null && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        isWin
                          ? 'bg-accent-100 text-accent-700'
                          : 'bg-primary-100 text-primary-700'
                      }`}>
                        {isWin ? '승소' : '패소'}
                      </span>
                    )}
                    {fight.stage === 'APPEAL' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-600">
                        항소
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-caption text-gray-400">
                    <Clock className="w-3 h-3" />
                    {new Date(fight.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>

                <p className="text-body2 text-gray-700 mb-1 line-clamp-1">
                  {fight.user_claim}
                </p>
                <p className="text-caption text-gray-400 mb-3 line-clamp-1">
                  vs {fight.opponent_claim}
                </p>

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

                {fight.is_revealed && (
                  <div className="mt-2 flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <ShareButton fight={fight} judgeName="판사" variant="compact" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
