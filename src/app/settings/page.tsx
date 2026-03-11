'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Coins,
  LogOut,
  Trash2,
  ChevronRight,
  Info,
  Clock,
} from 'lucide-react';
import AdModal from '@/components/shared/AdModal';
import { useStore } from '@/store/useStore';
import { useTokens } from '@/hooks/useTokens';
import { getTokenLogs } from '@/lib/api/tokens';
import type { TokenLog, TokenReason } from '@/types/database';

const APP_VERSION = '0.2.0';

const TOKEN_REASON_LABELS: Record<TokenReason, string> = {
  SIGNUP_BONUS: '가입 보너스',
  AD_REWARD: '광고 시청',
  FIGHT_JUDGE: '판결 요청',
  FIGHT_REVEAL: '결과 확인',
  FIGHT_DETAIL: '상세 보기',
  FIGHT_APPEAL: '항소',
  FIGHT_DEFENSE_AI: 'AI 변호',
  FIGHT_DEFENSE_SELF: '직접 변호',
};

export default function SettingsPage() {
  const router = useRouter();
  const { nickname, isLoggedIn, clearAuth } = useStore();
  const { balance, refresh } = useTokens();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [tokenLogs, setTokenLogs] = useState<TokenLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    if (showLogs) {
      getTokenLogs(20).then(setTokenLogs).catch(() => {});
    }
  }, [showLogs]);

  const handleLogout = async () => {
    clearAuth();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    // TODO: call auth-delete-account Edge Function
    clearAuth();
    setShowDeleteConfirm(false);
    router.push('/');
  };

  return (
    <div className="px-5 pb-8">
      {/* Header */}
      <div className="pt-6 pb-6">
        <h1 className="text-h2 text-gray-900">설정</h1>
      </div>

      {/* Profile Section */}
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
            <p className="text-body2 text-gray-500">
              {isLoggedIn ? '로그인됨' : '로그인 필요'}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </motion.div>

      {/* Token Balance */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card mb-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center">
            <Coins className="w-5 h-5 text-accent-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-body1 font-medium text-gray-900">토큰 잔액</h3>
            <p className="text-h3 text-accent-500 font-bold">{balance}개</p>
          </div>
          <button
            className="px-3 py-1.5 rounded-full bg-accent-400 text-white text-caption font-medium"
            onClick={() => setShowAdModal(true)}
          >
            충전하기
          </button>
        </div>

        {/* Token log toggle */}
        <button
          className="w-full mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-body2 text-gray-500"
          onClick={() => setShowLogs(!showLogs)}
        >
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            사용 내역
          </span>
          <ChevronRight className={`w-4 h-4 transition-transform ${showLogs ? 'rotate-90' : ''}`} />
        </button>

        {showLogs && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {tokenLogs.length === 0 ? (
                <p className="text-caption text-gray-400 text-center py-4">내역이 없습니다</p>
              ) : (
                tokenLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-caption">
                    <span className="text-gray-600">{TOKEN_REASON_LABELS[log.reason]}</span>
                    <span className={log.amount > 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                      {log.amount > 0 ? '+' : ''}{log.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <span className="text-body1 text-red-400">회원 탈퇴</span>
        </button>
      </motion.div>

      {/* App Info */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
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

      {/* Delete Account Confirmation Modal */}
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
            className="w-full max-w-lg bg-white rounded-t-3xl p-6 safe-bottom"
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
                className="w-full py-4 rounded-2xl bg-red-500 text-white font-semibold text-body1
                           active:bg-red-600 transition-colors duration-150"
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
