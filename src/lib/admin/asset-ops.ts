import { promises as fs } from 'fs';
import path from 'path';
import { PROJECT_CATEGORIES, type ProjectCategoryKey } from './schemas';
import { ASSET_LIMITS, type AssetKind } from './asset-fields';

/**
 * Server-side asset writer for the dev-only admin upload route.
 *
 * Writes uploaded image/video bytes into `public/assets/{images|videos}/<category>/<slug>/`
 * and returns the root-relative web path the content JSON should reference. This
 * is deliberately separate from `file-ops.writeContentFile` (which is JSON-only:
 * it runs `schema.parse` + `JSON.stringify`, and its temp-file sweep only touches
 * `src/content/**`, never `public/`).
 */

/** Lowercase slug pattern, matching file-ops' content slug rule. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Thrown for any caller-correctable problem; carries the HTTP status to return. */
export class AssetValidationError extends Error {
  constructor(message: string, readonly status: number = 400) {
    super(message);
    this.name = 'AssetValidationError';
  }
}

function isAssetKind(value: string): value is AssetKind {
  return value === 'image' || value === 'video';
}

function isProjectCategory(value: string): value is ProjectCategoryKey {
  return (PROJECT_CATEGORIES as string[]).includes(value);
}

/** Split an original filename into a slugified base and a lowercase extension. */
export function sanitizeFilename(original: string): { base: string; ext: string } {
  const ext = path.extname(original).toLowerCase().replace(/^\./, '');
  const base =
    path
      .basename(original, path.extname(original))
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'asset';
  return { base, ext };
}

function publicAssetDir(kind: AssetKind, category: ProjectCategoryKey, slug: string): string {
  const sub = kind === 'video' ? 'videos' : 'images';
  return path.join(process.cwd(), 'public', 'assets', sub, category, slug);
}

/** Pick a non-colliding filename within `dir` by appending -1, -2, … */
async function uniqueFilename(dir: string, base: string, ext: string): Promise<string> {
  let candidate = `${base}.${ext}`;
  let i = 1;
  // Bounded by the filesystem; in practice resolves in 1-2 iterations.
  for (;;) {
    try {
      await fs.access(path.join(dir, candidate));
      candidate = `${base}-${i}.${ext}`;
      i += 1;
    } catch {
      return candidate;
    }
  }
}

export interface SaveAssetInput {
  kind: string;
  category: string;
  slug: string;
  filename: string;
  bytes: Buffer | Uint8Array;
}

/**
 * Validate and atomically write an uploaded asset. Returns the root-relative
 * web path (e.g. `/assets/images/games/foo/hero.jpg`) for the content field.
 */
export async function saveUploadedAsset(input: SaveAssetInput): Promise<{ path: string }> {
  const { kind, category, slug, filename, bytes } = input;

  if (!isAssetKind(kind)) throw new AssetValidationError(`Invalid asset kind: "${kind}"`);
  if (!isProjectCategory(category)) throw new AssetValidationError(`Invalid category: "${category}"`);
  if (!SLUG_PATTERN.test(slug)) {
    throw new AssetValidationError(`Invalid slug: "${slug}". Save the entry first, then upload.`);
  }

  const { base, ext } = sanitizeFilename(filename);
  if (!ext) throw new AssetValidationError('File has no extension.');
  const limits = ASSET_LIMITS[kind];
  if (!limits.extensions.includes(ext)) {
    throw new AssetValidationError(
      `Unsupported ${kind} type ".${ext}". Allowed: ${limits.extensions.join(', ')}.`,
    );
  }
  if (bytes.byteLength > limits.maxBytes) {
    const mb = (bytes.byteLength / (1024 * 1024)).toFixed(1);
    throw new AssetValidationError(
      `File too large (${mb} MB). Max ${Math.round(limits.maxBytes / (1024 * 1024))} MB for ${kind}.`,
      413,
    );
  }

  const dir = publicAssetDir(kind, category, slug);
  // Belt-and-suspenders traversal guard: the resolved dir must stay under public/assets.
  const assetsRoot = path.join(process.cwd(), 'public', 'assets');
  if (dir !== assetsRoot && !dir.startsWith(assetsRoot + path.sep)) {
    throw new AssetValidationError('Resolved path escapes the asset root.');
  }

  await fs.mkdir(dir, { recursive: true });
  const finalName = await uniqueFilename(dir, base, ext);
  const filePath = path.join(dir, finalName);

  // Atomic write: temp in the same dir, then rename. The `.upload-tmp` suffix is
  // outside the `src/content/**/*.json.tmp` sweep, so nothing else collects it.
  const tmpPath = `${filePath}.upload-tmp`;
  await fs.writeFile(tmpPath, bytes);
  await fs.rename(tmpPath, filePath);

  const sub = kind === 'video' ? 'videos' : 'images';
  return { path: `/assets/${sub}/${category}/${slug}/${finalName}` };
}
