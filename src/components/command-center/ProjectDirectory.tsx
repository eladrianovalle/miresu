'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { DirectoryList } from './DirectoryList';
import { useHasHydrated } from '@/hooks/useHasHydrated';
import type { Project, ProjectCategory } from '@/lib/projects';

type ProjectDirectoryProps = {
  projects: Project[];
};

function FilteredProjectDirectory({ projects }: ProjectDirectoryProps) {
  const searchParams = useSearchParams();
  const rawCategory = searchParams.get('category');
  const activeCategory = rawCategory && ['games', 'client', 'personal'].includes(rawCategory)
    ? (rawCategory as ProjectCategory)
    : null;

  const filtered = useMemo(() => {
    if (!activeCategory) return projects;
    return projects.filter((p) => p.category === activeCategory);
  }, [projects, activeCategory]);

  return <DirectoryList projects={filtered} query={searchParams.toString()} />;
}

export function ProjectDirectory({ projects }: ProjectDirectoryProps) {
  const hasHydrated = useHasHydrated();

  // Narrowing the list to one category needs the browser's `?category=`, which
  // does not exist while the site is being exported to static HTML. So the built
  // page — and the browser's first render, which has to match it — gets the whole
  // list, unfiltered. That is the right answer for a visitor who has not picked a
  // filter, and the only answer for a crawler or for anyone whose JavaScript
  // never arrives. Filtering is the enhancement that layers on a moment later.
  if (!hasHydrated) {
    return <DirectoryList projects={projects} />;
  }

  return <FilteredProjectDirectory projects={projects} />;
}
