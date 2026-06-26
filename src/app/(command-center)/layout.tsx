import type { Metadata } from 'next';
import { buildMetadata, buildOrganizationJsonLd, siteConfig } from '@/lib/metadata';
import { chrome } from '@/lib/site-labels';
import { CommandCenterShell } from '@/components/command-center';

// Home title. The stylized "// Operator" suffix is opt-in chrome (same flag as
// the operator eyebrow/handle); the neutral base uses a plain name — tagline.
export const metadata: Metadata = buildMetadata({
  title: {
    absolute: chrome.operator
      ? `${siteConfig.brandName} // Operator :: ${siteConfig.name}`
      : `${siteConfig.name} — ${siteConfig.tagline}`,
  },
  description: siteConfig.description,
});

export default function CommandCenterLayout(props: {
  children: React.ReactNode;
  directory: React.ReactNode;
  detail: React.ReactNode;
}) {
  const { directory, detail } = props;
  const orgJsonLd = buildOrganizationJsonLd();

  return (
    <CommandCenterShell left={directory} right={detail} jsonLd={orgJsonLd} />
  );
}
