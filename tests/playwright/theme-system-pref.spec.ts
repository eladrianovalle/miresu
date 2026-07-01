import { test, expect } from '@playwright/test';
import { themeMode } from '../../src/theme.config';

/**
 * Theme M1 — first-visit system preference (decision 8, spec 4).
 *
 * Gates on enableToggle, then BRANCHES on defaultMode so it never silently
 * skips: when defaultMode is 'system' it asserts the palette tracks the emulated
 * OS scheme bidirectionally; otherwise it asserts the concrete defaultMode is
 * forced regardless of OS (no stored choice). Desktop project (testMatch widened).
 */
test.describe('theme system preference (first visit)', () => {
  test.skip(!themeMode.enableToggle, 'toggle disabled in this fork (dark-lock)');

  test('first-visit palette follows the defaultMode policy across OS schemes', async ({
    page,
  }) => {
    const html = page.locator('html');

    for (const [scheme, prefersDark] of [
      ['dark', true],
      ['light', false],
    ] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      // Clean first visit: no stored choice.
      await page.addInitScript(() => {
        try {
          localStorage.removeItem('theme');
        } catch {
          // ignore — private mode
        }
      });
      await page.goto('/');

      const expected =
        themeMode.defaultMode === 'system'
          ? prefersDark
            ? 'dark'
            : 'light'
          : themeMode.defaultMode;
      await expect(html).toHaveAttribute('data-theme', expected);
    }
  });
});
