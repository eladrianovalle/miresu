/**
 * Theme-field detection + helpers — shared by the admin `ColorField` / `FontField`
 * widgets and their unit tests. No Node/`fs` imports here so it is safe to pull
 * into the client bundle.
 *
 * Detection is path-based, mirroring `assetKindForPath`: the admin's annotations
 * channel is top-level-only and cannot reach nested leaves like
 * `colors.dark.accent` or `fonts.display.family`, so a path registry is the
 * robust choice. It is fully generic (matches the shipped `ThemeSchema` shape,
 * no per-fork names).
 */

export type ThemeFieldKind = 'color' | 'font';

/** The two palettes under `colors.*`. */
const PALETTE_MODES = new Set(['light', 'dark']);
/** The three font slots under `fonts.*` that carry an editable `family`. */
const FONT_SLOTS = new Set(['display', 'mono', 'body']);

/**
 * Decide which theme widget (if any) a form-field path should use.
 *
 * - `colors.<light|dark>.<token>` → the color picker.
 * - `fonts.<display|mono|body>.family` → the font combobox.
 * - everything else (container objects, `fonts.host`, weights, skin, …) → null,
 *   so the generic SchemaField widgets handle it.
 */
export function themeFieldKindForPath(path: string): ThemeFieldKind | null {
  const segs = path.split('.');
  if (segs.length === 3 && segs[0] === 'colors' && PALETTE_MODES.has(segs[1])) {
    return 'color';
  }
  if (segs.length === 3 && segs[0] === 'fonts' && FONT_SLOTS.has(segs[1]) && segs[2] === 'family') {
    return 'font';
  }
  return null;
}

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/;

/**
 * Normalize user-typed color text to a canonical hex string, or null if it is
 * not a valid 3- or 6-digit hex. Adds a missing leading `#`, trims, lowercases.
 * (The schema accepts both 3- and 6-digit, so we do not force expansion here.)
 */
export function normalizeHex(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  return HEX_PATTERN.test(withHash) ? withHash : null;
}

/**
 * Coerce a stored hex into the `#rrggbb` form the native `<input type="color">`
 * requires (it rejects 3-digit shorthand and cannot be empty). Invalid input
 * falls back to black so the picker still renders.
 */
export function toColorInputValue(hex: string): string {
  const norm = normalizeHex(hex);
  if (!norm) return '#000000';
  if (norm.length === 4) {
    const [, r, g, b] = norm; // '#rgb'
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return norm;
}

/**
 * A curated set of Google font families offered as combobox suggestions. Free
 * text is still allowed (a fork can type any family), so this is a convenience
 * list, not an allowlist. Includes the families this engine ships with.
 */
export const CURATED_FONTS: readonly string[] = [
  'Archivo',
  'Barlow',
  'Bebas Neue',
  'DM Mono',
  'DM Sans',
  'DM Serif Display',
  'Fira Code',
  'Fira Sans',
  'Hanken Grotesk',
  'IBM Plex Mono',
  'IBM Plex Sans',
  'IBM Plex Serif',
  'Inter',
  'JetBrains Mono',
  'Josefin Sans',
  'Lato',
  'Libre Franklin',
  'Manrope',
  'Merriweather',
  'Montserrat',
  'Nunito Sans',
  'Open Sans',
  'Outfit',
  'Playfair Display',
  'Poppins',
  'PT Sans',
  'Raleway',
  'Roboto',
  'Roboto Mono',
  'Rubik',
  'Sora',
  'Source Code Pro',
  'Source Sans 3',
  'Space Grotesk',
  'Space Mono',
  'Syne',
  'Work Sans',
];
