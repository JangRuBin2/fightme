'use client';

import { useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';

/**
 * AI 처리 중 페이지 이탈 방지 + 메뉴 숨김.
 * - beforeunload: 브라우저 탭 닫기/새로고침 경고
 * - popstate: 뒤로가기 차단
 * - 컴포넌트 unmount 시 자동 해제
 */
export function useProcessingGuard() {
  const { setProcessing } = useStore();

  const startProcessing = useCallback(() => {
    setProcessing(true);
  }, [setProcessing]);

  const stopProcessing = useCallback(() => {
    setProcessing(false);
  }, [setProcessing]);

  // beforeunload + popstate 등록/해제
  const isProcessing = useStore((s) => s.isProcessing);

  useEffect(() => {
    if (!isProcessing) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    const handlePopState = () => {
      // 뒤로가기 시 다시 현재 페이지로 push
      window.history.pushState(null, '', window.location.href);
    };

    // 현재 상태를 history에 push (popstate 감지용)
    window.history.pushState(null, '', window.location.href);

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isProcessing]);

  // unmount 시 자동 해제
  useEffect(() => {
    return () => setProcessing(false);
  }, [setProcessing]);

  return { startProcessing, stopProcessing };
}
