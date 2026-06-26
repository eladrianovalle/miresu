import { describe, test, expect, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import {
  saveUploadedAsset,
  sanitizeFilename,
  AssetValidationError,
} from './asset-ops';
import { ASSET_LIMITS } from './asset-fields';

// All happy-path writes land under this namespaced slug so teardown is total.
const FIXTURE_SLUG = 'vitest-asset-fixture';
const FIXTURE_DIR = path.join(process.cwd(), 'public', 'assets', 'images', 'games', FIXTURE_SLUG);

afterEach(async () => {
  await fs.rm(FIXTURE_DIR, { recursive: true, force: true });
  await fs.rm(path.join(process.cwd(), 'public', 'assets', 'videos', 'games', FIXTURE_SLUG), {
    recursive: true,
    force: true,
  });
});

const tiny = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

describe('sanitizeFilename', () => {
  test('lowercases, hyphenates, and strips directory components', () => {
    expect(sanitizeFilename('My Hero IMG.PNG')).toEqual({ base: 'my-hero-img', ext: 'png' });
    expect(sanitizeFilename('../../etc/Pass Word.JPG')).toEqual({ base: 'pass-word', ext: 'jpg' });
    expect(sanitizeFilename('___weird@@name__.webp')).toEqual({ base: 'weird-name', ext: 'webp' });
  });

  test('falls back to "asset" when the base sanitizes to empty', () => {
    expect(sanitizeFilename('@@@.png')).toEqual({ base: 'asset', ext: 'png' });
  });
});

describe('saveUploadedAsset — rejection matrix', () => {
  test('rejects an unknown asset kind', async () => {
    await expect(
      saveUploadedAsset({ kind: 'audio', category: 'games', slug: FIXTURE_SLUG, filename: 'a.png', bytes: tiny }),
    ).rejects.toBeInstanceOf(AssetValidationError);
  });

  test('rejects an unknown category', async () => {
    await expect(
      saveUploadedAsset({ kind: 'image', category: 'marketing', slug: FIXTURE_SLUG, filename: 'a.png', bytes: tiny }),
    ).rejects.toThrow(/Invalid category/);
  });

  test('rejects a malformed slug (including traversal attempts)', async () => {
    for (const slug of ['../escape', 'Bad_Slug', 'a/b', '']) {
      await expect(
        saveUploadedAsset({ kind: 'image', category: 'games', slug, filename: 'a.png', bytes: tiny }),
      ).rejects.toThrow(/Invalid slug/);
    }
  });

  test('rejects a disallowed extension', async () => {
    await expect(
      saveUploadedAsset({ kind: 'image', category: 'games', slug: FIXTURE_SLUG, filename: 'evil.svgz', bytes: tiny }),
    ).rejects.toThrow(/Unsupported image type/);
    // A valid image extension is not valid for a video field.
    await expect(
      saveUploadedAsset({ kind: 'video', category: 'games', slug: FIXTURE_SLUG, filename: 'clip.png', bytes: tiny }),
    ).rejects.toThrow(/Unsupported video type/);
  });

  test('rejects an oversize file with a 413 status (no allocation needed)', async () => {
    const fakeOversize = { byteLength: ASSET_LIMITS.image.maxBytes + 1 } as unknown as Buffer;
    try {
      await saveUploadedAsset({ kind: 'image', category: 'games', slug: FIXTURE_SLUG, filename: 'big.png', bytes: fakeOversize });
      throw new Error('expected rejection');
    } catch (err) {
      expect(err).toBeInstanceOf(AssetValidationError);
      expect((err as AssetValidationError).status).toBe(413);
    }
  });
});

describe('saveUploadedAsset — happy path', () => {
  test('writes the file and returns its root-relative web path', async () => {
    const { path: webPath } = await saveUploadedAsset({
      kind: 'image',
      category: 'games',
      slug: FIXTURE_SLUG,
      filename: 'My Hero IMG.PNG',
      bytes: tiny,
    });
    expect(webPath).toBe(`/assets/images/games/${FIXTURE_SLUG}/my-hero-img.png`);
    const onDisk = path.join(process.cwd(), 'public', webPath.replace(/^\//, ''));
    await expect(fs.readFile(onDisk)).resolves.toBeInstanceOf(Buffer);
  });

  test('avoids collisions by suffixing -1, -2, …', async () => {
    const first = await saveUploadedAsset({ kind: 'image', category: 'games', slug: FIXTURE_SLUG, filename: 'hero.png', bytes: tiny });
    const second = await saveUploadedAsset({ kind: 'image', category: 'games', slug: FIXTURE_SLUG, filename: 'hero.png', bytes: tiny });
    expect(first.path).toBe(`/assets/images/games/${FIXTURE_SLUG}/hero.png`);
    expect(second.path).toBe(`/assets/images/games/${FIXTURE_SLUG}/hero-1.png`);
  });

  test('keeps the written path inside the slug directory for traversal-style filenames', async () => {
    const { path: webPath } = await saveUploadedAsset({
      kind: 'image',
      category: 'games',
      slug: FIXTURE_SLUG,
      filename: '../../../../etc/passwd.png',
      bytes: tiny,
    });
    expect(webPath).toBe(`/assets/images/games/${FIXTURE_SLUG}/passwd.png`);
  });
});
