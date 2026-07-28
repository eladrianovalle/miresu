'use client';

import { useMemo } from 'react';
import { DirectoryList } from './DirectoryList';
import { useUrlQuery } from '@/hooks/useUrlQuery';
import type { Project, ProjectCategory } from '@/lib/projects';

type ProjectDirectoryProps = {
  projects: Project[];
};

export function ProjectDirectory({ projects }: ProjectDirectoryProps) {
  // Empty while the site is being exported to static HTML, and for the browser's
  // first render, which has to match it. So the built page gets the whole list,
  // unfiltered — the right answer for a visitor who has not picked a filter, and
  // the only answer for a crawler or for anyone whose JavaScript never arrives.
  // Narrowing to one category is the enhancement that layers on a moment later,
  // without disturbing the list already on the page.
  const query = useUrlQuery();

  const rawCategory = new URLSearchParams(query).get('category');
  const activeCategory = rawCategory && ['games', 'client', 'personal'].includes(rawCategory)
    ? (rawCategory as ProjectCategory)
    : null;

  const filtered = useMemo(() => {
    if (!activeCategory) return projects;
    return projects.filter((p) => p.category === activeCategory);
  }, [projects, activeCategory]);

  return <DirectoryList projects={filtered} query={query} />;
}
