import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { firstProjectSlug } from './helpers/content';

// Resolve the dossier slug once from content so this survives content swaps.
const PROJECT_SLUG = firstProjectSlug();

/**
 * What the directory is currently showing, read off the page rather than
 * re-derived from the content files: which row comes first, and how long the
 * list gets, are the app's business (it sorts by year and can hold projects
 * back from the site), so a test that recomputed either would be guessing.
 *
 * `topCategory` is the first row's own category. Filtering by it shortens the
 * list without dropping that row, which is what lets a test focus the row and
 * then ask whether the very same element survived.
 */
async function readDirectory(page: import('@playwright/test').Page) {
  const options = page.locator('[role="option"]');
  const total = await options.count();
  const topCategory = await options.first().getAttribute('data-category');
  const inTopCategory = await page
    .locator(`[role="option"][data-category="${topCategory}"]`)
    .count();
  return { total, topCategory, inTopCategory };
}

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

    // The list now ships in the exported HTML, so the item is there from the
    // first paint. Still wait for the real "focusable" signal rather than
    // assume `goto` resolving means the item can take focus.
    const firstItem = page.locator('[role="option"]').first();
    await expect(firstItem).toBeVisible();
    await firstItem.focus();
    await page.keyboard.press('Enter');

    // The dev server renders /projects/[slug] on demand; under concurrent
    // test load its render time is not fixed, so give the navigation more
    // room than the 5s default rather than raise it for every assertion.
    await expect(page).toHaveURL(/\/projects\//, { timeout: 15_000 });
  });

  /**
   * The filter bar and project list ship in the exported HTML, so a visitor can
   * tab into them before React has hydrated. React must then adopt the nodes
   * that are already on the page rather than build replacements: replacing them
   * would strand a keyboard user, dropping focus back to the page body mid-list
   * with no indication of where they were.
   *
   * Focus the element the instant it exists, then wait for the app to come
   * alive, then check that the very same node still holds focus.
   *
   * Loading with `?category=…` is what makes "the app came alive" something a
   * visitor could see for themselves. The built HTML lists every project with
   * "All" lit, because there was no address bar to read while it was written.
   * Narrowing that list to the category the URL asks for is the first thing
   * only a running app can do — so the narrowed list appearing on screen is an
   * exact hydration signal, with no React internals consulted and no guessed
   * wait. `optionsAtGrab` then proves we really did get in first: it records
   * the list length at the moment we took focus, which must still be the full,
   * unfiltered one.
   */
  for (const [what, selector] of [
    ['directory item', '[role="option"]'],
    ['filter tab', '[role="tab"][aria-selected="true"]'],
  ] as const) {
    test(`focus on a ${what} survives hydration`, async ({ page }) => {
      await page.goto('/');
      const { total, topCategory, inTopCategory } = await readDirectory(page);
      // The signal only means anything if filtering visibly shortens the list.
      expect(inTopCategory).toBeLessThan(total);

      await page.addInitScript((sel) => {
        const grab = () => {
          const target = document.querySelector<HTMLElement>(sel);
          if (!target) {
            requestAnimationFrame(grab);
            return;
          }
          target.focus();
          // Hold the exact node so we can tell "same node, still focused" from
          // "a lookalike replacement in its place".
          const held = window as unknown as {
            __focusedEarly?: HTMLElement;
            __optionsAtGrab?: number;
          };
          held.__focusedEarly = target;
          held.__optionsAtGrab = document.querySelectorAll('[role="option"]').length;
        };
        requestAnimationFrame(grab);
      }, selector);

      await page.goto(`/?category=${topCategory}`);

      // The app is live: the list now shows the category the URL asked for.
      await expect(
        page.locator(`[role="tab"][data-cat="${topCategory}"]`),
      ).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('[role="option"]')).toHaveCount(inTopCategory);

      const survived = await page.evaluate(() => {
        const held = window as unknown as {
          __focusedEarly?: HTMLElement;
          __optionsAtGrab?: number;
        };
        if (!held.__focusedEarly) return { grabbed: false };
        return {
          optionsAtGrab: held.__optionsAtGrab,
          stillInDocument: held.__focusedEarly.isConnected,
          stillFocused: document.activeElement === held.__focusedEarly,
        };
      });

      expect(survived).toEqual({
        optionsAtGrab: total,
        stillInDocument: true,
        stillFocused: true,
      });
    });
  }

  test('Escape in mobile detail returns to directory', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(`/projects/${PROJECT_SLUG}/`);
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/$/);
  });
});

/**
 * The directory panel stays on screen while you move around the site, so it can
 * outlive the filter that put it in its current state. Whatever the address bar
 * says is what the tabs, the list, and the project links have to show — after
 * any navigation, not just after clicking a filter button.
 *
 * Both routes below leave a filtered URL for one without a filter, and neither
 * goes through the back button: the mobile back control is a router push, and
 * the Hire link is an ordinary in-app link. Before this was fixed, both left
 * the directory showing the old category and handing out project links that
 * quietly put it back.
 */
test.describe('The address bar is the source of truth', () => {
  async function expectNoFilterShown(
    page: import('@playwright/test').Page,
    unfiltered: { total: number; topCategory: string | null },
  ) {
    await expect(page.locator('[role="tab"][data-cat="all"]')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(
      page.locator(`[role="tab"][data-cat="${unfiltered.topCategory}"]`),
    ).toHaveAttribute('aria-selected', 'false');
    await expect(page.locator('[role="option"]')).toHaveCount(unfiltered.total);

    const hrefs = await page
      .locator('[role="option"]')
      .evaluateAll((items) => items.map((item) => item.getAttribute('href') ?? ''));
    expect(hrefs.filter((href) => href.includes('category='))).toEqual([]);
  }

  test('mobile back to the directory drops the filter with the URL', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');
    const unfiltered = await readDirectory(page);

    await page.goto(`/projects/${PROJECT_SLUG}/?category=${unfiltered.topCategory}`);
    await expect(
      page.locator(`[role="tab"][data-cat="${unfiltered.topCategory}"]`),
    ).toHaveAttribute('aria-selected', 'true');

    await page.getByRole('button', { name: 'Back to project directory' }).click();
    await expect(page).toHaveURL(/\/$/);

    await expectNoFilterShown(page, unfiltered);
  });

  test('following a link that carries no filter drops it too', async ({ page }) => {
    await page.goto('/');
    const unfiltered = await readDirectory(page);

    await page.goto(`/?category=${unfiltered.topCategory}`);
    await expect(
      page.locator(`[role="tab"][data-cat="${unfiltered.topCategory}"]`),
    ).toHaveAttribute('aria-selected', 'true');

    await page.getByRole('link', { name: 'Hire' }).click();
    await expect(page).toHaveURL(/\/consulting\//);

    await expectNoFilterShown(page, unfiltered);
  });
});

test.describe('ARIA Structure', () => {
  test('filter bar has tablist role with tabs', async ({ page }) => {
    await page.goto('/');

    const tablist = page.locator('[role="tablist"]');
    await expect(tablist).toHaveCount(1);

    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(4); // All + the three category tabs (labels are config-driven)

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
