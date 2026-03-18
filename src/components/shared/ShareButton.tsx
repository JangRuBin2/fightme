'use client';

import { useState } from 'react';
import { Share2, Download } from 'lucide-react';
import { shareFightResult } from '@/lib/tossShare';
import { generateVerdictImage, saveVerdictImageToDevice } from '@/lib/shareImage';
import type { Fight } from '@/types/database';

interface ShareButtonProps {
  fight: Fight;
  judgeName: string;
  variant?: 'full' | 'compact';
}

export default function ShareButton({ fight, judgeName, variant = 'full' }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      const result = await shareFightResult(fight.id, fight.comment || undefined);
      if (result === 'copied') {
        showToast('링크가 복사되었습니다!');
      }
    } catch {
      // silent
    } finally {
      setIsSharing(false);
    }
  };

  const handleSaveImage = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const base64 = generateVerdictImage({ fight, judgeName });
      await saveVerdictImageToDevice(base64);
      showToast('이미지가 저장되었습니다!');
    } catch {
      showToast('이미지 저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleShare}
        disabled={isSharing}
        className="p-2 rounded-full bg-gray-100 active:bg-gray-200 disabled:opacity-50"
      >
        <Share2 className="w-4 h-4 text-gray-600" />
      </button>
    );
  }

  const btnBase = 'py-3 rounded-xl font-medium text-body2 flex items-center justify-center gap-2 transition-colors duration-150 disabled:opacity-50';

  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={handleShare}
          disabled={isSharing}
          className={`flex-1 ${btnBase} bg-gray-100 text-gray-700 active:bg-gray-200`}
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
        <button
          onClick={handleSaveImage}
          disabled={isSaving}
          className={`flex-1 ${btnBase} bg-primary-50 text-primary-500 active:bg-primary-100`}
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          ) : (
            <>
              <Download className="w-4 h-4" />
              이미지 저장
            </>
          )}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-gray-800 text-gray-50 text-body2 font-medium z-50">
          {toast}
        </div>
      )}
    </>
  );
}
