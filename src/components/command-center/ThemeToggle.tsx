'use client';

import { useLayoutEffect, useState } from 'react';
import { themeMode } from '@/theme.config';

// Topbar light/dark toggle. Renders nothing when the fork disables the toggle
// (ORC PUNK: enableToggle:false → dark-locked, no button in the DOM at all).
//
// Hydration-stable first paint: the glyph span renders EMPTY (an inert
// placeholder) so server + client markup match byte-for-byte; a post-mount
// useLayoutEffect reads the live `data-theme` (set pre-paint by the no-FOUC
// script) and fills in the glyph. The button has FIXED dims so the placeholder
// footprint equals the live one — no layout shift. The glyph reflects the
// TARGET mode: ☾ when a click would switch to dark, ☀ when it would switch to
// light. Glyph swaps are INSTANT (no CSS transition) per plan decision 5.
export function ThemeToggle() {
  // `current` is the mode currently painting; null until the layout effect
  // reads the DOM (the inert-placeholder phase).
  const [current, setCurrent] = useState<'light' | 'dark' | null>(null);

  // Post-mount, sync `current` from the live DOM — the no-FOUC inline script
  // already set data-theme before paint (external, non-React state). This is the
  // intended hydration-stable handoff (server renders the inert placeholder, the
  // client fills the glyph in one frame), so the set-state-in-effect rule is
  // suppressed deliberately here.
  useLayoutEffect(() => {
    const read = document.documentElement.dataset.theme;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading DOM state set by the pre-paint inline script
    setCurrent(read === 'light' ? 'light' : 'dark');
  }, []);

  if (!themeMode.enableToggle) return null;

  const next = current === 'dark' ? 'light' : 'dark';
  // Glyph reflects the TARGET: switching-to-dark shows the moon, to-light the sun.
  const glyph = current === null ? '' : next === 'dark' ? '☾' : '☀';
  const label =
    current === null
      ? 'Toggle color theme'
      : `Switch to ${next} theme`;

  function onClick() {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // localStorage can throw (private mode); the in-memory flip still applies.
    }
    setCurrent(next);
  }

  return (
    <button
      type="button"
      className="cc-theme-toggle"
      onClick={onClick}
      aria-label={label}
      aria-pressed={current === 'light'}
    >
      <span className="cc-theme-toggle-glyph" aria-hidden="true">
        {glyph}
      </span>
    </button>
  );
}
