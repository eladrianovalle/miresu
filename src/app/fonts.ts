import { Hanken_Grotesk, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';

// Neutral default type system — a clean grotesk for display, a monospace for
// labels/metadata, and a humanist sans for body. Swap these for your own; the
// CSS variable slots stay the same so nothing downstream needs to change.

// Display — headings, name, section titles. (var slot kept as --font-syne)
export const syne = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

// Mono — labels, metadata, operator text. (var slot kept as --font-space-mono)
export const spaceMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-space-mono',
  display: 'swap',
});

// Body — reading copy. (var slot kept as --font-ibm-plex)
export const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex',
  display: 'swap',
});
