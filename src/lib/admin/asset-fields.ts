/**
 * Asset-field detection + limits — shared by the client `UploadField` widget and
 * the server `asset-ops` writer. No Node/`fs` imports here so it is safe to pull
 * into the client bundle.
 *
 * Detection is a key-name registry, deliberately NOT a JSON-Schema annotation:
 * the admin's annotations channel is top-level-only and cannot reach nested
 * `video.src` / `video.poster`, so a path-based registry is the robust choice.
 * It is fully generic (no per-fork field names) so it upstreams to miresu cleanly.
 */

export type AssetKind = 'image' | 'video';

/** Leaf field names that hold an image path. */
const IMAGE_KEYS = new Set(['image', 'thumbnail', 'poster', 'gallery']);

/** Per-kind upload constraints. Video cap sits well under GitHub's 100 MB
 * push-reject ceiling (no Git LFS here, so binaries live in history forever). */
export const ASSET_LIMITS: Record<AssetKind, { maxBytes: number; extensions: string[] }> = {
  image: { maxBytes: 25 * 1024 * 1024, extensions: ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'svg'] },
  video: { maxBytes: 40 * 1024 * 1024, extensions: ['mp4', 'webm'] },
};

/**
 * Detect whether a form-field path holds an asset, and which kind.
 *
 * Handles array-item paths (a trailing numeric index like `gallery.0` is
 * stripped to `gallery`) and nested object paths (`video.src` → video,
 * `video.poster` → image). Returns null for non-asset fields.
 */
export function assetKindForPath(path: string): AssetKind | null {
  const segs = path.split('.');
  // Drop a trailing array index so gallery.0 detects like gallery.
  if (segs.length > 1 && /^\d+$/.test(segs[segs.length - 1])) segs.pop();
  const leaf = segs[segs.length - 1];
  const parent = segs.length > 1 ? segs[segs.length - 2] : undefined;

  if (leaf === 'src' && parent === 'video') return 'video';
  if (IMAGE_KEYS.has(leaf)) return 'image';
  return null;
}

/** Human-readable size cap, e.g. "25 MB". */
export function formatCap(kind: AssetKind): string {
  return `${Math.round(ASSET_LIMITS[kind].maxBytes / (1024 * 1024))} MB`;
}
