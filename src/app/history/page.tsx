'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HistoryRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/my/fights/');
  }, [router]);

  return null;
}
