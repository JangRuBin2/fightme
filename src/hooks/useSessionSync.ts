'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';

// Syncs Zustand auth state with actual Supabase session.
// If store says logged in but Supabase has no valid session, clear auth.
export function useSessionSync() {
  const { isLoggedIn, clearAuth } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) return;

    const syncSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        clearAuth();
      }
    };

    syncSession();
  }, [isLoggedIn, clearAuth, router]);
}
