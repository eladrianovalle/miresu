import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        magenta: '#e317d2',
        yellow: '#fffd00',
        turquoise: '#05ede5',
        'midnight-blue': '#000032',
        ivory: '#fffff2',
        'primary-dark': '#07070d',
        'surface-1': '#0d0d14',
        'surface-2': '#13131e',
        'surface-3': '#1a1a28',
        'text-primary': '#eeeeef',
        'text-secondary': '#9e9eb6',
        'text-muted': '#8e8ea8',
      },
      fontFamily: {
        syne: ['var(--font-syne)', 'sans-serif'],
        'space-mono': ['var(--font-space-mono)', 'monospace'],
        'ibm-plex': ['var(--font-ibm-plex)', 'sans-serif'],
      },
      boxShadow: {
        'neon-magenta': '0 10px 100px rgba(227, 23, 210, 0.4)',
        'neon-turquoise': '0 10px 100px rgba(5, 237, 229, 0.4)',
        'neon-yellow': '0 10px 100px rgba(255, 253, 0, 0.4)',
      },
    },
  },
  plugins: [],
};

export default config;
