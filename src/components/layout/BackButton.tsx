'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface BackButtonProps {
  fallbackPath?: string;
}

export default function BackButton({ fallbackPath }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
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
