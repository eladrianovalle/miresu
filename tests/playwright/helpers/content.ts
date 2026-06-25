/**
 * Content-derived test helpers.
 *
 * Playwright specs run in Node, so we read the project JSON straight off disk
 * (relative to process.cwd()) instead of importing the app's RSC loaders. This
 * keeps the specs honest across content swaps in forks: tests target whatever
 * sample content actually exists rather than hardcoded slugs/counts.
 */
import * as fs from 'fs';
import * as path from 'path';

const CONTENT_ROOT = path.resolve(process.cwd(), 'src/content');
const PROJECTS_ROOT = path.join(CONTENT_ROOT, 'projects');

/** Deterministic category order, then alphabetical filenames within each. */
const CATEGORY_ORDER = ['games', 'client', 'personal'] as const;
export type Category = (typeof CATEGORY_ORDER)[number];

export interface ProjectFile {
  /** e.g. "games" */
  category: Category;
  /** filename without ".json", e.g. "atlas-os" */
  fileBase: string;
  /** content-root-relative path, e.g. "projects/games/atlas-os.json" */
  relPath: string;
  /** parsed JSON */
  data: Record<string, unknown>;
  /** slug field, falling back to fileBase */
  slug: string;
  /** draft flag (defaults false) */
  draft: boolean;
}

export interface GameProjectInfo {
  slug: string;
  relPath: string;
  storeLinkCount: number;
  hasTestimonial: boolean;
  stackCount: number;
}

function readJson(absPath: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(absPath, 'utf-8')) as Record<string, unknown>;
}

function listProjectFiles(category: Category): ProjectFile[] {
  const dir = path.join(PROJECTS_ROOT, category);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => {
      const fileBase = f.replace(/\.json$/, '');
      const absPath = path.join(dir, f);
      const data = readJson(absPath);
      const slug = typeof data.slug === 'string' && data.slug ? data.slug : fileBase;
      return {
        category,
        fileBase,
        relPath: path.posix.join('projects', category, f),
        data,
        slug,
        draft: data.draft === true,
      };
    });
}

/** All project files across every category in deterministic order. */
export function allProjectFiles(): ProjectFile[] {
  return CATEGORY_ORDER.flatMap((c) => listProjectFiles(c));
}

/**
 * First non-draft project slug across all categories
 * (order: games, client, personal; alphabetical filenames within).
 */
export function firstProjectSlug(): string {
  const first = allProjectFiles().find((p) => !p.draft);
  if (!first) {
    throw new Error('No non-draft projects found in src/content/projects');
  }
  return first.slug;
}

function gameInfo(p: ProjectFile): GameProjectInfo {
  const storeLinks = Array.isArray(p.data.storeLinks) ? p.data.storeLinks : [];
  const stack = Array.isArray(p.data.stack) ? p.data.stack : [];
  return {
    slug: p.slug,
    relPath: p.relPath,
    storeLinkCount: storeLinks.length,
    hasTestimonial:
      typeof p.data.testimonial === 'object' && p.data.testimonial !== null,
    stackCount: stack.length,
  };
}

/**
 * First non-draft games project matching `predicate`, with counts derived from
 * the JSON. Lets admin specs pick a target that actually has the widget under
 * test (a testimonial, store links, a stack, ...) and assert the real count.
 * Returns null when no non-draft games project matches.
 */
export function firstGameWith(
  predicate: (info: GameProjectInfo) => boolean,
): GameProjectInfo | null {
  for (const p of listProjectFiles('games')) {
    if (p.draft) continue;
    const info = gameInfo(p);
    if (predicate(info)) return info;
  }
  return null;
}
