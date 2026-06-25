import type { MetadataRoute } from 'next';
import { getSiteProjects } from '@/lib/projects';
import { siteConfig } from '@/lib/metadata';

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getSiteProjects();
  const now = new Date();

  const projectEntries: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${siteConfig.url}/projects/${p.slug}/`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [
    {
      url: siteConfig.url,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteConfig.url}/consulting/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/privacy/`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...projectEntries,
  ];
}
