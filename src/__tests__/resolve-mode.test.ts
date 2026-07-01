import { describe, test, expect } from 'vitest';
import { resolveMode } from '@/theme.config';

// Theme M1 — the no-FOUC decision logic. resolveMode is the single source of
// truth shared by the inline <head> script, the ThemeToggle, and these tests.
// Every branch is covered so the inline script (which mirrors it) can't drift.
//
// `prefersDark` is tri-state: true → OS prefers dark, false → OS prefers light,
// undefined → no preference OR no matchMedia. ONLY explicit `false` → light.

describe('resolveMode — enableToggle:false (forced default, stored ignored)', () => {
  test('defaultMode "light" forces light', () => {
    expect(resolveMode(null, undefined, 'light', false)).toBe('light');
  });

  test('defaultMode "dark" forces dark', () => {
    expect(resolveMode(null, undefined, 'dark', false)).toBe('dark');
  });

  test('defaultMode "system" + prefersDark:true → dark', () => {
    expect(resolveMode(null, true, 'system', false)).toBe('dark');
  });

  test('defaultMode "system" + prefersDark:false → light', () => {
    expect(resolveMode(null, false, 'system', false)).toBe('light');
  });

  test('defaultMode "system" + no preference (undefined) → dark', () => {
    expect(resolveMode(null, undefined, 'system', false)).toBe('dark');
  });

  test('a stored choice is IGNORED when toggling is off', () => {
    expect(resolveMode('light', true, 'dark', false)).toBe('dark');
    expect(resolveMode('dark', false, 'light', false)).toBe('light');
  });
});

describe('resolveMode — enableToggle:true, stored choice wins', () => {
  test('stored "light" wins over everything', () => {
    expect(resolveMode('light', true, 'dark', true)).toBe('light');
  });

  test('stored "dark" wins over everything', () => {
    expect(resolveMode('dark', false, 'light', true)).toBe('dark');
  });

  test('an invalid stored value is ignored (falls through to default)', () => {
    expect(resolveMode('purple', false, 'light', true)).toBe('light');
    expect(resolveMode('', true, 'system', true)).toBe('dark');
  });
});

describe('resolveMode — enableToggle:true, no stored, defaultMode "system"', () => {
  test('prefersDark:true → dark', () => {
    expect(resolveMode(null, true, 'system', true)).toBe('dark');
  });

  test('prefersDark:false → light', () => {
    expect(resolveMode(null, false, 'system', true)).toBe('light');
  });

  test('no preference (undefined) → dark', () => {
    expect(resolveMode(null, undefined, 'system', true)).toBe('dark');
  });
});

describe('resolveMode — enableToggle:true, no stored, concrete defaultMode', () => {
  test('defaultMode "light" used as-is regardless of OS', () => {
    expect(resolveMode(null, true, 'light', true)).toBe('light');
  });

  test('defaultMode "dark" used as-is regardless of OS', () => {
    expect(resolveMode(null, false, 'dark', true)).toBe('dark');
  });
});
