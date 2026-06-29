import { test, expect } from '@playwright/test';

/**
 * Theme M0 token-contract gate — Tier 2 (the irreducible browser fact).
 *
 * Tier 1 (vitest) owns per-token correctness. This is the ONE end-to-end check
 * that a real CSS engine paints `rgb(var(--cc-color-*-rgb) / <alpha>)` — jsdom
 * can't resolve var()/composite alpha. Runs against the served static export
 * (dist-staging), per the issue's mandate; wired into CI's `build` job.
 *
 * Gate-owned fixture: we inject our own element and set the opacity utility via
 * page.evaluate (safelisted in tailwind.config so it's always compiled), so the
 * assertion can't pass vacuously off some incidental live selector. Computed
 * style is parsed NUMERICALLY, not string-compared.
 */
test('an opacity utility composites accent at 0.5 alpha end-to-end', async ({ page }) => {
  await page.goto('/');

  const channels = await page.evaluate(() => {
    const el = document.createElement('div');
    el.id = 'token-contract-fixture';
    el.className = 'bg-accent/50';
    document.body.appendChild(el);
    const bg = getComputedStyle(el).backgroundColor;
    el.remove();
    // Match rgb()/rgba() in either legacy-comma or space/slash notation.
    const nums = bg.match(/[\d.]+/g)?.map(Number) ?? [];
    return nums;
  });

  expect(channels.length).toBeGreaterThanOrEqual(4);
  const [r, g, b, a] = channels;
  // accent #e317d2 → 227 23 210, with the /50 opacity utility → alpha 0.5
  expect(r).toBe(227);
  expect(g).toBe(23);
  expect(b).toBe(210);
  expect(a).toBeCloseTo(0.5, 2);
});
