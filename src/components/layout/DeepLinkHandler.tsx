'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    __FM_ACTUAL_PATH__?: string;
  }
}

/**
 * Handles deep linking in Toss WebView.
 * When the Toss WebView loads the app, it may set window.__FM_ACTUAL_PATH__
 * to indicate the intended destination. This component reads that value on mount
 * and navigates to the correct route.
 */
export default function DeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    const actualPath = window.__FM_ACTUAL_PATH__;
    if (actualPath && actualPath !== '/' && actualPath !== window.location.pathname) {
      // Clear the value so we don't re-navigate on re-mount
      delete window.__FM_ACTUAL_PATH__;
      router.replace(actualPath);
    }
  }, [router]);

  return null;
}
