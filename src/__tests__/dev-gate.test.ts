import { describe, test, expect, vi, beforeEach } from 'vitest';
import { assertDevOnly, isDevMode } from '@/lib/admin/dev-gate';

describe('assertDevOnly', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
  });

  test('does not throw in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(() => assertDevOnly()).not.toThrow();
  });

  test('throws in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(() => assertDevOnly()).toThrow('Admin routes are not available in production');
  });

  test('does not throw in non-production environments', () => {
    vi.stubEnv('NODE_ENV', 'test');
    expect(() => assertDevOnly()).not.toThrow();
  });
});

describe('isDevMode', () => {
  test('returns true in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(isDevMode()).toBe(true);
  });

  test('returns false in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(isDevMode()).toBe(false);
  });
});
