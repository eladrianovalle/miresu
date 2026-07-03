import { describe, test, expect } from 'vitest';
import {
  themeFieldKindForPath,
  normalizeHex,
  toColorInputValue,
  CURATED_FONTS,
} from './theme-fields';

describe('themeFieldKindForPath (dispatch decision)', () => {
  test('routes palette color leaves to the color widget', () => {
    expect(themeFieldKindForPath('colors.dark.accent')).toBe('color');
    expect(themeFieldKindForPath('colors.light.accent')).toBe('color');
    expect(themeFieldKindForPath('colors.dark.textMuted')).toBe('color');
    expect(themeFieldKindForPath('colors.light.surface3')).toBe('color');
  });

  test('routes font-family leaves to the font widget', () => {
    expect(themeFieldKindForPath('fonts.display.family')).toBe('font');
    expect(themeFieldKindForPath('fonts.mono.family')).toBe('font');
    expect(themeFieldKindForPath('fonts.body.family')).toBe('font');
  });

  test('leaves everything else for the generic widgets', () => {
    // The palette/font container objects are not leaves.
    expect(themeFieldKindForPath('colors')).toBeNull();
    expect(themeFieldKindForPath('colors.dark')).toBeNull();
    expect(themeFieldKindForPath('fonts')).toBeNull();
    expect(themeFieldKindForPath('fonts.display')).toBeNull();
    // Enum / boolean / array fields keep their existing widgets.
    expect(themeFieldKindForPath('fonts.host')).toBeNull();
    expect(themeFieldKindForPath('fonts.display.weights.0')).toBeNull();
    expect(themeFieldKindForPath('fonts.display.variable')).toBeNull();
    expect(themeFieldKindForPath('skin.glow')).toBeNull();
    expect(themeFieldKindForPath('defaultMode')).toBeNull();
    expect(themeFieldKindForPath('enableToggle')).toBeNull();
    // Unrelated project fields never false-match.
    expect(themeFieldKindForPath('title')).toBeNull();
    expect(themeFieldKindForPath('accentColor')).toBeNull();
  });
});

describe('normalizeHex', () => {
  test('passes valid hex through, lowercased', () => {
    expect(normalizeHex('#e317d2')).toBe('#e317d2');
    expect(normalizeHex('#E317D2')).toBe('#e317d2');
    expect(normalizeHex('#ABC')).toBe('#abc');
  });

  test('adds a missing leading hash and trims whitespace', () => {
    expect(normalizeHex('aabbcc')).toBe('#aabbcc');
    expect(normalizeHex('  #Fff  ')).toBe('#fff');
  });

  test('rejects malformed input as null', () => {
    expect(normalizeHex('')).toBeNull();
    expect(normalizeHex('#')).toBeNull();
    expect(normalizeHex('nothex')).toBeNull();
    expect(normalizeHex('#12')).toBeNull(); // 2 digits
    expect(normalizeHex('#1234')).toBeNull(); // 4 digits
    expect(normalizeHex('#12345g')).toBeNull(); // bad char
  });
});

describe('toColorInputValue (native picker needs #rrggbb)', () => {
  test('expands 3-digit shorthand to 6 digits', () => {
    expect(toColorInputValue('#abc')).toBe('#aabbcc');
    expect(toColorInputValue('#fff')).toBe('#ffffff');
  });

  test('lowercases and passes 6-digit hex through', () => {
    expect(toColorInputValue('#AABBCC')).toBe('#aabbcc');
    expect(toColorInputValue('#abcdef')).toBe('#abcdef');
  });

  test('falls back to black for invalid input (picker cannot be empty)', () => {
    expect(toColorInputValue('garbage')).toBe('#000000');
    expect(toColorInputValue('')).toBe('#000000');
  });
});

describe('CURATED_FONTS', () => {
  test('offers a substantial curated list', () => {
    expect(CURATED_FONTS.length).toBeGreaterThanOrEqual(30);
  });

  test('includes the families this engine ships with', () => {
    for (const family of ['Hanken Grotesk', 'IBM Plex Mono', 'IBM Plex Sans', 'Syne', 'Space Mono']) {
      expect(CURATED_FONTS).toContain(family);
    }
  });

  test('has no duplicates', () => {
    expect(new Set(CURATED_FONTS).size).toBe(CURATED_FONTS.length);
  });
});
