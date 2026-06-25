import type { Config } from 'tailwindcss';
import { theme as siteTheme } from './src/theme.config';

const c = siteTheme.colors;

const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette comes from src/theme.config.ts (the per-fork overlay) — edit
        // there, not here. Three semantic accents; a fork may set them distinct.
        accent: c.accent,
        'accent-secondary': c.accentSecondary,
        'accent-tertiary': c.accentTertiary,
        'midnight-blue': c.primaryDark,
        ivory: c.ivory,
        'primary-dark': c.primaryDark,
        'surface-1': c.surface1,
        'surface-2': c.surface2,
        'surface-3': c.surface3,
        'text-primary': c.textPrimary,
        'text-secondary': c.textSecondary,
        'text-muted': c.textMuted,
      },
      fontFamily: {
        syne: ['var(--font-syne)', 'sans-serif'],
        'space-mono': ['var(--font-space-mono)', 'monospace'],
        'ibm-plex': ['var(--font-ibm-plex)', 'sans-serif'],
      },
      boxShadow: {
        // Subtle, theme-agnostic elevation instead of neon bloom.
        'neon-magenta': '0 8px 40px rgba(0, 0, 0, 0.35)',
        'neon-turquoise': '0 8px 40px rgba(0, 0, 0, 0.35)',
        'neon-yellow': '0 8px 40px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
