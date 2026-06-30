// theme.config.ts — the typed reader over the theme content (the visual overlay).
//
// A fork re-brands by editing the palette in src/content/theme.json (and
// fonts.ts for typefaces). The engine reads from HERE — tailwind.config.ts
// imports the active palette, and the root layout injects it as :root CSS
// variables — so the engine files stay identical across forks (clean upstream
// merge). This reader selects the default-mode palette from theme.json and
// exposes the same `{ colors }` value shape the consumers already expect.
//
// Default: a restrained neutral. The engine exposes three semantic accents —
// `accent` (primary), `accentSecondary`, `accentTertiary` — equal in the
// stock palette so the UI reads as a single accent; a fork themes them apart.
import type { Palette } from './types/project-content';
import themeContent from './content/theme.json';

// Both palettes, for the dual-`[data-theme]` injection in the root layout. The
// no-FOUC script + the toggle pick which one paints at runtime via `data-theme`.
export const palettes = themeContent.colors;

// The mode knobs the engine honors. `defaultMode` is the first-visit/no-JS
// palette; `enableToggle` gates whether the toggle renders + localStorage wins.
export const themeMode = {
  defaultMode: themeContent.defaultMode as 'light' | 'dark' | 'system',
  enableToggle: themeContent.enableToggle,
};

// Pure, dependency-free no-FOUC resolution logic. Single source of truth for
// BOTH the inline <head> script and the ThemeToggle/tests, so they can never
// drift. Given the stored choice, the OS preference, and the two knobs, returns
// the concrete palette to paint.
//
// `prefersDark` is tri-state: `true` → OS prefers dark, `false` → OS prefers
// light, `undefined` → no preference OR no `matchMedia` at all. ONLY an explicit
// `false` resolves 'system' to light; the no-preference/absent case → 'dark'.
//
// When toggling is OFF, the stored choice is ignored and `defaultMode` is forced
// (resolving 'system' via `prefersDark`). When toggling is ON, a valid stored
// 'light'|'dark' wins; otherwise 'system' follows `prefersDark` and a concrete
// `defaultMode` is used as-is.
export function resolveMode(
  stored: string | null | undefined,
  prefersDark: boolean | undefined,
  defaultMode: 'light' | 'dark' | 'system',
  enableToggle: boolean,
): 'light' | 'dark' {
  const sys = (): 'light' | 'dark' => (prefersDark === false ? 'light' : 'dark');
  if (!enableToggle) {
    return defaultMode === 'system' ? sys() : defaultMode;
  }
  if (stored === 'light' || stored === 'dark') return stored;
  return defaultMode === 'system' ? sys() : defaultMode;
}

// Test-only back-compat: the active palette for the resolved default mode, with
// 'system' → 'dark' (a deterministic build-time fallback; runtime `data-theme`
// governs actual display). Nothing shipped bakes these literals — Tailwind reads
// the `--cc-color-*` vars — so this only feeds the Tier-1 token-contract test.
const activeMode: 'light' | 'dark' =
  themeMode.defaultMode === 'system' ? 'dark' : themeMode.defaultMode;
const activeColors: Palette = palettes[activeMode];

export const theme = {
  colors: activeColors,
};

export type Theme = typeof theme;

/**
 * Derive the space-separated RGB channels of a hex color, e.g.
 * `#e317d2` → `"227 23 210"`. This is the form Tailwind tokens reference as
 * `rgb(var(--cc-color-*-rgb) / <alpha-value>)`, which is what preserves the
 * opacity utilities (`bg-accent/50`) once colors flow through runtime vars.
 * Channels are ALWAYS derived here — never authored into theme.json.
 */
export function hexToRgbChannels(hex: string): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((ch) => ch + ch).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

// The 12 palette tokens in injection order, paired with their `--cc-color-*`
// var basename. Single source of truth for the dual-var builder + its gate.
export const PALETTE_TOKENS: ReadonlyArray<readonly [keyof Palette, string]> = [
  ['accent', 'accent'],
  ['accentSecondary', 'accent-secondary'],
  ['accentTertiary', 'accent-tertiary'],
  ['primaryDark', 'primary-dark'],
  ['surface1', 'surface-1'],
  ['surface2', 'surface-2'],
  ['surface3', 'surface-3'],
  ['border', 'border'],
  ['ivory', 'ivory'],
  ['textPrimary', 'text-primary'],
  ['textSecondary', 'text-secondary'],
  ['textMuted', 'text-muted'],
];

/**
 * Build the `:root` CSS variable declarations for a palette. Each of the 12
 * colors emits BOTH `--cc-color-*` (hex — consumed by the bare skin-CSS var()
 * usages) and `--cc-color-*-rgb` (channels — referenced by Tailwind tokens so
 * opacity utilities keep working). Category-dot vars are plain hex (no opacity
 * utility targets them). Pure + dependency-free so the gate can assert on it.
 */
export function buildThemeVars(palette: Palette): string[] {
  const decls: string[] = [];
  for (const [key, varName] of PALETTE_TOKENS) {
    const hex = palette[key];
    decls.push(`--cc-color-${varName}:${hex}`);
    decls.push(`--cc-color-${varName}-rgb:${hexToRgbChannels(hex)}`);
  }
  decls.push(`--cc-color-category-games:${palette.accent}`);
  decls.push(`--cc-color-category-client:${palette.accentSecondary}`);
  decls.push(`--cc-color-category-personal:${palette.accentTertiary}`);
  return decls;
}

/**
 * The durable token-contract guard. Given a list of `--cc-color-*` declarations
 * (as produced by buildThemeVars), assert every one of the 12 palette tokens
 * carries BOTH `--cc-color-<name>` (hex) and `--cc-color-<name>-rgb`, and that
 * the `-rgb` channels are grounded in the hex SOURCE (not self-referential).
 * Returns an error string per offending token (named), empty when the contract
 * holds — so a corrupted palette fails loudly instead of silently degrading the
 * opacity-utility pipeline. Pure: no DOM, no I/O.
 */
export function checkTokenContract(decls: string[]): string[] {
  const map = new Map<string, string>();
  for (const d of decls) {
    const i = d.indexOf(':');
    if (i === -1) continue;
    map.set(d.slice(0, i), d.slice(i + 1));
  }
  const errors: string[] = [];
  for (const [, varName] of PALETTE_TOKENS) {
    const hex = map.get(`--cc-color-${varName}`);
    const rgb = map.get(`--cc-color-${varName}-rgb`);
    if (hex === undefined) {
      errors.push(`${varName}: missing --cc-color-${varName}`);
      continue;
    }
    if (rgb === undefined) {
      errors.push(`${varName}: missing --cc-color-${varName}-rgb`);
      continue;
    }
    const expected = hexToRgbChannels(hex);
    if (rgb !== expected) {
      errors.push(`${varName}: --cc-color-${varName}-rgb is "${rgb}", expected "${expected}" from ${hex}`);
    }
  }
  return errors;
}
