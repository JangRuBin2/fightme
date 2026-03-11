'use client';

import { ReactNode } from 'react';
import BackButton from './BackButton';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
}

export default function Header({ title, showBack = false, rightAction }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 safe-top">
      <div className="flex items-center justify-between h-12 px-4">
        <div className="w-10 flex items-center">
          {showBack && <BackButton />}
        </div>

        {title && (
          <h1 className="text-body1 font-semibold text-gray-900 truncate">
            {title}
          </h1>
        )}

        <div className="w-10 flex items-center justify-end">
          {rightAction}
        </div>
      </div>
    </header>
  );
}
