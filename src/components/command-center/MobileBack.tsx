'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useCallback } from 'react';

export function MobileBack() {
  const router = useRouter();

  const goBack = useCallback(() => router.push('/'), [router]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    if (!mq.matches) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') goBack();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [goBack]);

  return (
    <button
      className="cc-mobile-back"
      onClick={goBack}
      type="button"
      aria-label="Back to project directory"
    >
      ← Back to directory
    </button>
  );
}
