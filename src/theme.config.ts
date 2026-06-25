// theme.config.ts — the visual theme overlay.
//
// A fork re-brands by editing THIS file (the palette) and fonts.ts (the
// typefaces). The engine reads from here — tailwind.config.ts imports the
// palette, and the root layout injects it as :root CSS variables — so the
// engine files stay identical across forks (clean `git merge upstream`).
//
// Default: a restrained neutral. The engine exposes three semantic accents —
// `accent` (primary), `accentSecondary`, and `accentTertiary` — so a fork can
// theme them independently (e.g. distinct per-category colors). The neutral
// default sets all three equal, so the stock UI reads as a single accent; a
// fork is free to give each a different value.
export const theme = {
  colors: {
    /** Primary accent — links, section labels, key emphasis, category dots. */
    accent: '#8ba3c7',
    /** Secondary accent — a fork may set this distinct from the primary. */
    accentSecondary: '#8ba3c7',
    /** Tertiary accent — a fork may set this distinct from the others. */
    accentTertiary: '#8ba3c7',
    /** Page background. */
    primaryDark: '#0a0a0b',
    /** Raised surfaces, lightest → darkest separation. */
    surface1: '#131315',
    surface2: '#1a1a1d',
    surface3: '#26262b',
    border: '#2a2a30',
    /** Near-white for max-contrast marks. */
    ivory: '#fafafa',
    /** Text scale. */
    textPrimary: '#ededee',
    textSecondary: '#a1a1aa',
    // Lightened from #71717a (4.0:1, below WCAG AA) so muted text clears the
    // 4.5:1 contrast bar on every surface in the palette.
    textMuted: '#95959f',
  },
} as const;

export type Theme = typeof theme;
