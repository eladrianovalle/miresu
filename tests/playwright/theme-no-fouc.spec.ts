import { test, expect } from '@playwright/test';
import { themeMode } from '../../src/theme.config';

/**
 * Theme M1 — no-FOUC provenance on the static export (decision 8, spec 2).
 *
 * Reuses the token-contract project pattern (served dist-staging, no dev server).
 * Two complementary describe blocks, each gated ABOVE page.goto so exactly one
 * runs per repo:
 *   • Fork (enableToggle:false): dark-lock — a stored 'light' + OS light still
 *     paints dark; AND the toggle button is absent from the DOM.
 *   • miresu (enableToggle:true): a stored 'light' is honored at first paint,
 *     proven via the .cc-theme-toggle-glyph sentinel (the inline script ran
 *     before the bundle, so the glyph reflects the live mode post-mount).
 */
test.describe('no-FOUC — dark-lock fork (enableToggle:false)', () => {
  test.skip(themeMode.enableToggle, 'toggle enabled — dark-lock assertions N/A');

  test('a stored light + OS light STILL paints dark (forced)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => {
      try {
        localStorage.setItem('theme', 'light');
      } catch {
        // ignore — private mode
      }
    });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('the toggle button is absent from the DOM', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.cc-theme-toggle')).toHaveCount(0);
  });
});

test.describe('no-FOUC — storage-honored (enableToggle:true)', () => {
  test.skip(!themeMode.enableToggle, 'toggle disabled in this fork (dark-lock)');

  test('a stored light is honored at first paint via the glyph sentinel', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('theme', 'light');
      } catch {
        // ignore — private mode
      }
    });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    // Painting light → the toggle's TARGET is dark → moon glyph after mount.
    await expect(page.locator('.cc-theme-toggle-glyph')).toHaveText('☾');
  });
});
