import type { Config } from 'tailwindcss';

// The color tokens below reference runtime CSS vars (injected by layout.tsx
// from theme.json) rather than baking hex at build time.
// Each token resolves against the `-rgb` channel var so Tailwind can inject
// <alpha-value> — this is what preserves ALL opacity utilities (bg-accent/50,
// text-text-muted/60, …) now that colors flow from theme.json through runtime
// vars. The bare `--cc-color-*` hex vars stay for the skin-CSS var() usages.
const ccColor = (name: string) => `rgb(var(--cc-color-${name}-rgb) / <alpha-value>)`;

const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Gate-owned: the Tier 2 token-contract spec applies this opacity utility to a
  // fixture element it injects, so it must always be in the compiled bundle
  // regardless of incidental usage in components.
  safelist: ['bg-accent/50'],
  theme: {
    extend: {
      colors: {
        // Palette comes from src/content/theme.json via theme.config.ts — edit
        // there, not here. Three semantic accents; a fork may set them distinct.
        accent: ccColor('accent'),
        'accent-secondary': ccColor('accent-secondary'),
        'accent-tertiary': ccColor('accent-tertiary'),
        'midnight-blue': ccColor('primary-dark'),
        ivory: ccColor('ivory'),
        'primary-dark': ccColor('primary-dark'),
        'surface-1': ccColor('surface-1'),
        'surface-2': ccColor('surface-2'),
        'surface-3': ccColor('surface-3'),
        'text-primary': ccColor('text-primary'),
        'text-secondary': ccColor('text-secondary'),
        'text-muted': ccColor('text-muted'),
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        body: ['var(--font-body)', 'sans-serif'],
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
