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
 *
 * Create-time uploads stage to `public/assets/_staging/<draftId>/…` (keyed by a
 * client draft id, since the create-form slug mutates per keystroke), then
 * `relocateStagedAssets` moves them into the real `<slug>` dir and rewrites the
 * JSON paths on a successful create.
 */

/** Lowercase slug pattern, matching file-ops' content slug rule. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Client-generated draft id (e.g. crypto.randomUUID()) — bounded, url-safe. */
const DRAFT_ID_PATTERN = /^[a-z0-9-]{8,64}$/;
/** A root-relative staged-asset reference: /assets/_staging/<draftId>/<sub>/<file>. */
const STAGING_REF = /^\/assets\/_staging\/([a-z0-9-]{8,64})\/(images|videos)\/([^/]+)$/;

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

function subFor(kind: AssetKind): 'images' | 'videos' {
  return kind === 'video' ? 'videos' : 'images';
}

function assetsRoot(): string {
  return path.join(process.cwd(), 'public', 'assets');
}

function stagingRoot(): string {
  return path.join(assetsRoot(), '_staging');
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

/** Shared validation: kind, extension allowlist, size cap. Returns sub/base/ext. */
function validateAssetMeta(
  kind: string,
  filename: string,
  byteLength: number,
): { kind: AssetKind; sub: 'images' | 'videos'; base: string; ext: string } {
  if (!isAssetKind(kind)) throw new AssetValidationError(`Invalid asset kind: "${kind}"`);
  const { base, ext } = sanitizeFilename(filename);
  if (!ext) throw new AssetValidationError('File has no extension.');
  const limits = ASSET_LIMITS[kind];
  if (!limits.extensions.includes(ext)) {
    throw new AssetValidationError(
      `Unsupported ${kind} type ".${ext}". Allowed: ${limits.extensions.join(', ')}.`,
    );
  }
  if (byteLength > limits.maxBytes) {
    const mb = (byteLength / (1024 * 1024)).toFixed(1);
    throw new AssetValidationError(
      `File too large (${mb} MB). Max ${Math.round(limits.maxBytes / (1024 * 1024))} MB for ${kind}.`,
      413,
    );
  }
  return { kind, sub: subFor(kind), base, ext };
}

/**
 * Atomically write bytes into `dir` with a collision-safe name; returns the
 * final filename. Belt-and-suspenders traversal guard: `dir` must stay under
 * `public/assets`.
 */
async function writeBytesUnique(
  dir: string,
  base: string,
  ext: string,
  bytes: Buffer | Uint8Array,
): Promise<string> {
  const root = assetsRoot();
  if (dir !== root && !dir.startsWith(root + path.sep)) {
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
  return finalName;
}

export interface SaveAssetInput {
  kind: string;
  category: string;
  slug: string;
  filename: string;
  bytes: Buffer | Uint8Array;
}

/**
 * Validate and atomically write an uploaded asset directly into its final
 * `<category>/<slug>/` dir (edit-form path). Returns the root-relative web path.
 */
export async function saveUploadedAsset(input: SaveAssetInput): Promise<{ path: string }> {
  const { kind, category, slug, filename, bytes } = input;

  if (!isProjectCategory(category)) throw new AssetValidationError(`Invalid category: "${category}"`);
  if (!SLUG_PATTERN.test(slug)) {
    throw new AssetValidationError(`Invalid slug: "${slug}". Save the entry first, then upload.`);
  }

  const { sub, base, ext } = validateAssetMeta(kind, filename, bytes.byteLength);
  const dir = path.join(assetsRoot(), sub, category, slug);
  const finalName = await writeBytesUnique(dir, base, ext, bytes);
  return { path: `/assets/${sub}/${category}/${slug}/${finalName}` };
}

export interface SaveStagedInput {
  kind: string;
  draftId: string;
  filename: string;
  bytes: Buffer | Uint8Array;
}

/** Module-level flag: the staging sweep runs at most once per server lifecycle. */
let stagingCleaned = false;

/**
 * Validate and atomically write an uploaded asset into the staging area for a
 * not-yet-saved entry (create form). `relocateStagedAssets` moves it into the
 * real `<slug>` dir on a successful create.
 */
export async function saveStagedAsset(input: SaveStagedInput): Promise<{ path: string }> {
  const { kind, draftId, filename, bytes } = input;

  if (!DRAFT_ID_PATTERN.test(draftId)) {
    throw new AssetValidationError('Invalid draft id.');
  }
  if (!stagingCleaned) {
    stagingCleaned = true;
    await cleanupStagingAssets().catch(() => {});
  }

  const { sub, base, ext } = validateAssetMeta(kind, filename, bytes.byteLength);
  const dir = path.join(stagingRoot(), draftId, sub);
  const finalName = await writeBytesUnique(dir, base, ext, bytes);
  return { path: `/assets/_staging/${draftId}/${sub}/${finalName}` };
}

/**
 * Move any staged assets referenced by `data` into the entry's real
 * `<category>/<slug>/` dir and return a copy of `data` with those paths
 * rewritten. Called from `createProject` AFTER validation + the slug-collision
 * check but BEFORE the JSON is written, so a doomed create never strands files
 * and committed content never references `_staging`.
 */
export async function relocateStagedAssets<T>(input: {
  category: ProjectCategoryKey;
  slug: string;
  data: T;
}): Promise<T> {
  const { category, slug, data } = input;

  const refs = new Set<string>();
  const collect = (v: unknown): void => {
    if (typeof v === 'string') {
      if (STAGING_REF.test(v)) refs.add(v);
    } else if (Array.isArray(v)) {
      v.forEach(collect);
    } else if (v && typeof v === 'object') {
      Object.values(v).forEach(collect);
    }
  };
  collect(data);
  if (refs.size === 0) return data;

  const rewrite = new Map<string, string>();
  const root = assetsRoot();
  const staging = stagingRoot();

  for (const ref of refs) {
    const m = STAGING_REF.exec(ref);
    if (!m) continue;
    const [, , sub, filename] = m;
    const srcPath = path.join(process.cwd(), 'public', ref.replace(/^\//, ''));
    if (!srcPath.startsWith(staging + path.sep)) {
      throw new AssetValidationError('Staged source escapes the staging root.');
    }
    const destDir = path.join(root, sub, category, slug);
    if (!destDir.startsWith(root + path.sep)) {
      throw new AssetValidationError('Destination escapes the asset root.');
    }
    const ext = path.extname(filename).toLowerCase().replace(/^\./, '');
    const base = path.basename(filename, path.extname(filename));
    await fs.mkdir(destDir, { recursive: true });
    const finalName = await uniqueFilename(destDir, base, ext);
    try {
      await fs.rename(srcPath, path.join(destDir, finalName));
    } catch {
      throw new AssetValidationError(`Staged asset not found: ${ref}`);
    }
    rewrite.set(ref, `/assets/${sub}/${category}/${slug}/${finalName}`);
  }

  const replace = (v: unknown): unknown => {
    if (typeof v === 'string') return rewrite.get(v) ?? v;
    if (Array.isArray(v)) return v.map(replace);
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v)) out[k] = replace(val);
      return out;
    }
    return v;
  };
  return replace(data) as T;
}

/** Newest mtime (ms) found anywhere under `dir`, or 0 if unreadable. */
async function newestMtime(dir: string): Promise<number> {
  let newest = 0;
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop() as string;
    const dirStat = await fs.stat(d).catch(() => null);
    if (dirStat && dirStat.mtimeMs > newest) newest = dirStat.mtimeMs;
    const entries = await fs.readdir(d, { withFileTypes: true }).catch(() => []);
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) {
        stack.push(full);
      } else {
        const st = await fs.stat(full).catch(() => null);
        if (st && st.mtimeMs > newest) newest = st.mtimeMs;
      }
    }
  }
  return newest;
}

/**
 * Remove abandoned staging draft dirs older than `ttlMs` (default 24h). Operates
 * strictly under `public/assets/_staging/` and only on its immediate `<draftId>`
 * subdirs — it never descends into real `images/`/`videos/` category trees, so
 * it cannot touch committed assets. Returns the number of draft dirs removed.
 */
export async function cleanupStagingAssets(ttlMs = 24 * 60 * 60 * 1000): Promise<number> {
  const root = stagingRoot();
  // Safety: only ever operate on a path ending in assets/_staging.
  if (!root.endsWith(path.join('assets', '_staging'))) return 0;

  const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => null);
  if (!entries) return 0;

  const now = Date.now();
  let removed = 0;
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (!DRAFT_ID_PATTERN.test(e.name)) continue;
    const dir = path.join(root, e.name);
    if (now - (await newestMtime(dir)) > ttlMs) {
      await fs.rm(dir, { recursive: true, force: true });
      removed += 1;
    }
  }
  return removed;
}
