'use client';

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Play } from 'lucide-react';
import { useTokens } from '@/hooks/useTokens';
import AdModal from './AdModal';

interface TokenGateProps {
  children: ReactNode;
  cost: number;
  onPurchase: () => Promise<void>;
  label?: string;
}

export default function TokenGate({
  children,
  cost,
  onPurchase,
  label = '이 기능을 사용하려면 토큰이 필요합니다',
}: TokenGateProps) {
  const { balance, canAfford } = useTokens();
  const [showAdModal, setShowAdModal] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  if (canAfford(cost)) {
    return <>{children}</>;
  }

  const handlePurchase = async () => {
    if (isPurchasing) return;
    setIsPurchasing(true);
    try {
      await onPurchase();
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="blur-md pointer-events-none select-none" aria-hidden>
        {children}
      </div>

      {/* Overlay */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center
                     bg-white/80 backdrop-blur-sm rounded-2xl"
        >
          <div className="text-center space-y-4 px-6">
            <div className="w-14 h-14 rounded-full bg-accent-100 flex items-center justify-center mx-auto">
              <Coins className="w-6 h-6 text-accent-500" />
            </div>

            <div>
              <p className="text-body1 font-semibold text-gray-800">
                토큰 {cost}개 필요
              </p>
              <p className="text-caption text-gray-400 mt-1">
                {label}
              </p>
              <p className="text-caption text-gray-500 mt-2">
                현재 잔액: <span className="font-medium text-accent-500">{balance}개</span>
              </p>
            </div>

            <button
              onClick={() => setShowAdModal(true)}
              className="btn-primary max-w-[200px] mx-auto flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              광고 보고 충전
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {showAdModal && (
        <AdModal onClose={() => setShowAdModal(false)} />
      )}
    </div>
  );
}
