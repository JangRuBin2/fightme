'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Play, Coins, CheckCircle } from 'lucide-react';
import { useAppsInTossAds } from '@/hooks/useAppsInTossAds';

interface AdModalProps {
  onClose: () => void;
}

export default function AdModal({ onClose }: AdModalProps) {
  const { watchAdForTokenReward, adState, isAvailable } = useAppsInTossAds();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWatchAd = async () => {
    setError(null);
    try {
      const result = await watchAdForTokenReward();
      if (result) {
        setSuccess(true);
        setTimeout(() => onClose(), 1500);
      } else {
        // 광고는 봤지만 보상 미지급 (광고를 끝까지 보지 않음)
        setError('광고를 끝까지 시청해야 토큰이 지급됩니다.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '오류가 발생했습니다';
      setError(message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/40 flex items-end justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="w-full max-w-lg rounded-t-3xl p-6 safe-bottom"
        style={{ backgroundColor: 'var(--color-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-h3 text-gray-900">토큰 충전</h3>
          <button onClick={onClose} className="p-1">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {success ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-8"
          >
            <CheckCircle className="w-16 h-16 text-accent-500 mx-auto mb-3" />
            <p className="text-body1 font-semibold text-gray-900">토큰 5개 충전 완료!</p>
          </motion.div>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-accent-100 flex items-center justify-center mx-auto mb-4">
              <Coins className="w-8 h-8 text-accent-500" />
            </div>
            <p className="text-body1 font-semibold text-gray-900 mb-1">
              광고를 시청하고 토큰 5개 받기
            </p>
            <p className="text-body2 text-gray-500 mb-6">
              짧은 광고를 보면 토큰이 충전됩니다
            </p>

            <button
              onClick={handleWatchAd}
              disabled={adState === 'loading' || adState === 'showing'}
              className="btn-primary flex items-center justify-center gap-2 mx-auto max-w-[250px]"
            >
              {adState === 'loading' || adState === 'showing' ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  광고 시청하기
                </>
              )}
            </button>

            {error && (
              <p className="text-caption text-primary-500 mt-3">{error}</p>
            )}

            {!isAvailable && !error && (
              <p className="text-caption text-gray-400 mt-3">
                토스 앱에서만 광고를 시청할 수 있습니다
              </p>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
