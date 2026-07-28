'use client';

import { useSyncExternalStore } from 'react';

/*
 * The page's query string, without the leading "?" — e.g. `category=games`.
 *
 * Why not Next's `useSearchParams()`: calling it while the site is being
 * exported to static HTML makes Next give up on the surrounding markup, so the
 * built page ships an empty hole where the project list belongs.
 *
 * Holding that call back until the browser takes over closes the hole, but it
 * swaps one component for another at the moment of hydration. React treats a
 * different component in the same slot as a different thing entirely: it throws
 * the list away and builds a fresh one. Anything attached to the old nodes goes
 * with them — including the focus of a visitor who had already tabbed in, which
 * lands back on the page body and strands a keyboard user mid-list.
 *
 * Reading the URL through a store avoids both problems. The same components
 * stay mounted from the exported HTML onward; hydration changes a string, not
 * the shape of the tree, so React updates the nodes already on the page and
 * focus stays where the visitor put it.
 */

const listeners = new Set<() => void>();

/** The last query string we read or were told about. */
let queryString: string | null = null;

function readAddressBar(): string {
  return window.location.search.replace(/^\?/, '');
}

function tellListeners() {
  for (const listener of listeners) listener();
}

if (typeof window !== 'undefined') {
  // Back and forward move through history without going through us.
  window.addEventListener('popstate', () => {
    queryString = readAddressBar();
    tellListeners();
  });
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getQueryString(): string {
  if (queryString === null) {
    queryString = readAddressBar();
  }
  return queryString;
}

// While the page is being built there is no address bar, and no filter can have
// been chosen yet. The browser's first render has to agree with the HTML that
// was built, so it starts from the same empty answer.
function getQueryStringWhileBuilding(): string {
  return '';
}

export function useUrlQuery(): string {
  return useSyncExternalStore(subscribe, getQueryString, getQueryStringWhileBuilding);
}

/**
 * Point readers at a query string we are navigating to ourselves. Router pushes
 * don't fire `popstate`, and we already know exactly where we're going, so
 * there is nothing to wait for and nothing to re-read.
 */
export function setUrlQuery(nextQuery: string) {
  queryString = nextQuery;
  tellListeners();
}
