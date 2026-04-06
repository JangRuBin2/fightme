'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Coins,
  TrendingDown,
  TrendingUp,
  Inbox,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useTokens } from '@/hooks/useTokens';
import { getTokenLogs } from '@/lib/api/tokens';
import type { TokenLog, TokenReason } from '@/types/database';

const REASON_LABELS: Record<TokenReason, string> = {
  SIGNUP_BONUS: '가입 보너스',
  AD_REWARD: '광고 시청',
  FIGHT_JUDGE: '1심 판결',
  FIGHT_REVEAL: '판결 공개',
  FIGHT_DETAIL: '판결 상세',
  FIGHT_APPEAL: '항소 (2심)',
  FIGHT_DEFENSE_AI: 'AI 변론',
  FIGHT_DEFENSE_SELF: '직접 변론',
  JUDGE_CREATE: '판사 생성',
  IAP_PURCHASE: '토큰 구매',
  PREMIUM_MONTHLY: '프리미엄 월정액',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

export default function TokenHistoryPage() {
  const router = useRouter();
  const { isLoggedIn } = useStore();
  const { balance } = useTokens();
  const [logs, setLogs] = useState<TokenLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    getTokenLogs(50)
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-5">
        <p className="text-body1 text-gray-500 mb-4">로그인이 필요합니다</p>
        <button className="btn-primary max-w-[200px]" onClick={() => router.push('/login/')}>
          로그인하기
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pb-24">
      {/* Header */}
      <div className="pt-16 pb-4">
        <h1 className="text-h2 text-gray-900">토큰 내역</h1>
      </div>

      {/* Current balance */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-4 mb-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-accent-500" />
          <span className="text-body1 font-medium text-gray-900">보유 토큰</span>
        </div>
        <span className="text-h2 font-bold text-accent-600">{balance}개</span>
      </motion.div>

      {/* Log list */}
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <Inbox className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-h3 text-gray-500 mb-1">토큰 사용 내역이 없어요</h2>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {logs.map((log, index) => {
            const isPositive = log.amount > 0;
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="card p-3.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isPositive ? 'bg-green-50' : 'bg-primary-50'
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-primary-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-body2 font-medium text-gray-900">
                      {REASON_LABELS[log.reason as TokenReason] || log.reason}
                    </p>
                    <p className="text-caption text-gray-400">
                      {formatDate(log.created_at)}
                    </p>
                  </div>
                </div>
                <span className={`text-body1 font-bold ${
                  isPositive ? 'text-green-600' : 'text-primary-400'
                }`}>
                  {isPositive ? '+' : ''}{log.amount}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
