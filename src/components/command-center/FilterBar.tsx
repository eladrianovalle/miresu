'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useRef } from 'react';
import { useUrlQuery, setUrlQuery } from '@/hooks/useUrlQuery';
import type { ProjectCategory } from '@/lib/projects';
import { categoryLabels } from '@/lib/site-labels';

type FilterBarProps = {
  counts: Record<ProjectCategory, number>;
};

const FILTERS: { label: string; value: ProjectCategory | null }[] = [
  { label: 'All', value: null },
  { label: categoryLabels.games, value: 'games' },
  { label: categoryLabels.client, value: 'client' },
  { label: categoryLabels.personal, value: 'personal' },
];

export function FilterBar({ counts }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Empty while the site is being exported to static HTML, and for the browser's
  // first render, which has to match it. So the built page shows the bar in its
  // resting state, "All" selected — what an arriving visitor should see before
  // anything is filtered — and the live selection takes over a moment later,
  // without disturbing the buttons already on the page.
  const query = useUrlQuery();

  const rawCategory = new URLSearchParams(query).get('category');
  const activeCategory = rawCategory && ['games', 'client', 'personal'].includes(rawCategory)
    ? (rawCategory as ProjectCategory)
    : null;

  const handleFilter = useCallback(
    (value: ProjectCategory | null) => {
      const params = new URLSearchParams(query);
      if (value) {
        params.set('category', value);
      } else {
        params.delete('category');
      }
      const nextQuery = params.toString();
      router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
      setUrlQuery(nextQuery);
    },
    [query, router, pathname],
  );

  const total = counts.games + counts.client + counts.personal;
  const tablistRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const tabs = tablistRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      if (!tabs) return;

      const currentIndex = Array.from(tabs).findIndex((t) => t === document.activeElement);
      if (currentIndex === -1) return;

      let nextIndex: number | null = null;
      if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
      if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') nextIndex = 0;
      if (e.key === 'End') nextIndex = tabs.length - 1;

      if (nextIndex !== null) {
        e.preventDefault();
        tabs[nextIndex].focus();
      }
    },
    [],
  );

  return (
    <div
      className="cc-filter-bar"
      role="tablist"
      aria-label="Filter projects by category"
      ref={tablistRef}
      onKeyDown={handleKeyDown}
    >
      {FILTERS.map(({ label, value }) => {
        const isActive = activeCategory === value;
        const count = value ? counts[value] : total;

        return (
          <button
            key={label}
            className={`cc-filter-btn${isActive ? ' active' : ''}`}
            data-cat={value ?? 'all'}
            onClick={() => handleFilter(value)}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls="project-directory"
            tabIndex={isActive ? 0 : -1}
          >
            {label}
            <span className="cc-filter-count">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
