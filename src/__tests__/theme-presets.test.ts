import { describe, test, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { ThemeSchema } from '@/types/project-content';
import { listPresets, resolvePreset } from '../../scripts/apply-preset';

// M4 preset catalog gate. Every bundled preset in src/content/theme-presets/ is a
// complete, applyable theme.json — both palettes, fonts, and a non-empty skin
// block on the shipped knobs. A preset that doesn't validate is broken (it would
// crash the site the moment a fork applied it), so parsing under ThemeSchema is
// the real gate here.

const PRESETS_DIR = path.resolve('src/content/theme-presets');

function presetFiles(): string[] {
  return readdirSync(PRESETS_DIR).filter((f) => f.endsWith('.json'));
}

function readPreset(file: string): unknown {
  return JSON.parse(readFileSync(path.join(PRESETS_DIR, file), 'utf-8'));
}

describe('theme presets — catalog', () => {
  test('the three bundled presets are present', () => {
    const names = presetFiles()
      .map((f) => f.replace(/\.json$/, ''))
      .sort();
    expect(names).toEqual(['kiln', 'nocturne', 'werkstatt']);
  });
});

describe('theme presets — schema validity (the real gate)', () => {
  test.each(presetFiles())('%s parses under ThemeSchema', (file) => {
    const result = ThemeSchema.safeParse(readPreset(file));
    // surface the first zod issue in the failure message when it fails
    expect(result.success, result.success ? '' : JSON.stringify(result.error?.issues)).toBe(true);
  });

  test.each(presetFiles())('%s defines BOTH light and dark palettes', (file) => {
    const theme = ThemeSchema.parse(readPreset(file));
    expect(Object.keys(theme.colors.light)).toHaveLength(12);
    expect(Object.keys(theme.colors.dark)).toHaveLength(12);
  });

  test.each(presetFiles())('%s serves fonts via Google (public-engine default)', (file) => {
    const theme = ThemeSchema.parse(readPreset(file));
    expect(theme.fonts.host).toBe('google');
  });
});

describe('theme presets — each preset expresses its designed skin', () => {
  // Lock the design intent from the M4 spec so a future edit can't quietly
  // homogenize the catalog back to one look.
  const expected: Record<string, unknown> = {
    kiln: { glow: 'none', radius: 'sm', labelTreatment: 'impressed' },
    werkstatt: { glow: 'none', radius: 0, labelTreatment: 'block' },
    nocturne: { glow: 'warm', radius: 'sm', labelTreatment: 'plain' },
  };

  test.each(Object.keys(expected))('%s has its signature skin', (name) => {
    const raw = readPreset(`${name}.json`) as { skin?: unknown };
    expect(raw.skin).toEqual(expected[name]);
  });
});

describe('apply-preset — name resolution', () => {
  test('listPresets returns the bundled preset names', () => {
    expect(listPresets().sort()).toEqual(['kiln', 'nocturne', 'werkstatt']);
  });

  test('resolvePreset returns the file path for a known name', () => {
    const resolved = resolvePreset('nocturne', listPresets());
    expect(resolved).toBe(path.join(PRESETS_DIR, 'nocturne.json'));
  });

  test('resolvePreset throws on an unknown name, listing what is available', () => {
    expect(() => resolvePreset('bogus', listPresets())).toThrow(/bogus/);
    expect(() => resolvePreset('bogus', listPresets())).toThrow(/kiln/);
  });
});
