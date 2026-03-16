'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';

interface ShareButtonProps {
  fightId: string;
  comment?: string;
}

function hasTossShareApi(win: Window): win is Window & {
  TossApp: { share: (data: ShareData) => Promise<void> };
} {
  if (
    'TossApp' in win &&
    win.TossApp !== null &&
    typeof win.TossApp === 'object' &&
    'share' in win.TossApp &&
    typeof win.TossApp.share === 'function'
  ) {
    return true;
  }
  return false;
}

export default function ShareButton({ fightId, comment }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      const shareUrl = `${window.location.origin}/result/?id=${fightId}`;
      const shareData: ShareData = {
        title: '나랑 싸울래? - AI 판결 결과',
        text: comment ? `"${comment}" - 나도 판결받아보기!` : 'AI 판사의 판결 결과를 확인해보세요!',
        url: shareUrl,
      };

      // Try Toss share API first
      if (hasTossShareApi(window)) {
        await window.TossApp.share(shareData);
        return;
      }

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('링크가 복사되었습니다!');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        // Share cancelled or failed silently
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className="btn-secondary flex items-center justify-center gap-2"
    >
      {isSharing ? (
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          공유하기
        </>
      )}
    </button>
  );
}
