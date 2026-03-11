'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
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
    </motion.div>
  );
}
