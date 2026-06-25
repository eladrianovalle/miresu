import type { Metadata } from 'next';
import { syne, spaceMono, ibmPlexSans } from './fonts';

import { buildMetadata } from '@/lib/metadata';
import { siteConfig } from '@/site.config';
import './globals.css';

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
      <head />
      <body>{children}</body>
    </html>
  );
}
