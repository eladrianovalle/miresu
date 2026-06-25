import type { Metadata } from 'next';
import { buildMetadata, buildOrganizationJsonLd, siteConfig } from '@/lib/metadata';
import { CommandCenterShell } from '@/components/command-center';

export const metadata: Metadata = buildMetadata({
  title: { absolute: `${siteConfig.brandName} // Operator :: ${siteConfig.name}` },
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
