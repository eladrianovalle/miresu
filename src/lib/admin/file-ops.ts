import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import {
  CONTENT_TYPES,
  PROJECT_CATEGORIES,
  type ContentTypeKey,
  type ProjectCategoryKey,
  type SingletonKey,
} from './schemas';

// --- Path resolution ---

function contentRoot(): string {
  return process.cwd();
}

export function resolveProjectDir(category: ProjectCategoryKey): string {
  const entry = CONTENT_TYPES[`projects/${category}`];
  if (entry.kind !== 'project') throw new Error(`Not a project type: ${category}`);
  return path.join(contentRoot(), entry.dir);
}

export function resolveProjectFile(category: ProjectCategoryKey, slug: string): string {
  return path.join(resolveProjectDir(category), `${slug}.json`);
}

export function resolveSingletonFile(key: SingletonKey): string {
  const entry = CONTENT_TYPES[key];
  if (entry.kind !== 'singleton') throw new Error(`Not a singleton type: ${key}`);
  return path.join(contentRoot(), entry.filePath);
}

// --- Read operations (uncached, unfiltered) ---

export async function readJsonFile<T>(filePath: string, schema: z.ZodType<T>): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf-8');
  return schema.parse(JSON.parse(raw));
}

export async function readProject(category: ProjectCategoryKey, slug: string) {
  const typeKey: ContentTypeKey = `projects/${category}`;
  const entry = CONTENT_TYPES[typeKey];
  const filePath = resolveProjectFile(category, slug);
  const data = await readJsonFile(filePath, entry.schema);
  return { data, filePath, category };
}

export async function readSingleton(key: SingletonKey) {
  const entry = CONTENT_TYPES[key];
  const filePath = resolveSingletonFile(key);
  const data = await readJsonFile(filePath, entry.schema);
  return { data, filePath };
}

export async function listProjectSlugs(category: ProjectCategoryKey): Promise<string[]> {
  const dir = resolveProjectDir(category);
  try {
    const files = await fs.readdir(dir);
    return files
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''));
  } catch {
    return [];
  }
}

// --- Write operations (atomic) ---

/** Module-level flag: cleanupTempFiles runs at most once per server lifecycle */
let tempFilesCleaned = false;

export async function writeContentFile(
  filePath: string,
  data: unknown,
  schema: z.ZodType,
): Promise<{ validated: unknown }> {
  // Clean up stale .tmp files once per server lifecycle (moved from layout hot path)
  if (!tempFilesCleaned) {
    tempFilesCleaned = true;
    await cleanupTempFiles();
  }

  // NOTE (C2-4): schema.parse() strips properties not defined in the Zod schema.
  // This is intentional for validation but means unknown/legacy fields in the JSON
  // file will be silently removed on save. See advocate_3.md Section 2.4 for
  // deferred fix options.
  const validated = schema.parse(data);

  // Serialize with consistent formatting (2-space indent, trailing newline)
  const json = JSON.stringify(validated, null, 2) + '\n';

  // Write to temp file in same directory (same filesystem = atomic rename)
  const tmpPath = filePath + '.tmp';
  await fs.writeFile(tmpPath, json, 'utf-8');

  // Atomic rename (POSIX guarantee on same filesystem)
  await fs.rename(tmpPath, filePath);

  return { validated };
}

export async function updateProject(
  category: ProjectCategoryKey,
  slug: string,
  data: unknown,
): Promise<{ validated: unknown }> {
  const typeKey: ContentTypeKey = `projects/${category}`;
  const entry = CONTENT_TYPES[typeKey];
  const filePath = resolveProjectFile(category, slug);

  return writeContentFile(filePath, data, entry.schema);
}

export async function updateSingleton(
  key: SingletonKey,
  data: unknown,
): Promise<{ validated: unknown }> {
  const entry = CONTENT_TYPES[key];
  const filePath = resolveSingletonFile(key);

  return writeContentFile(filePath, data, entry.schema);
}

// --- Cross-category slug uniqueness ---

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function checkSlugAvailability(
  slug: string,
  excludeCategory?: ProjectCategoryKey,
): Promise<{ available: boolean; conflictCategory?: ProjectCategoryKey }> {
  if (!SLUG_PATTERN.test(slug)) {
    return { available: false };
  }

  for (const cat of PROJECT_CATEGORIES) {
    if (cat === excludeCategory) continue;
    const filePath = resolveProjectFile(cat, slug);
    try {
      await fs.access(filePath);
      return { available: false, conflictCategory: cat };
    } catch {
      // File doesn't exist — slug is free in this category
    }
  }

  return { available: true };
}

export async function createProject(
  category: ProjectCategoryKey,
  data: unknown,
): Promise<{ validated: unknown; filePath: string }> {
  const typeKey: ContentTypeKey = `projects/${category}`;
  const entry = CONTENT_TYPES[typeKey];

  // Validate first to extract slug
  const validated = entry.schema.parse(data) as { slug: string };
  const slug = validated.slug;

  // Validate slug format
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(
      `Invalid slug "${slug}". Must be lowercase alphanumeric with hyphens (e.g., "my-project").`,
    );
  }

  // Check ALL categories for slug collision (C1-3)
  const { available, conflictCategory } = await checkSlugAvailability(slug);
  if (!available) {
    const msg = conflictCategory
      ? `Slug "${slug}" already exists in category "${conflictCategory}"`
      : `Invalid slug "${slug}"`;
    throw new SlugConflictError(msg, slug, conflictCategory);
  }

  const filePath = resolveProjectFile(category, slug);
  await writeContentFile(filePath, validated, entry.schema);

  return { validated, filePath };
}

// --- Custom error types ---

export class SlugConflictError extends Error {
  constructor(
    message: string,
    public readonly slug: string,
    public readonly conflictCategory?: ProjectCategoryKey,
  ) {
    super(message);
    this.name = 'SlugConflictError';
  }
}

// --- Temp file cleanup (C1-7) ---

export async function cleanupTempFiles(): Promise<number> {
  const contentDir = path.join(contentRoot(), 'src/content');
  let cleaned = 0;

  async function cleanDir(dir: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await cleanDir(fullPath);
        } else if (entry.name.endsWith('.json.tmp')) {
          await fs.unlink(fullPath);
          cleaned++;
        }
      }
    } catch {
      // Directory doesn't exist, skip
    }
  }

  await cleanDir(contentDir);
  return cleaned;
}
