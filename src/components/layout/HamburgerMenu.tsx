'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  Menu,
  X,
  Home,
  Gavel,
  Swords,
  User,
  Plus,
  Settings,
  Palette,
  Check,
} from 'lucide-react';
import { useStore } from '@/store/useStore';

const MENU_ITEMS = [
  { label: '홈', desc: '새 판결 요청', icon: Home, path: '/' },
  { label: '판사 목록', desc: '공식/유저 판사 보기', icon: Gavel, path: '/judges/' },
  { label: '판사 만들기', desc: '나만의 판사 생성', icon: Plus, path: '/judges/create/' },
  { label: '내 판결문', desc: '지금까지의 판결 기록', icon: Swords, path: '/my/fights/' },
  { label: '내 판사', desc: '내가 만든 판사 관리', icon: Settings, path: '/my/judges/' },
  { label: 'MY', desc: '프로필, 테마, 설정', icon: User, path: '/my/' },
] as const;

const THEMES = [
  { id: 'warm' as const, label: '따뜻한 판결', colors: ['#E8553D', '#D4A853', '#FAFAF7'] },
  { id: 'dark-court' as const, label: '어두운 법정', colors: ['#6C5CE7', '#FDCB6E', '#0F0F1A'] },
  { id: 'neon-fight' as const, label: '네온 대결', colors: ['#FF3F78', '#00D2FF', '#0D0D0D'] },
] as const;

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useStore();

  const navigate = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <>
      {/* Hamburger Button - bottom right, above BottomNav */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[72px] right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform duration-150"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-card-border)' }}
        aria-label="메뉴 열기"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Overlay + Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-[60]"
              onClick={() => setOpen(false)}
            />
            <motion.nav
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-72 z-[70] safe-top safe-bottom overflow-y-auto"
              style={{ backgroundColor: 'var(--color-bg)' }}
            >
              {/* Close Button */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4">
                <span className="text-h3 text-gray-900 font-bold">메뉴</span>
                <button
                  onClick={() => setOpen(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 active:bg-gray-200 transition-colors"
                  aria-label="메뉴 닫기"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="px-3 pb-4 flex flex-col gap-1">
                {MENU_ITEMS.map(({ label, desc, icon: Icon, path }) => {
                  const isActive =
                    path === '/'
                      ? pathname === '/'
                      : pathname.startsWith(path.replace(/\/$/, ''));

                  return (
                    <button
                      key={path}
                      onClick={() => navigate(path)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors duration-150',
                        isActive
                          ? 'bg-primary-50 text-primary-400'
                          : 'text-gray-700 active:bg-gray-100'
                      )}
                    >
                      <Icon className={clsx('w-5 h-5 flex-shrink-0', isActive ? 'text-primary-400' : 'text-gray-400')} />
                      <div className="flex-1 min-w-0">
                        <span className={clsx('text-body2 font-medium block', isActive && 'text-primary-400')}>
                          {label}
                        </span>
                        <span className="text-caption text-gray-400 block">{desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Theme Quick Switcher */}
              <div className="px-5 pb-8">
                <div className="h-px bg-gray-200 mb-4" />
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-gray-400" />
                  <span className="text-caption font-medium text-gray-500">테마</span>
                </div>
                <div className="flex flex-col gap-2">
                  {THEMES.map((t) => {
                    const isActive = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={clsx(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150',
                          isActive
                            ? 'bg-primary-50 border border-primary-400'
                            : 'border border-gray-200 active:bg-gray-100'
                        )}
                      >
                        <div className="flex gap-1">
                          {t.colors.map((c, i) => (
                            <div
                              key={i}
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <span className={clsx('text-caption font-medium flex-1 text-left', isActive ? 'text-primary-400' : 'text-gray-600')}>
                          {t.label}
                        </span>
                        {isActive && <Check className="w-4 h-4 text-primary-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
