'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Gavel, History, Settings } from 'lucide-react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { label: '홈', icon: Home, path: '/' },
  { label: '판사', icon: Gavel, path: '/judges' },
  { label: '기록', icon: History, path: '/history' },
  { label: '설정', icon: Settings, path: '/settings' },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-gray-100 safe-bottom">
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
          const isActive =
            path === '/' ? pathname === '/' : pathname.startsWith(path);

          return (
            <button
              key={path}
              onClick={() => router.push(path)}
              className={clsx(
                'flex flex-col items-center justify-center gap-0.5 w-full h-full',
                'active:opacity-70 transition-opacity duration-100'
              )}
              aria-label={label}
            >
              <Icon
                className={clsx(
                  'w-5 h-5 transition-colors duration-150',
                  isActive ? 'text-primary-400' : 'text-gray-400'
                )}
              />
              <span
                className={clsx(
                  'text-[10px] font-medium transition-colors duration-150',
                  isActive ? 'text-primary-400' : 'text-gray-400'
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
