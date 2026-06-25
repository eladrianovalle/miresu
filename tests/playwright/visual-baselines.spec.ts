import { test, expect, type Page } from '@playwright/test';

/**
 * Visual baseline captures for all key pages across viewports.
 *
 * Run:  npm run test:visual -- --update-snapshots   (to generate/update baselines)
 * Run:  npm run test:visual                          (to compare against baselines)
 */

const ROUTES = [
  { name: 'homepage', path: '/' },
  { name: 'consulting', path: '/consulting/' },
  { name: 'privacy', path: '/privacy/' },
  { name: 'game-narakan', path: '/games/narakan/' },
  { name: 'game-zohrans-run', path: '/games/zohrans-run/' },
  { name: 'work-avariavs', path: '/work/avariavs/' },
  { name: 'work-hhotr', path: '/work/hip-hop-on-the-rocks/' },
] as const;

const VIEWPORTS = [
  { name: 'mobile', width: 360, height: 740 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

async function waitForPageReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  // Wait for images to load
  await page.waitForTimeout(2000);
  // Freeze all CSS animations/transitions so screenshots are stable
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });
  await page.waitForTimeout(100);
}

for (const viewport of VIEWPORTS) {
  test.describe(`Visual baselines — ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of ROUTES) {
      test(`${route.name}`, async ({ page }) => {
        await page.goto(route.path);
        await waitForPageReady(page);

        await expect(page).toHaveScreenshot(
          `${route.name}-${viewport.name}.png`,
          {
            fullPage: true,
            maxDiffPixelRatio: 0.01,
          },
        );
      });
    }
  });
}
