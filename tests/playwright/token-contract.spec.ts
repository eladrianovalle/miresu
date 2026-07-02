import { test, expect } from '@playwright/test';
import {
  theme,
  hexToRgbChannels,
  themeFonts,
  fontsHost,
  googleFontsHref,
} from '../../src/theme.config';

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
// miresu's defaultMode is 'system', so pin the color scheme to dark — the build
// default ('system' → 'dark', = resolvedDefaultMode) — otherwise the CI runner's
// OS preference decides which palette paints and this gate is non-deterministic.
// The gate verifies the opacity-compositing pipeline against the default palette.
test.use({ colorScheme: 'dark' });

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
  // Expected channels are DERIVED from the active (default-mode) palette, so the
  // gate tracks whatever theme.json ships — not a hardcoded brand color. The /50
  // opacity utility must composite those channels at alpha 0.5.
  const [er, eg, eb] = hexToRgbChannels(theme.colors.accent).split(' ').map(Number);
  expect(r).toBe(er);
  expect(g).toBe(eg);
  expect(b).toBe(eb);
  expect(a).toBeCloseTo(0.5, 2);
});

/**
 * Theme M2 font-origin gate. Asserts the served export honors theme.json's font
 * `host`: the Google path emits the css2 <link> + preconnect and resolves the
 * `--font-*` var from the theme families, and — the regression guard for the
 * next/font preload leak — ships ZERO self-hosted `<link rel=preload as=font>`.
 * Derives expectations from theme.config so it tracks whatever theme.json ships.
 */
test('fonts: google host emits the stylesheet + preconnect and leaks no self-hosted preload', async ({
  page,
}) => {
  test.skip(fontsHost !== 'google', 'self-host build ships no Google <link>');
  await page.goto('/');

  // Read the live <head> directly — head <link>s aren't reliably matched by
  // Playwright locators, and the same-file opacity gate reads the DOM this way.
  const dom = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('link'));
    return {
      css2:
        links
          .map((l) => l.getAttribute('href'))
          .find((href) => href?.includes('fonts.googleapis.com/css2')) ?? null,
      hasGstaticPreconnect: links.some(
        (l) => l.rel === 'preconnect' && l.getAttribute('href') === 'https://fonts.gstatic.com',
      ),
      fontPreloadCount: links.filter((l) => l.rel === 'preload' && l.getAttribute('as') === 'font')
        .length,
      fontBody: getComputedStyle(document.documentElement).getPropertyValue('--font-body').trim(),
    };
  });

  // The css2 stylesheet URL matches the families/weights from theme.json.
  expect(dom.css2).toBe(googleFontsHref(themeFonts));
  // Preconnect to the Google font origins (perf guardrail from the plan).
  expect(dom.hasGstaticPreconnect).toBe(true);
  // REGRESSION GUARD: a Google-fonts build must not preload any self-hosted
  // (next/font) woff2 — that was the leak the build-time host gate fixes.
  expect(dom.fontPreloadCount).toBe(0);
  // The body font var resolves to the theme's chosen body family.
  expect(dom.fontBody.toLowerCase()).toContain(themeFonts.body.family.toLowerCase());
});
