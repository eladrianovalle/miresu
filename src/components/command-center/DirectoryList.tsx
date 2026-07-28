'use client';

import { useCallback, useRef } from 'react';
import { DirectoryItem } from './DirectoryItem';
import type { Project } from '@/lib/projects';

type DirectoryListProps = {
  projects: Project[];
  /**
   * The page's current query string, carried onto every project link so the
   * chosen filter survives the click. Empty when no filter is in play.
   */
  query?: string;
};

/**
 * The project list itself: the listbox, its items, and arrow-key navigation.
 *
 * This component never reads the URL's query string — it is handed one. That
 * keeps it renderable during the static export, so the built HTML ships the
 * real list instead of an empty gap. `ProjectDirectory` renders it twice (once
 * unfiltered before the browser takes over, once filtered after) and this is
 * the single copy of the markup they share.
 */
export function DirectoryList({ projects, query = '' }: DirectoryListProps) {
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
      {projects.map((project, i) => (
        <DirectoryItem key={project.slug} project={project} index={i} query={query} />
      ))}
    </div>
  );
}
