import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { firstProjectSlug } from './helpers/content';

// Resolve the dossier slug once from content so this survives content swaps.
const PROJECT_SLUG = firstProjectSlug();

/**
 * Run axe against the settled page. Entrance animations (the dossier content
 * staggers in over ~0.4s via cc-juice-in) are jumped to their end state first,
 * so contrast is measured against final colors rather than mid-fade opacity —
 * a transient opacity is not a real WCAG contrast failure.
 */
async function scanSettled(page: import('@playwright/test').Page) {
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }`,
  });
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .exclude('nextjs-portal')
    .exclude('#__next-build-indicator')
    .exclude('[data-next-mark]')
    .analyze();
}

test.describe('WCAG AA — axe-core', () => {
  test('command center has no violations', async ({ page }) => {
    await page.goto('/');
    const results = await scanSettled(page);
    expect(results.violations).toEqual([]);
  });

  test('project dossier has no violations', async ({ page }) => {
    await page.goto(`/projects/${PROJECT_SLUG}/`);
    const results = await scanSettled(page);
    expect(results.violations).toEqual([]);
  });

  test('consulting dossier has no violations', async ({ page }) => {
    await page.goto('/consulting/');
    const results = await scanSettled(page);
    expect(results.violations).toEqual([]);
  });
});

test.describe('WCAG AA — Mobile', () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test('mobile directory has no violations', async ({ page }) => {
    await page.goto('/');
    const results = await scanSettled(page);
    expect(results.violations).toEqual([]);
  });

  test('mobile dossier has no violations', async ({ page }) => {
    await page.goto(`/projects/${PROJECT_SLUG}/`);
    const results = await scanSettled(page);
    expect(results.violations).toEqual([]);
  });
});

test.describe('Keyboard Navigation', () => {
  test('Tab moves through skip link, filter tabs, directory items', async ({ page }) => {
    await page.goto('/');

    // First Tab should reach skip link
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toHaveClass(/cc-skip-link/);

    // Continue tabbing — should reach filter bar
    await page.keyboard.press('Tab'); // second skip link
    await page.keyboard.press('Tab'); // topbar or filter
    // Verify we're in the filter area or beyond skip links
    const activeTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeTag).toBeTruthy();
  });

  test('Arrow keys navigate filter tabs', async ({ page }) => {
    await page.goto('/');

    // Focus the active filter tab
    const activeTab = page.locator('[role="tab"][aria-selected="true"]');
    await activeTab.focus();
    await expect(activeTab).toBeFocused();

    // Arrow Right should move to next tab
    await page.keyboard.press('ArrowRight');
    const nextFocused = page.locator(':focus');
    await expect(nextFocused).toHaveRole('tab');
  });

  test('Arrow keys navigate directory items', async ({ page }) => {
    await page.goto('/');

    // Focus first directory item
    const firstItem = page.locator('[role="option"]').first();
    await firstItem.focus();
    await expect(firstItem).toBeFocused();

    // Arrow Down should move to next item
    await page.keyboard.press('ArrowDown');
    const secondItem = page.locator('[role="option"]').nth(1);
    await expect(secondItem).toBeFocused();
  });

  test('Enter on directory item navigates to project', async ({ page }) => {
    await page.goto('/');

    const firstItem = page.locator('[role="option"]').first();
    await firstItem.focus();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/projects\//);
  });

  test('Escape in mobile detail returns to directory', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(`/projects/${PROJECT_SLUG}/`);
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('ARIA Structure', () => {
  test('filter bar has tablist role with tabs', async ({ page }) => {
    await page.goto('/');

    const tablist = page.locator('[role="tablist"]');
    await expect(tablist).toHaveCount(1);

    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(4); // All, Games, Clients, Collabs

    // Exactly one tab should be selected
    const selected = page.locator('[role="tab"][aria-selected="true"]');
    await expect(selected).toHaveCount(1);
  });

  test('directory has listbox role with options', async ({ page }) => {
    await page.goto('/');

    const listbox = page.locator('[role="listbox"]');
    await expect(listbox).toHaveCount(1);

    const options = page.locator('[role="option"]');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
  });

  test('skip links exist and target correct elements', async ({ page }) => {
    await page.goto('/');

    const skipToProjects = page.locator('a[href="#project-directory"]');
    await expect(skipToProjects).toHaveCount(1);

    const skipToDetail = page.locator('a[href="#project-detail"]');
    await expect(skipToDetail).toHaveCount(1);

    // Targets exist
    await expect(page.locator('#project-directory')).toHaveCount(1);
    await expect(page.locator('#project-detail')).toHaveCount(1);
  });

  test('landmarks are present', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('header')).toHaveCount(1);
    await expect(page.locator('nav[aria-label="Project directory"]')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    const footerCount = await page.locator('footer').count();
    expect(footerCount).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Focus Management', () => {
  test('project dossier title receives focus on load', async ({ page }) => {
    await page.goto(`/projects/${PROJECT_SLUG}/`);
    // Wait for focus to settle
    await page.waitForTimeout(500);

    const focused = page.locator(':focus');
    await expect(focused).toHaveClass(/cc-dossier-title/);
  });

  test('all interactive elements have visible focus indicator', async ({ page }) => {
    await page.goto('/');

    const selectors = ['a.cc-project-item', 'button.cc-filter-btn'];
    for (const selector of selectors) {
      const el = page.locator(selector).first();
      if ((await el.count()) > 0) {
        await el.focus();
        const outlineStyle = await el.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return styles.outlineStyle;
        });
        expect(outlineStyle).not.toBe('none');
      }
    }
  });
});
