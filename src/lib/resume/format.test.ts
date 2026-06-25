import { describe, test, expect } from 'vitest';
import { formatDate, formatDateRange } from './format';

describe('formatDate', () => {
  test("'YYYY-MM' → 'Mon YYYY'", () => {
    expect(formatDate('2023-08')).toBe('Aug 2023');
  });
  test("'present' → 'Present'", () => {
    expect(formatDate('present')).toBe('Present');
  });
  test("year-only 'YYYY' passes through", () => {
    expect(formatDate('2018')).toBe('2018');
  });
});

describe('formatDateRange', () => {
  test('no range → empty string', () => {
    expect(formatDateRange(undefined)).toBe('');
  });

  test('distinct endpoints render as a range', () => {
    expect(formatDateRange({ start: '2023-08', end: '2025-07' })).toBe('Aug 2023 — Jul 2025');
  });

  test('single-point span collapses to one label (year-only entry)', () => {
    // projectResume emits { start: 'YYYY', end: 'YYYY' } for a year-only entry.
    expect(formatDateRange({ start: '2018', end: '2018' })).toBe('2018');
  });

  test('same month/year collapses too', () => {
    expect(formatDateRange({ start: '2024-03', end: '2024-03' })).toBe('Mar 2024');
  });
});
