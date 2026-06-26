import { describe, test, expect, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import {
  saveUploadedAsset,
  saveStagedAsset,
  relocateStagedAssets,
  cleanupStagingAssets,
  sanitizeFilename,
  AssetValidationError,
} from './asset-ops';
import { ASSET_LIMITS } from './asset-fields';

// All happy-path writes land under this namespaced slug so teardown is total.
const FIXTURE_SLUG = 'vitest-asset-fixture';
const FIXTURE_DRAFT = 'vitest-draft-0001';
const PUBLIC = path.join(process.cwd(), 'public');
const FIXTURE_DIR = path.join(PUBLIC, 'assets', 'images', 'games', FIXTURE_SLUG);

afterEach(async () => {
  await fs.rm(FIXTURE_DIR, { recursive: true, force: true });
  await fs.rm(path.join(PUBLIC, 'assets', 'videos', 'games', FIXTURE_SLUG), {
    recursive: true,
    force: true,
  });
  await fs.rm(path.join(PUBLIC, 'assets', '_staging', FIXTURE_DRAFT), {
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

describe('saveStagedAsset', () => {
  test('writes into the staging draft dir and returns a _staging web path', async () => {
    const { path: webPath } = await saveStagedAsset({
      kind: 'image',
      draftId: FIXTURE_DRAFT,
      filename: 'Hero Shot.PNG',
      bytes: tiny,
    });
    expect(webPath).toBe(`/assets/_staging/${FIXTURE_DRAFT}/images/hero-shot.png`);
    await expect(fs.readFile(path.join(PUBLIC, webPath.replace(/^\//, '')))).resolves.toBeInstanceOf(Buffer);
  });

  test('rejects a malformed draft id', async () => {
    await expect(
      saveStagedAsset({ kind: 'image', draftId: '../escape', filename: 'a.png', bytes: tiny }),
    ).rejects.toThrow(/Invalid draft id/);
  });

  test('reuses the shared validation (bad extension is rejected)', async () => {
    await expect(
      saveStagedAsset({ kind: 'image', draftId: FIXTURE_DRAFT, filename: 'x.svgz', bytes: tiny }),
    ).rejects.toThrow(/Unsupported image type/);
  });
});

describe('relocateStagedAssets', () => {
  test('moves staged files into <category>/<slug>/ and rewrites nested + array refs', async () => {
    const hero = (await saveStagedAsset({ kind: 'image', draftId: FIXTURE_DRAFT, filename: 'hero.png', bytes: tiny })).path;
    const shot = (await saveStagedAsset({ kind: 'image', draftId: FIXTURE_DRAFT, filename: 'shot.png', bytes: tiny })).path;
    const poster = (await saveStagedAsset({ kind: 'image', draftId: FIXTURE_DRAFT, filename: 'poster.png', bytes: tiny })).path;
    const clip = (await saveStagedAsset({ kind: 'video', draftId: FIXTURE_DRAFT, filename: 'clip.mp4', bytes: tiny })).path;

    const data = {
      slug: FIXTURE_SLUG,
      image: hero,
      gallery: [shot],
      video: { src: clip, poster },
      external: 'https://example.com/keep.png',
    };

    const out = await relocateStagedAssets({ category: 'games', slug: FIXTURE_SLUG, data });

    expect(out.image).toBe(`/assets/images/games/${FIXTURE_SLUG}/hero.png`);
    expect(out.gallery[0]).toBe(`/assets/images/games/${FIXTURE_SLUG}/shot.png`);
    expect(out.video.poster).toBe(`/assets/images/games/${FIXTURE_SLUG}/poster.png`);
    expect(out.video.src).toBe(`/assets/videos/games/${FIXTURE_SLUG}/clip.mp4`);
    // Non-staging refs are untouched.
    expect(out.external).toBe('https://example.com/keep.png');
    // No _staging ref survives.
    expect(JSON.stringify(out)).not.toContain('_staging');
    // Files exist at their new home and the staging dir is drained.
    await expect(fs.readFile(path.join(PUBLIC, out.image.replace(/^\//, '')))).resolves.toBeInstanceOf(Buffer);
    await expect(
      fs.readdir(path.join(PUBLIC, 'assets', '_staging', FIXTURE_DRAFT, 'images')),
    ).resolves.toHaveLength(0);
  });

  test('returns data untouched when there are no staged refs', async () => {
    const data = { image: '/assets/images/games/x/hero.png', title: 'X' };
    const out = await relocateStagedAssets({ category: 'games', slug: FIXTURE_SLUG, data });
    expect(out).toEqual(data);
  });

  test('throws when a referenced staged file is missing', async () => {
    const data = { image: `/assets/_staging/${FIXTURE_DRAFT}/images/ghost.png` };
    await expect(
      relocateStagedAssets({ category: 'games', slug: FIXTURE_SLUG, data }),
    ).rejects.toThrow(/Staged asset not found/);
  });
});

describe('cleanupStagingAssets', () => {
  test('removes draft dirs older than the TTL and keeps fresh ones', async () => {
    await saveStagedAsset({ kind: 'image', draftId: FIXTURE_DRAFT, filename: 'fresh.png', bytes: tiny });
    // Negative ttl → any dir (now - mtime >= 0 > -1) counts as expired.
    const removed = await cleanupStagingAssets(-1);
    expect(removed).toBeGreaterThanOrEqual(1);
    await expect(
      fs.access(path.join(PUBLIC, 'assets', '_staging', FIXTURE_DRAFT)),
    ).rejects.toThrow();

    // A fresh draft survives a long TTL.
    await saveStagedAsset({ kind: 'image', draftId: FIXTURE_DRAFT, filename: 'keep.png', bytes: tiny });
    const removed2 = await cleanupStagingAssets(60 * 60 * 1000);
    expect(removed2).toBe(0);
    await expect(
      fs.access(path.join(PUBLIC, 'assets', '_staging', FIXTURE_DRAFT)),
    ).resolves.toBeUndefined();
  });
});
