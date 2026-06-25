// theme.config.ts — the visual theme overlay.
//
// A fork re-brands by editing THIS file (the palette) and fonts.ts (the
// typefaces). The engine reads from here — tailwind.config.ts imports the
// palette, and the root layout injects it as :root CSS variables — so the
// engine files stay identical across forks (clean `git merge upstream`).
//
// Default: a restrained neutral. Change `accent` to recolor the whole UI.
export const theme = {
  colors: {
    /** The single accent — links, section labels, key emphasis, category dots. */
    accent: '#8ba3c7',
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
    textMuted: '#71717a',
  },
} as const;

export type Theme = typeof theme;
