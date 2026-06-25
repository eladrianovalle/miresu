/**
 * Runtime guard that prevents admin functionality in production.
 *
 * NOTE (C1-1): Admin code IS included in the production server bundle.
 * Next.js does NOT tree-shake pages based on runtime redirect behavior.
 * This runtime check is the real security boundary, not build-time
 * elimination. The admin layout also redirects in production as a
 * belt-and-suspenders measure.
 */
export function assertDevOnly(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Admin routes are not available in production');
  }
}

/**
 * Check if we're in development mode. Non-throwing variant for
 * conditional rendering.
 */
export function isDevMode(): boolean {
  return process.env.NODE_ENV !== 'production';
}
