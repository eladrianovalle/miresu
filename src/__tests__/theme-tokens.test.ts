import { describe, test, expect } from 'vitest';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import tailwindConfig from '../../tailwind.config';
import {
  theme,
  hexToRgbChannels,
  onFillInk,
  buildThemeVars,
  checkTokenContract,
  PALETTE_TOKENS,
} from '@/theme.config';
import type { Palette } from '@/types/project-content';

// Theme M0 token-contract gate (Tier 1). These millisecond unit tests own
// per-token correctness for the dual-var pipeline: derivation/drift, var
// completeness, the compiled-Tailwind <alpha-value> substitution, and a
// negative test that is the DURABLE regression guard.

describe('hexToRgbChannels (derivation / drift)', () => {
  test('derives space-separated channels from the brand magenta', () => {
    expect(hexToRgbChannels('#e317d2')).toBe('227 23 210');
  });

  test('handles black, white, and 3-digit shorthand', () => {
    expect(hexToRgbChannels('#000000')).toBe('0 0 0');
    expect(hexToRgbChannels('#ffffff')).toBe('255 255 255');
    expect(hexToRgbChannels('#fff')).toBe('255 255 255');
  });
});

describe('buildThemeVars (completeness + hex-grounded -rgb)', () => {
  const decls = buildThemeVars(theme.colors);
  const map = new Map(decls.map((d) => [d.slice(0, d.indexOf(':')), d.slice(d.indexOf(':') + 1)]));

  // NOTE: the plan prose says "11 tokens" but its own enumerated list (and the
  // verbatim ORC PUNK palette) is 12 — dropping one would break byte-identity.
  // Ground the count in the actual palette keys rather than a magic number.
  test('emits BOTH --cc-color-x and --cc-color-x-rgb for every palette color', () => {
    const paletteKeys = Object.keys(theme.colors);
    expect(PALETTE_TOKENS).toHaveLength(paletteKeys.length);
    expect(PALETTE_TOKENS.map(([key]) => key).sort()).toEqual([...paletteKeys].sort());
    for (const [, varName] of PALETTE_TOKENS) {
      expect(map.has(`--cc-color-${varName}`)).toBe(true);
      expect(map.has(`--cc-color-${varName}-rgb`)).toBe(true);
    }
  });

  test('every -rgb is grounded in its HEX source (not self-referential)', () => {
    for (const [key, varName] of PALETTE_TOKENS) {
      const hex = theme.colors[key];
      // expectation derived from the hex literal, independent of the -rgb var
      expect(map.get(`--cc-color-${varName}-rgb`)).toBe(hexToRgbChannels(hex));
    }
  });

  test('checkTokenContract passes for the shipped palette', () => {
    expect(checkTokenContract(decls)).toEqual([]);
  });
});

describe('onFillInk (luminance-aware, AA-safe category on-fill label)', () => {
  const lum = (hex: string) =>
    hexToRgbChannels(hex)
      .split(' ')
      .map((v) => {
        const s = Number(v) / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      })
      .reduce((acc, c, i) => acc + [0.2126, 0.7152, 0.0722][i] * c, 0);
  const contrast = (a: string, b: string) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  test('picks black on bright colours, white on dark colours', () => {
    expect(onFillInk('#ffffff')).toBe('#000000');
    expect(onFillInk('#000000')).toBe('#ffffff');
    expect(onFillInk('#fffd00')).toBe('#000000'); // bright yellow
    expect(onFillInk('#1b25d2')).toBe('#ffffff'); // deep blue
  });

  test('the chosen ink always clears WCAG AA (4.5:1) — the whole point', () => {
    for (const hex of [
      '#8ba3c7', '#6cc2a8', '#d6a35c', '#36578a', '#2f6f5d', '#9a5b1e', // miresu trio
      '#e317d2', '#05ede5', '#fffd00', '#f15a30', // orcpunk neon + orange
      '#767676', '#7f7f7f', '#808080', // mid-grey crossover
    ]) {
      expect(contrast(hex, onFillInk(hex))).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('buildThemeVars emits an AA on-fill ink per category', () => {
    const decls = buildThemeVars(theme.colors);
    const map = new Map(decls.map((d) => [d.slice(0, d.indexOf(':')), d.slice(d.indexOf(':') + 1)]));
    for (const cat of ['games', 'client', 'personal'] as const) {
      const ink = map.get(`--cc-color-on-category-${cat}`);
      expect(ink === '#ffffff' || ink === '#000000').toBe(true);
    }
  });
});

describe('compiled Tailwind (catches <alpha-value> substitution failure)', () => {
  test('bg-accent/50 emits rgb(var(--cc-color-accent-rgb) / 0.5)', async () => {
    const result = await postcss([
      tailwindcss({
        ...tailwindConfig,
        content: [{ raw: '<div class="bg-accent/50"></div>', extension: 'html' }],
      }),
    ]).process('@tailwind utilities;', { from: undefined });

    const css = result.css.replace(/\s+/g, ' ');
    expect(css).toContain('rgb(var(--cc-color-accent-rgb) / 0.5)');
  });
});

describe('checkTokenContract negative test (durable regression guard)', () => {
  const fixture: Palette = {
    accent: '#e317d2',
    accentSecondary: '#05ede5',
    accentTertiary: '#fffd00',
    primaryDark: '#07070d',
    surface1: '#0d0d14',
    surface2: '#13131e',
    surface3: '#1a1a28',
    border: '#1e1e2e',
    ivory: '#fffff2',
    textPrimary: '#eeeeef',
    textSecondary: '#9e9eb6',
    textMuted: '#8e8ea8',
  };

  test('a valid fixture passes', () => {
    expect(checkTokenContract(buildThemeVars(fixture))).toEqual([]);
  });

  test('a drifted -rgb fails, naming the offending token', () => {
    const decls = buildThemeVars(fixture).map((d) =>
      d === '--cc-color-accent-rgb:227 23 210' ? '--cc-color-accent-rgb:0 0 0' : d,
    );
    const errors = checkTokenContract(decls);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('accent');
  });

  test('a missing -rgb var fails, naming the offending token', () => {
    const decls = buildThemeVars(fixture).filter((d) => d !== '--cc-color-text-muted-rgb:142 142 168');
    const errors = checkTokenContract(decls);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('text-muted');
  });
});
