import type { Metadata } from 'next';
import { display, mono, body } from './fonts';

import { buildMetadata } from '@/lib/metadata';
import { siteConfig } from '@/site.config';
import { theme, buildThemeVars } from '@/theme.config';
import './globals.css';

// Inject the active palette from theme.config as :root CSS variables, so the
// command-center stylesheets stay theme-agnostic and a fork recolors via
// content (theme.json) only. Each color emits both a hex var (consumed by the
// bare skin-CSS var() usages) and an `-rgb` channel var (referenced by the
// Tailwind tokens so opacity utilities keep working). See buildThemeVars.
const THEME_VARS = buildThemeVars(theme.colors).join(';');

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
  const htmlClassName = `${display.variable} ${mono.variable} ${body.variable}`;

  return (
    <html lang="en" className={htmlClassName}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `:root{${THEME_VARS}}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
