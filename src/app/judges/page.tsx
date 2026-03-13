'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, ThumbsUp, TrendingUp, Shield, Users } from 'lucide-react';
import { getJudges } from '@/lib/api/judges';
import type { Judge } from '@/types/database';

type JudgeTab = 'official' | 'user';
type SortTab = 'score' | 'recent';

export default function JudgesPage() {
  const router = useRouter();
  const [judgeTab, setJudgeTab] = useState<JudgeTab>('official');
  const [sortTab, setSortTab] = useState<SortTab>('score');
  const [judges, setJudges] = useState<Judge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getJudges(judgeTab === 'official' ? 'official' : 'user', sortTab)
      .then(setJudges)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [judgeTab, sortTab]);

  return (
    <div className="px-5 pb-8">
      {/* Header */}
      <div className="pt-6 pb-4">
        <h1 className="text-h2 text-gray-900">판사 목록</h1>
      </div>

      {/* Judge Type Tabs */}
      <div className="flex gap-2 mb-3">
        <button
          className={`tab ${judgeTab === 'official' ? 'tab-active' : 'tab-inactive'}`}
          onClick={() => setJudgeTab('official')}
        >
          <Shield className="w-3.5 h-3.5 inline mr-1" />
          공식 판사
        </button>
        <button
          className={`tab ${judgeTab === 'user' ? 'tab-active' : 'tab-inactive'}`}
          onClick={() => setJudgeTab('user')}
        >
          <Users className="w-3.5 h-3.5 inline mr-1" />
          유저 판사
        </button>
      </div>

      {/* Sort Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          className={`text-caption px-3 py-1 rounded-full ${sortTab === 'score' ? 'bg-primary-400 text-white' : 'bg-gray-100 text-gray-600'}`}
          onClick={() => setSortTab('score')}
        >
          인기순
        </button>
        <button
          className={`text-caption px-3 py-1 rounded-full ${sortTab === 'recent' ? 'bg-primary-400 text-white' : 'bg-gray-100 text-gray-600'}`}
          onClick={() => setSortTab('recent')}
        >
          최신순
        </button>
      </div>

      {/* Judge List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : judges.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-body2 text-gray-400">판사가 없습니다</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {judges.map((judge, index) => (
            <motion.div
              key={judge.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card card-pressed"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex-shrink-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-400">{judge.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-body1 font-semibold text-gray-900">
                      {judge.name}
                    </h3>
                    {!judge.is_user_created ? (
                      <Shield className="w-3.5 h-3.5 text-primary-400" />
                    ) : (
                      <Users className="w-3.5 h-3.5 text-accent-500" />
                    )}
                  </div>
                  {judge.description && (
                    <p className="text-body2 text-gray-500 mb-2">
                      {judge.description}
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
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Judge FAB */}
      <button
        className="fixed bottom-8 right-5 w-14 h-14 rounded-full bg-primary-400 text-white
                   shadow-lg flex items-center justify-center active:bg-primary-500
                   transition-colors duration-150 safe-bottom"
        onClick={() => router.push('/judges/create/')}
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
