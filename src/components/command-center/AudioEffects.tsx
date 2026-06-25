'use client';

import { useEffect, useRef } from 'react';
import { audio } from '@/lib/audio';

export function AudioEffects() {
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;

    audio.prewarm();

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const reduced = reducedMotionRef.current;

      // Consulting CTA — deep bass
      if (target.closest('.cc-identity-cta')) {
        audio.playConsulting(reduced);
        return;
      }

      // Filter tabs — soft blip
      if (target.closest('.cc-filter-btn')) {
        audio.playTab(reduced);
        return;
      }

      // Directory items — triangle tick
      if (target.closest('.cc-project-item')) {
        audio.playTick(reduced);
        return;
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return null;
}
