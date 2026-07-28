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
 *
 * The address bar is the only answer this store gives. It deliberately keeps no
 * copy of its own, because a copy is a thing that can go stale: leave a project
 * page for the directory and a remembered `category=games` would leave the
 * filter tabs, the list, and every project link describing a filter the address
 * bar no longer mentions.
 */

const listeners = new Set<() => void>();

function tellListeners() {
  for (const listener of listeners) listener();
}

/*
 * Next's router moves between routes by calling `history.pushState` or
 * `replaceState`, and neither fires an event of its own. Wrapping them is how
 * we hear about every navigation that isn't the back/forward button: a `<Link>`
 * click, a `router.push()` such as the mobile "Back to directory" button, and
 * the filter buttons.
 */
function watchHistoryWrites() {
  for (const method of ['pushState', 'replaceState'] as const) {
    const write = window.history[method];
    window.history[method] = function (
      this: History,
      ...args: Parameters<History['pushState']>
    ) {
      const result = write.apply(this, args);
      tellListeners();
      return result;
    };
  }
}

if (typeof window !== 'undefined') {
  // Back and forward move through history without going through the router.
  window.addEventListener('popstate', tellListeners);
  watchHistoryWrites();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getQueryString(): string {
  return window.location.search.replace(/^\?/, '');
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
