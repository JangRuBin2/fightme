'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Coins, Crown, Sparkles, Play, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useTokens } from '@/hooks/useTokens';
import { useIap } from '@/hooks/useIap';
import AdModal from '@/components/shared/AdModal';
import {
  IAP_PRODUCTS,
  IAP_PRODUCT_INFO,
  PREMIUM_LAUNCH_END_DATE,
  isPremiumLaunchAvailable,
} from '@/types/iap';
import type { IapProductSku } from '@/types/iap';

function useCountdown(targetDate: Date) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, expired: false };
}

export default function ShopPage() {
  const router = useRouter();
  const { isLoggedIn } = useStore();
  const { balance, refresh } = useTokens();
  const { isAvailable, purchase } = useIap();
  const [purchasingSku, setPurchasingSku] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const countdown = useCountdown(PREMIUM_LAUNCH_END_DATE);
  const premiumAvailable = useMemo(() => isPremiumLaunchAvailable(), []);

  const handlePurchase = async (sku: IapProductSku) => {
    if (!isLoggedIn) {
      router.push('/login/');
      return;
    }

    if (!isAvailable) {
      setError('토스 앱에서만 구매할 수 있습니다');
      return;
    }

    setPurchasingSku(sku);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await purchase(sku);

      if (result.type === 'success') {
        const productInfo = IAP_PRODUCT_INFO[sku];
        setSuccessMessage(`${productInfo?.name || '상품'} 구매 완료!`);
        await refresh();
      } else if (result.errorCode === 'USER_CANCELED') {
        // User canceled - no error message needed
      } else {
        setError(result.errorMessage || '구매에 실패했습니다');
      }
    } catch {
      setError('구매 처리 중 오류가 발생했습니다');
    } finally {
      setPurchasingSku(null);
    }
  };

  const tokenProducts = [
    IAP_PRODUCTS.TOKEN_30,
    IAP_PRODUCTS.TOKEN_100,
    IAP_PRODUCTS.TOKEN_300,
  ];

  return (
    <div className="px-5 pb-24">
      {/* Header */}
      <div className="pt-12 pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-gray-500 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-body2">뒤로</span>
        </button>

        <h1 className="text-h1 text-gray-900">상점</h1>
        <p className="text-body2 text-gray-500 mt-1">
          토큰을 충전하고 더 많은 판결을 받아보세요
        </p>
      </div>

      {/* Current Balance */}
      {isLoggedIn && (
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
      )}

      {/* Premium Launch Offer */}
      {premiumAvailable && !countdown.expired && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="card p-5 border-2 border-accent-400 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-accent-400 text-gray-900 text-caption font-bold px-3 py-1 rounded-bl-lg">
              런칭 한정
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-6 h-6 text-accent-500" />
              <h2 className="text-h3 font-bold text-gray-900">프리미엄 평생권</h2>
            </div>

            <div className="space-y-1 mb-4">
              <p className="text-body2 text-gray-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accent-500" />
                글자수 무제한
              </p>
              <p className="text-body2 text-gray-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accent-500" />
                매월 토큰 200개 자동 충전
              </p>
              <p className="text-body2 text-gray-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accent-500" />
                한 번 구매로 평생 이용
              </p>
            </div>

            {/* Countdown */}
            <div className="bg-gray-100 rounded-lg p-3 mb-4">
              <p className="text-caption text-gray-500 mb-1">이벤트 종료까지</p>
              <div className="flex gap-2 justify-center">
                {[
                  { value: countdown.days, label: '일' },
                  { value: countdown.hours, label: '시' },
                  { value: countdown.minutes, label: '분' },
                  { value: countdown.seconds, label: '초' },
                ].map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <div className="text-h3 font-bold text-primary-500 tabular-nums">
                      {String(value).padStart(2, '0')}
                    </div>
                    <div className="text-caption text-gray-400">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="btn-primary flex items-center justify-center gap-2 bg-accent-500 active:bg-accent-600"
              disabled={purchasingSku === IAP_PRODUCTS.PREMIUM_LAUNCH}
              onClick={() => handlePurchase(IAP_PRODUCTS.PREMIUM_LAUNCH)}
            >
              {purchasingSku === IAP_PRODUCTS.PREMIUM_LAUNCH ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Crown className="w-5 h-5" />
                  {IAP_PRODUCT_INFO[IAP_PRODUCTS.PREMIUM_LAUNCH].price}에 구매
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Token Packages */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <h2 className="text-h3 font-bold text-gray-900 mb-3">토큰 충전</h2>
        <div className="space-y-3">
          {tokenProducts.map((sku) => {
            const info = IAP_PRODUCT_INFO[sku];
            if (!info) return null;

            return (
              <div key={sku} className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-50 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-accent-500" />
                  </div>
                  <div>
                    <p className="text-body1 font-medium text-gray-900">{info.name}</p>
                    <p className="text-caption text-gray-400">{info.description}</p>
                  </div>
                </div>
                <button
                  className="px-4 py-2 rounded-lg bg-primary-400 text-gray-50 text-body2 font-medium active:bg-primary-500 disabled:opacity-50"
                  disabled={purchasingSku === sku}
                  onClick={() => handlePurchase(sku as IapProductSku)}
                >
                  {purchasingSku === sku ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    info.price
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Ad Reward */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <h2 className="text-h3 font-bold text-gray-900 mb-3">무료 충전</h2>
        <div className="card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
              <Play className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-body1 font-medium text-gray-900">광고 보고 토큰 받기</p>
              <p className="text-caption text-gray-400">30초 광고 시청으로 토큰 5개</p>
            </div>
          </div>
          <button
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-body2 font-medium active:bg-gray-200"
            onClick={() => setShowAdModal(true)}
          >
            시청
          </button>
        </div>
      </motion.div>

      {/* Messages */}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-body2 text-red-500 text-center mb-4"
        >
          {error}
        </motion.p>
      )}

      {successMessage && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-body2 text-green-600 text-center mb-4"
        >
          {successMessage}
        </motion.p>
      )}

      {showAdModal && (
        <AdModal
          onClose={() => {
            setShowAdModal(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}
