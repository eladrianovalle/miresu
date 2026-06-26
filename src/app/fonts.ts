import { Hanken_Grotesk, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';

// Neutral default type system — a clean grotesk for display, a monospace for
// labels/metadata, and a humanist sans for body. Swap these for your own; the
// CSS variable slots stay the same so nothing downstream needs to change.

// Display — headings, name, section titles. Feeds the --font-display slot.
export const display = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

// Mono — labels, metadata, captions. Feeds the --font-mono slot.
export const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

// Body — reading copy. Feeds the --font-body slot.
export const body = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});
