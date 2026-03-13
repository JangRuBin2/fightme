'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Coins,
  Swords,
  Gavel,
  ChevronRight,
  LogOut,
  Trash2,
  Info,
  Palette,
  Check,
} from 'lucide-react';
import AdModal from '@/components/shared/AdModal';
import { useStore } from '@/store/useStore';
import { useTokens } from '@/hooks/useTokens';

const APP_VERSION = '0.2.0';

const THEMES = [
  {
    id: 'warm' as const,
    name: 'Warm Verdict',
    desc: '따뜻한 판결',
    colors: ['#E8553D', '#D4A853', '#FAFAF7'],
  },
  {
    id: 'dark-court' as const,
    name: 'Dark Court',
    desc: '어두운 법정',
    colors: ['#6C5CE7', '#FDCB6E', '#0F0F1A'],
  },
  {
    id: 'neon-fight' as const,
    name: 'Neon Fight',
    desc: '네온 대결',
    colors: ['#FF3F78', '#00D2FF', '#0D0D0D'],
  },
] as const;

export default function MyPage() {
  const router = useRouter();
  const { nickname, isLoggedIn, clearAuth, theme, setTheme } = useStore();
  const { balance, refresh } = useTokens();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  const handleDeleteAccount = () => {
    clearAuth();
    setShowDeleteConfirm(false);
    router.push('/');
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-5">
        <User className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-body1 text-gray-500 mb-4">로그인이 필요합니다</p>
        <button className="btn-primary max-w-[200px]" onClick={() => router.push('/login/')}>
          로그인하기
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pb-8">
      {/* Header */}
      <div className="pt-6 pb-4">
        <h1 className="text-h2 text-gray-900">MY</h1>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="w-7 h-7 text-primary-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-body1 font-semibold text-gray-900">
              {nickname || '사용자'}
            </h2>
            <div className="flex items-center gap-1 mt-1">
              <Coins className="w-3.5 h-3.5 text-accent-500" />
              <span className="text-body2 text-accent-500 font-bold">{balance}개</span>
            </div>
          </div>
          <button
            className="px-3 py-1.5 rounded-full bg-accent-400 text-white text-caption font-medium"
            onClick={() => setShowAdModal(true)}
          >
            충전
          </button>
        </div>
      </motion.div>

      {/* Menu Cards */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col gap-3 mb-4"
      >
        <button
          className="card card-pressed w-full"
          onClick={() => router.push('/my/fights/')}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Swords className="w-5 h-5 text-primary-400" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-body1 font-medium text-gray-900">내 판결문</h3>
              <p className="text-caption text-gray-500">지금까지의 판결 기록</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </button>

        <button
          className="card card-pressed w-full"
          onClick={() => router.push('/my/judges/')}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center">
              <Gavel className="w-5 h-5 text-accent-500" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-body1 font-medium text-gray-900">내 판사</h3>
              <p className="text-caption text-gray-500">내가 만든 판사 관리</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </button>
      </motion.div>

      {/* Theme Selector */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card mb-4"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary-400" />
          </div>
          <h3 className="text-body1 font-medium text-gray-900">테마</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map((t) => {
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-150 ${
                  isActive
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                {isActive && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary-400 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                <div className="flex gap-1">
                  {t.colors.map((c, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border border-gray-200"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <span className="text-caption font-medium text-gray-700">{t.desc}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card mb-4"
      >
        <button
          className="w-full flex items-center gap-4 py-2"
          onClick={handleLogout}
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-gray-500" />
          </div>
          <span className="text-body1 text-gray-700">로그아웃</span>
        </button>

        <div className="h-px bg-gray-100 my-2" />

        <button
          className="w-full flex items-center gap-4 py-2"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-primary-400" />
          </div>
          <span className="text-body1 text-primary-400">회원 탈퇴</span>
        </button>
      </motion.div>

      {/* App Info */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Info className="w-5 h-5 text-gray-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-body1 font-medium text-gray-900">앱 버전</h3>
            <p className="text-body2 text-gray-500">v{APP_VERSION}</p>
          </div>
        </div>
      </motion.div>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/40 flex items-end justify-center z-50"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="w-full max-w-lg rounded-t-3xl p-6 safe-bottom"
            style={{ backgroundColor: 'var(--color-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-h3 text-gray-900 text-center mb-2">
              정말 탈퇴하시겠어요?
            </h3>
            <p className="text-body2 text-gray-500 text-center mb-6">
              모든 싸움 기록과 데이터가 삭제됩니다.
              <br />이 작업은 되돌릴 수 없어요.
            </p>
            <div className="flex flex-col gap-3">
              <button
                className="btn-primary"
                onClick={handleDeleteAccount}
              >
                탈퇴하기
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                취소
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showAdModal && <AdModal onClose={() => { setShowAdModal(false); refresh(); }} />}
    </div>
  );
}
