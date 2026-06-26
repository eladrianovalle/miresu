import { describe, test, expect } from 'vitest';
import { getHeroImage, descriptionFor } from './project-utils';

describe('getHeroImage', () => {
  test('prefers image, falls back to first non-empty gallery entry', () => {
    expect(getHeroImage({ image: '/a.jpg' })).toBe('/a.jpg');
    expect(getHeroImage({ image: '  ', gallery: ['/g.jpg'] })).toBe('/g.jpg');
    expect(getHeroImage({ gallery: ['', '/g2.jpg'] })).toBe('/g2.jpg');
    expect(getHeroImage({})).toBeUndefined();
  });
});

describe('descriptionFor', () => {
  test('uses the authored description when present', () => {
    expect(descriptionFor({ description: 'Hand-written blurb.', resumeBullets: ['x'] })).toBe(
      'Hand-written blurb.',
    );
  });

  test('falls back to resume bullets strung into prose when description is blank/omitted', () => {
    expect(
      descriptionFor({ resumeBullets: ['Led a team of 5', 'Shipped on iOS and Android.'] }),
    ).toBe('Led a team of 5. Shipped on iOS and Android.');
    // Blank description counts as absent.
    expect(descriptionFor({ description: '   ', resumeBullets: ['Built the thing'] })).toBe(
      'Built the thing.',
    );
  });

  test('returns empty string when there is neither description nor bullets', () => {
    expect(descriptionFor({})).toBe('');
    expect(descriptionFor({ resumeBullets: [] })).toBe('');
  });
});
