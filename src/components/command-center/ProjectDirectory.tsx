'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useCallback, useRef } from 'react';
import { DirectoryItem } from './DirectoryItem';
import type { Project, ProjectCategory } from '@/lib/projects';

type ProjectDirectoryProps = {
  projects: Project[];
};

function ProjectDirectoryInner({ projects }: ProjectDirectoryProps) {
  const searchParams = useSearchParams();
  const rawCategory = searchParams.get('category');
  const activeCategory = rawCategory && ['games', 'client', 'personal'].includes(rawCategory)
    ? (rawCategory as ProjectCategory)
    : null;

  const filtered = useMemo(() => {
    if (!activeCategory) return projects;
    return projects.filter((p) => p.category === activeCategory);
  }, [projects, activeCategory]);

  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = listRef.current?.querySelectorAll<HTMLElement>('[role="option"]');
    if (!items?.length) return;

    const currentIndex = Array.from(items).findIndex((el) => el === document.activeElement);
    let nextIndex: number | null = null;

    if (e.key === 'ArrowDown') nextIndex = Math.min(currentIndex + 1, items.length - 1);
    if (e.key === 'ArrowUp') nextIndex = Math.max(currentIndex - 1, 0);
    if (e.key === 'Home') nextIndex = 0;
    if (e.key === 'End') nextIndex = items.length - 1;

    if (nextIndex !== null && nextIndex !== currentIndex) {
      e.preventDefault();
      items[nextIndex].focus();
    }
  }, []);

  return (
    <div
      id="project-directory"
      role="listbox"
      aria-label="Projects"
      ref={listRef}
      onKeyDown={handleKeyDown}
    >
      {filtered.map((project, i) => (
        <DirectoryItem key={project.slug} project={project} index={i} />
      ))}
    </div>
  );
}

export function ProjectDirectory(props: ProjectDirectoryProps) {
  return (
    <Suspense fallback={null}>
      <ProjectDirectoryInner {...props} />
    </Suspense>
  );
}
