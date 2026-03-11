'use client';

import { clsx } from 'clsx';

interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-3',
};

export default function Loading({ text, size = 'md', className }: LoadingProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center gap-3',
        className
      )}
    >
      <div
        className={clsx(
          'rounded-full border-gray-200 border-t-primary-400 animate-spin',
          SIZES[size]
        )}
      />
      {text && (
        <p className="text-body2 text-gray-500 animate-pulse">{text}</p>
      )}
    </div>
  );
}
