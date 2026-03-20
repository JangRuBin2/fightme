'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, ThumbsUp, TrendingUp } from 'lucide-react';
import JudgeCard from './JudgeCard';
import type { Judge } from '@/types/database';

interface JudgeSelectorProps {
  judges: Judge[];
  selectedId: string | null;
  onSelect: (judgeId: string) => void;
  showTabs?: boolean;
}

export default function JudgeSelector({
  judges,
  selectedId,
  onSelect,
  showTabs = false,
}: JudgeSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<'official' | 'user'>('official');

  const filteredJudges = showTabs
    ? judges.filter((j) => (tab === 'official' ? !j.is_user_created : j.is_user_created))
    : judges;

  const selectedJudge = selectedId ? judges.find((j) => j.id === selectedId) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {showTabs && (
        <div className="flex gap-2 mb-3">
          <button
            className={`tab ${tab === 'official' ? 'tab-active' : 'tab-inactive'}`}
            onClick={() => setTab('official')}
          >
            공식 판사
          </button>
          <button
            className={`tab ${tab === 'user' ? 'tab-active' : 'tab-inactive'}`}
            onClick={() => setTab('user')}
          >
            유저 판사
          </button>
        </div>
      )}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-5 px-5"
      >
        {filteredJudges.map((judge) => (
          <JudgeCard
            key={judge.id}
            judge={judge}
            selected={judge.id === selectedId}
            onClick={() => onSelect(judge.id)}
          />
        ))}
      </div>

      {/* Selected judge preview */}
      <AnimatePresence mode="wait">
        {selectedJudge && (
          <motion.div
            key={selectedJudge.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-xl bg-gray-50 p-3.5 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-100 flex-shrink-0 flex items-center justify-center">
                <span className="text-body2 font-bold text-primary-500">
                  {selectedJudge.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-body2 font-semibold text-gray-800">
                    {selectedJudge.name}
                  </span>
                  {!selectedJudge.is_user_created ? (
                    <Shield className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                  ) : (
                    <Users className="w-3.5 h-3.5 text-accent-500 flex-shrink-0" />
                  )}
                </div>
                {selectedJudge.description && (
                  <p className="text-caption text-gray-500 leading-snug">
                    {selectedJudge.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-caption text-gray-400 mt-1.5">
                  {selectedJudge.score > 0 && (
                    <span className="flex items-center gap-0.5">
                      <ThumbsUp className="w-3 h-3" />
                      {selectedJudge.score}
                    </span>
                  )}
                  {selectedJudge.usage_count > 0 && (
                    <span className="flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" />
                      {selectedJudge.usage_count.toLocaleString()}회
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
