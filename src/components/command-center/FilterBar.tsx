'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Suspense, useCallback, useRef } from 'react';
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

function FilterBarInner({ counts }: FilterBarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const rawCategory = searchParams.get('category');
  const activeCategory = rawCategory && ['games', 'client', 'personal'].includes(rawCategory)
    ? (rawCategory as ProjectCategory)
    : null;

  const handleFilter = useCallback(
    (value: ProjectCategory | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set('category', value);
      } else {
        params.delete('category');
      }
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
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

export function FilterBar(props: FilterBarProps) {
  return (
    <Suspense fallback={<div className="cc-filter-bar" />}>
      <FilterBarInner {...props} />
    </Suspense>
  );
}
