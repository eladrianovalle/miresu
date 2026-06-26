import { Metadata } from 'next';
import type { Project } from '@/lib/projects';
import { getHeroImage, descriptionFor } from '@/lib/project-utils';
import { siteConfig as baseConfig } from '@/site.config';

// Metadata-shaped view over the single site config (src/site.config.ts). `name`
// is the author/person; `brandName` the studio/brand. Both default from config.
export const siteConfig = {
  name: baseConfig.authorName,
  brandName: baseConfig.brandName,
  tagline: baseConfig.tagline,
  description: baseConfig.description,
  url: baseConfig.url,
  ogImage: baseConfig.ogImage,
  logo: baseConfig.logo,
  social: baseConfig.social,
};

export function buildMetadata(overrides: Metadata = {}): Metadata {
  return {
    title: {
      default: `${siteConfig.name} — ${siteConfig.tagline}`,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    metadataBase: new URL(siteConfig.url),
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: siteConfig.url,
      siteName: siteConfig.name,
      images: [siteConfig.ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      site: siteConfig.social.twitter,
    },
    robots: {
      index: true,
      follow: true,
    },
    ...overrides,
  };
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.brandName,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: `${siteConfig.url}${siteConfig.logo}`,
    sameAs: [
      siteConfig.social.instagram,
      siteConfig.social.facebook,
      `https://twitter.com/${siteConfig.social.twitter.replace('@', '')}`,
    ],
  };
}

// --- New project system metadata ---

export function buildProjectMetadata(project: Project): Metadata {
  const description =
    project.subtitle ?? descriptionFor(project).slice(0, 160);
  const heroImage = getHeroImage(project);

  return buildMetadata({
    title: project.title,
    description,
    openGraph: {
      title: `${project.title} | ${siteConfig.name}`,
      description,
      images: heroImage ? [heroImage] : undefined,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description,
      images: heroImage ? [heroImage] : undefined,
    },
  });
}

export function buildProjectJsonLd(project: Project) {
  const heroImage = getHeroImage(project);
  const base = {
    '@context': 'https://schema.org',
    name: project.title,
    description: project.subtitle ?? descriptionFor(project),
    image: heroImage ? `${siteConfig.url}${heroImage}` : undefined,
    url: `${siteConfig.url}/projects/${project.slug}/`,
    author: {
      '@type': 'Person',
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  if (project.category === 'games') {
    return {
      ...base,
      '@type': 'VideoGame',
      gamePlatform: project.platforms,
      offers:
        project.storeLinks?.map((link) => ({
          '@type': 'Offer',
          url: link.url,
          availability: 'https://schema.org/InStock',
        })) ?? [],
    };
  }

  return {
    ...base,
    '@type': 'CreativeWork',
    // Work done for someone else (client/employer/collaboration) lists them as provider.
    ...(project.relationship !== 'own' ? { provider: project.organization } : {}),
  };
}
