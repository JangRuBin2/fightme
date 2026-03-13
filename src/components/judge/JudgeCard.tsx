'use client';

import { clsx } from 'clsx';
import { ThumbsUp, TrendingUp, Shield, Users } from 'lucide-react';
import type { Judge } from '@/types/database';

interface JudgeCardProps {
  judge: Judge;
  onClick?: (judge: Judge) => void;
  selected?: boolean;
}

const AVATAR_COLORS = [
  'bg-primary-200 text-primary-600',
  'bg-accent-200 text-accent-700',
  'bg-primary-100 text-primary-500',
  'bg-accent-100 text-accent-600',
  'bg-gray-200 text-gray-700',
  'bg-primary-300 text-primary-700',
];

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function JudgeCard({ judge, onClick, selected = false }: JudgeCardProps) {
  const firstLetter = judge.name.charAt(0);
  const avatarColor = getAvatarColor(judge.id);

  return (
    <button
      onClick={() => onClick?.(judge)}
      className={clsx(
        'judge-card text-left',
        selected && 'judge-card-selected'
      )}
    >
      {/* Avatar */}
      <div
        className={clsx(
          'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold',
          avatarColor
        )}
      >
        {firstLetter}
      </div>

      {/* Name + Badge */}
      <div className="flex items-center gap-1.5">
        <span className="text-body2 font-medium text-gray-800 whitespace-nowrap">
          {judge.name}
        </span>
        {!judge.is_user_created ? (
          <Shield className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
        ) : (
          <Users className="w-3.5 h-3.5 text-accent-500 flex-shrink-0" />
        )}
      </div>

      {/* Description */}
      {judge.description && (
        <span className="text-caption text-gray-400 text-center leading-tight line-clamp-2">
          {judge.description}
        </span>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 text-caption text-gray-400 mt-1">
        {judge.score > 0 && (
          <span className="flex items-center gap-0.5">
            <ThumbsUp className="w-3 h-3" />
            {judge.score}
          </span>
        )}
        {judge.usage_count > 0 && (
          <span className="flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" />
            {judge.usage_count.toLocaleString()}회
          </span>
        )}
      </div>
    </button>
  );
}
