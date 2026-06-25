import type { Metadata } from 'next';
import { syne, spaceMono, ibmPlexSans } from './fonts';

import { buildMetadata } from '@/lib/metadata';
import { siteConfig } from '@/site.config';
import { theme } from '@/theme.config';
import './globals.css';

// Inject the palette from theme.config as :root CSS variables, so the
// command-center stylesheets stay theme-agnostic and a fork recolors via
// config only (no engine-file edits → clean upstream merges).
const c = theme.colors;
const THEME_VARS = [
  `--cc-color-accent:${c.accent}`,
  `--cc-color-accent-magenta:${c.accent}`,
  `--cc-color-accent-turquoise:${c.accent}`,
  `--cc-color-accent-yellow:${c.accent}`,
  `--cc-color-primary-dark:${c.primaryDark}`,
  `--cc-color-surface-1:${c.surface1}`,
  `--cc-color-surface-2:${c.surface2}`,
  `--cc-color-surface-3:${c.surface3}`,
  `--cc-color-border:${c.border}`,
  `--cc-color-text-primary:${c.textPrimary}`,
  `--cc-color-text-secondary:${c.textSecondary}`,
  `--cc-color-text-muted:${c.textMuted}`,
  `--cc-color-category-games:${c.accent}`,
  `--cc-color-category-client:${c.accent}`,
  `--cc-color-category-personal:${c.accent}`,
].join(';');

export const metadata: Metadata = {
  ...buildMetadata(),
  icons: {
    icon: siteConfig.favicon,
    apple: siteConfig.favicon,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const htmlClassName = `${syne.variable} ${spaceMono.variable} ${ibmPlexSans.variable}`;

  return (
    <html lang="en" className={htmlClassName}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `:root{${THEME_VARS}}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
