import { test, expect } from '@playwright/test';
import { themeMode } from '../../src/theme.config';

/**
 * Theme M1 — toggle flip + persistence (decision 8, spec 1).
 *
 * Runs for real in miresu (enableToggle:true). In the dark-locked ORC PUNK fork
 * (enableToggle:false) it SELF-SKIPS — the gate sits ABOVE page.goto so a skipped
 * run never touches the page. Desktop project (testMatch widened).
 */
test.describe('theme toggle', () => {
  test.skip(!themeMode.enableToggle, 'toggle disabled in this fork (dark-lock)');

  test('flips data-theme + the computed accent var, and persists across reload', async ({
    page,
  }) => {
    await page.goto('/');
    const html = page.locator('html');
    const initial = await html.getAttribute('data-theme');
    const target = initial === 'dark' ? 'light' : 'dark';

    const accentBefore = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--cc-color-accent')
        .trim(),
    );

    await page.locator('.cc-theme-toggle').click();
    await expect(html).toHaveAttribute('data-theme', target);

    const accentAfter = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--cc-color-accent')
        .trim(),
    );
    // The two palettes differ, so flipping must move the computed accent var.
    expect(accentAfter).not.toBe(accentBefore);

    // Choice survives a full reload (localStorage), with no flash back to default.
    await page.reload();
    await expect(html).toHaveAttribute('data-theme', target);
  });
});
