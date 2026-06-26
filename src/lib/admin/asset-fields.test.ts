import { describe, test, expect } from 'vitest';
import { assetKindForPath } from './asset-fields';

describe('assetKindForPath', () => {
  test('detects scalar image fields', () => {
    expect(assetKindForPath('image')).toBe('image');
    expect(assetKindForPath('thumbnail')).toBe('image');
  });

  test('detects gallery — both the array and its numeric-index items', () => {
    expect(assetKindForPath('gallery')).toBe('image');
    expect(assetKindForPath('gallery.0')).toBe('image');
    expect(assetKindForPath('gallery.12')).toBe('image');
  });

  test('detects nested video fields by parent', () => {
    expect(assetKindForPath('video.src')).toBe('video');
    expect(assetKindForPath('video.poster')).toBe('image'); // poster is an image
  });

  test('returns null for non-asset fields', () => {
    expect(assetKindForPath('title')).toBeNull();
    expect(assetKindForPath('description')).toBeNull();
    expect(assetKindForPath('links.0.url')).toBeNull();
    // A bare numeric path must not crash or false-match.
    expect(assetKindForPath('0')).toBeNull();
  });
});
