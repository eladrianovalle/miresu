'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';

const SCROLL_KEY = 'cc-directory-scroll';

interface SplitPanelProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

export function SplitPanel({ left, right }: SplitPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore scroll position before paint — invisible to the user
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      el.scrollTop = Number(saved);
    }
  }, []);

  // Save scroll position before unload / navigation
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const save = () => {
      sessionStorage.setItem(SCROLL_KEY, String(el.scrollTop));
    };

    el.addEventListener('scroll', save, { passive: true });
    return () => el.removeEventListener('scroll', save);
  }, []);

  return (
    <div className="cc-main">
      <nav className="cc-panel-left" aria-label="Project directory">
        <div className="cc-panel-left-scroll" ref={scrollRef}>
          {left}
        </div>
      </nav>
      <main id="project-detail" className="cc-panel-right" tabIndex={0}>
        {right}
      </main>
    </div>
  );
}
