'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { resolvedDefaultMode, themeMode } from '@/theme.config';

// useLayoutEffect syncs the glyph to the live theme BEFORE paint on the client
// (no flash), but React warns when it runs during SSR/prerender — so fall back
// to useEffect on the server. Identical client behavior, no server warning.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// Topbar light/dark toggle. Renders nothing when the fork disables the toggle
// (ORC PUNK: enableToggle:false → dark-locked, no button in the DOM at all).
//
// The button has FIXED dims so the icon swap never shifts layout. The glyph
// reflects the TARGET mode: a moon when a click would switch to dark, a sun when
// it would switch to light. Drawn SVG icons (not unicode symbols) so they centre
// exactly and render identically across platforms. Swaps are INSTANT (plan 5).
const MOON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);
const SUN = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);
export function ThemeToggle() {
  // The painting mode. Starts at the build default (resolvedDefaultMode, shared
  // with the layout's SSR paint) so the first render — server, no-JS, and the
  // client's pre-hydration pass — is concrete and matches; the effect below
  // corrects it to the live `data-theme` before paint.
  const [current, setCurrent] = useState<'light' | 'dark'>(resolvedDefaultMode);

  // Sync `current` from the live DOM — the no-FOUC inline script already set
  // data-theme before paint (external, non-React state). Runs pre-paint on the
  // client (useLayoutEffect) so a returning user's saved theme doesn't flash the
  // default icon; the set-state-in-effect rule is suppressed deliberately here.
  useIsomorphicLayoutEffect(() => {
    const read = document.documentElement.dataset.theme;
    setCurrent(read === 'light' ? 'light' : 'dark');
  }, []);

  if (!themeMode.enableToggle) return null;

  const next = current === 'dark' ? 'light' : 'dark';
  // Icon reflects the TARGET: switching-to-dark shows the moon, to-light the sun.
  const icon = next === 'dark' ? MOON : SUN;

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
      aria-label={`Switch to ${next} theme`}
      aria-pressed={current === 'light'}
    >
      <span className="cc-theme-toggle-glyph" aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}
