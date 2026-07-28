'use client';

import { useSyncExternalStore } from 'react';

// Nothing ever changes this value, so the subscribe callback has nothing to
// listen to and no cleanup to do. React just needs a function here.
const subscribeToNothing = () => () => {};
const onTheClient = () => true;
const whileBuilding = () => false;

/**
 * False while the page is being built and during the browser's first render;
 * true from then on.
 *
 * Use it to hold back anything that needs the live URL, `useSearchParams()`
 * above all. This site is exported to static HTML, and calling that hook while
 * the HTML is being written makes Next.js give up on the surrounding markup
 * entirely — the built page ships an empty hole where the content should be, and
 * the browser has to fill it in from scratch. Gating on this hook keeps the first
 * render identical to the exported HTML, so React reuses that HTML instead of
 * discarding it, and defers the URL-aware render to the browser, where the URL
 * actually exists.
 */
export function useHasHydrated(): boolean {
  return useSyncExternalStore(subscribeToNothing, onTheClient, whileBuilding);
}
