'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { isAppsInTossEnvironment, closeMiniApp } from '@/lib/apps-in-toss/sdk';

interface BackButtonProps {
  fallbackPath?: string;
}

export default function BackButton({ fallbackPath }: BackButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  // 토스 환경에서는 네이티브 내비게이션 바가 뒤로가기를 제공하므로 숨김
  if (typeof window !== 'undefined' && isAppsInTossEnvironment()) {
    return null;
  }

  const handleBack = () => {
    const isHome = pathname === '/' || pathname === '';

    if (isHome) {
      // 홈 화면에서 뒤로가기 = 앱 종료
      closeMiniApp();
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
    } else if (fallbackPath) {
      router.push(fallbackPath);
    } else {
      router.push('/');
    }
  };

  return (
    <button
      onClick={handleBack}
      className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full
                 active:bg-gray-100 transition-colors duration-150"
      aria-label="뒤로 가기"
    >
      <ChevronLeft className="w-6 h-6 text-gray-700" />
    </button>
  );
}
