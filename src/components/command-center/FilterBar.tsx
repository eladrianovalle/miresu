'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useRef } from 'react';
import { useHasHydrated } from '@/hooks/useHasHydrated';
import type { ProjectCategory } from '@/lib/projects';
import { categoryLabels } from '@/lib/site-labels';

type FilterBarProps = {
  counts: Record<ProjectCategory, number>;
};

type FilterBarControlsProps = FilterBarProps & {
  activeCategory: ProjectCategory | null;
  /** The page's current query string, so switching filters keeps any other params. */
  query?: string;
};

const FILTERS: { label: string; value: ProjectCategory | null }[] = [
  { label: 'All', value: null },
  { label: categoryLabels.games, value: 'games' },
  { label: categoryLabels.client, value: 'client' },
  { label: categoryLabels.personal, value: 'personal' },
];

/**
 * The filter buttons themselves. Which one is lit comes in as a prop rather than
 * being read off the URL here, so these controls can be rendered during the
 * static export — that is how the built HTML ships a real filter bar instead of
 * an empty strip.
 */
function FilterBarControls({ counts, activeCategory, query = '' }: FilterBarControlsProps) {
  const router = useRouter();
  const pathname = usePathname();

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

function FilterBarInner({ counts }: FilterBarProps) {
  const searchParams = useSearchParams();
  const rawCategory = searchParams.get('category');
  const activeCategory = rawCategory && ['games', 'client', 'personal'].includes(rawCategory)
    ? (rawCategory as ProjectCategory)
    : null;

  return (
    <FilterBarControls
      counts={counts}
      activeCategory={activeCategory}
      query={searchParams.toString()}
    />
  );
}

export function FilterBar({ counts }: FilterBarProps) {
  const hasHydrated = useHasHydrated();

  // Knowing which filter is applied needs the browser's `?category=`, which the
  // static export does not have. So the built page shows the bar in its resting
  // state, "All" selected — what an arriving visitor should see before anything
  // is filtered — and the live selection takes over a moment later.
  if (!hasHydrated) {
    return <FilterBarControls counts={counts} activeCategory={null} />;
  }

  return <FilterBarInner counts={counts} />;
}
