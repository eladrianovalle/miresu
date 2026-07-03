import { describe, test, expect, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { ZodError } from 'zod';
import { CONTENT_TYPES, isSingletonKey, getJsonSchemaWithAnnotations } from './schemas';
import { writeContentFile } from './file-ops';
import type { JsonSchemaNode } from './api-types';
import { ThemeSchema } from '@/types/project-content';

// A minimal palette so we can build a valid theme fixture without repeating the
// 12 tokens twice by hand.
function palette(): Record<string, string> {
  const tokens = [
    'accent', 'accentSecondary', 'accentTertiary', 'primaryDark',
    'surface1', 'surface2', 'surface3', 'border',
    'ivory', 'textPrimary', 'textSecondary', 'textMuted',
  ];
  return Object.fromEntries(tokens.map((t) => [t, '#123456']));
}

function validTheme() {
  return {
    colors: { light: palette(), dark: palette() },
    defaultMode: 'dark',
    enableToggle: true,
    fonts: {
      host: 'google',
      display: { family: 'Syne' },
      mono: { family: 'Space Mono' },
      body: { family: 'IBM Plex Sans' },
    },
  };
}

describe('theme singleton registration', () => {
  test('resolves in CONTENT_TYPES as a singleton bound to ThemeSchema + theme.json', () => {
    const entry = CONTENT_TYPES.theme;
    expect(entry.kind).toBe('singleton');
    expect(entry.schema).toBe(ThemeSchema);
    if (entry.kind === 'singleton') {
      expect(entry.filePath).toBe('src/content/theme.json');
    }
    expect(entry.label).toBeTruthy();
  });

  test('is recognised by the generic singleton route guard', () => {
    expect(isSingletonKey('theme')).toBe(true);
    expect(isSingletonKey('not-a-singleton')).toBe(false);
  });

  // The recursive form dispatches on the JSON-schema shape the theme produces.
  // Pin those shapes so a widget lands on the right control:
  //   plain string  -> ColorField / FontField (via path) ; enum -> SelectField ;
  //   anyOf-of-const -> SelectField (skin.radius literal union).
  test('exposes the JSON-schema shapes the form dispatch relies on', () => {
    const { jsonSchema } = getJsonSchemaWithAnnotations('theme');
    const root = jsonSchema as JsonSchemaNode;
    const prop = (node: JsonSchemaNode | undefined, key: string): JsonSchemaNode => {
      const child = node?.properties?.[key];
      if (!child) throw new Error(`missing schema property: ${key}`);
      return child;
    };

    const accent = prop(prop(prop(root, 'colors'), 'dark'), 'accent');
    expect(accent.type).toBe('string');
    expect(accent.enum).toBeUndefined();

    const family = prop(prop(prop(root, 'fonts'), 'display'), 'family');
    expect(family.type).toBe('string');
    expect(family.enum).toBeUndefined();

    const skin = prop(root, 'skin');
    expect(prop(skin, 'glow').enum).toEqual(['neon', 'warm', 'none']);
    expect(prop(skin, 'radius').anyOf?.map((m) => m.const)).toEqual([0, 'sm', 'md']);
  });
});

describe('theme singleton save path validates against ThemeSchema', () => {
  const tmpFile = path.join(os.tmpdir(), `miresu-theme-${process.pid}.json`);

  afterEach(async () => {
    await fs.rm(tmpFile, { force: true });
  });

  test('writes a valid theme and reads it back intact', async () => {
    await writeContentFile(tmpFile, validTheme(), ThemeSchema);
    const written: unknown = JSON.parse(await fs.readFile(tmpFile, 'utf-8'));
    expect(ThemeSchema.parse(written).colors.dark.accent).toBe('#123456');
  });

  test('rejects a schema-invalid edit before writing (bad hex color)', async () => {
    const bad = validTheme();
    bad.colors.dark.accent = 'not-a-color';
    await expect(writeContentFile(tmpFile, bad, ThemeSchema)).rejects.toBeInstanceOf(ZodError);
    // Nothing was written.
    await expect(fs.access(tmpFile)).rejects.toBeTruthy();
  });
});
