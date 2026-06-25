import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // One restrained accent. The three legacy names all resolve to it so
        // existing component classes keep working; change `accent` to re-brand.
        accent: '#8ba3c7',
        magenta: '#8ba3c7',
        yellow: '#8ba3c7',
        turquoise: '#8ba3c7',
        'midnight-blue': '#0a0a0b',
        ivory: '#fafafa',
        'primary-dark': '#0a0a0b',
        'surface-1': '#131315',
        'surface-2': '#1a1a1d',
        'surface-3': '#26262b',
        'text-primary': '#ededee',
        'text-secondary': '#a1a1aa',
        'text-muted': '#71717a',
      },
      fontFamily: {
        syne: ['var(--font-syne)', 'sans-serif'],
        'space-mono': ['var(--font-space-mono)', 'monospace'],
        'ibm-plex': ['var(--font-ibm-plex)', 'sans-serif'],
      },
      boxShadow: {
        // Subtle neutral elevation instead of neon bloom.
        'neon-magenta': '0 8px 40px rgba(139, 163, 199, 0.12)',
        'neon-turquoise': '0 8px 40px rgba(139, 163, 199, 0.12)',
        'neon-yellow': '0 8px 40px rgba(139, 163, 199, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
