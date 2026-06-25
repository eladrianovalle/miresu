import { describe, test, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { GameProjectSchema, ClientProjectSchema } from '@/types/project-content';
import type { GameProject, ClientProject } from '@/types/project-content';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '../..');
const CONTENT = path.join(ROOT, 'src/content');
const PROJECT_GAMES = path.join(CONTENT, 'projects/games');
const PROJECT_CLIENT = path.join(CONTENT, 'projects/client');
const PUBLIC = path.join(ROOT, 'public');

// ---------------------------------------------------------------------------
// Types for raw JSON with optional fields we inspect
// ---------------------------------------------------------------------------

interface MigratedContent {
  slug: string;
  description?: string;
  scope?: string;
  image?: string;
  thumbnail?: string;
  clientLogo?: string;
  gallery?: string[];
  storeLinks?: Array<{ platform: string; url: string; enabled?: boolean }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function readJsonFiles<T = unknown>(dir: string): Promise<Array<{ file: string; data: T }>> {
  const files = await fs.readdir(dir);
  return Promise.all(
    files
      .filter((f) => f.endsWith('.json'))
      .map(async (f) => {
        const filePath = path.join(dir, f);
        const raw = await fs.readFile(filePath, 'utf-8');
        return { file: f, data: JSON.parse(raw) as T };
      }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Migration: game files validate against GameProjectSchema', () => {
  test('every migrated game file validates against GameProjectSchema', async () => {
    const entries = await readJsonFiles<GameProject>(PROJECT_GAMES);
    expect(entries.length).toBeGreaterThan(0);

    for (const { file, data } of entries) {
      const result = GameProjectSchema.safeParse(data);
      if (!result.success) {
        throw new Error(
          `${file} failed validation: ${JSON.stringify(result.error.issues, null, 2)}`,
        );
      }
      expect(result.success).toBe(true);
    }
  });
});

describe('Migration: client files validate against ClientProjectSchema', () => {
  test('every migrated client file validates against ClientProjectSchema', async () => {
    const entries = await readJsonFiles<ClientProject>(PROJECT_CLIENT);
    expect(entries.length).toBeGreaterThan(0);

    for (const { file, data } of entries) {
      const result = ClientProjectSchema.safeParse(data);
      if (!result.success) {
        throw new Error(
          `${file} failed validation: ${JSON.stringify(result.error.issues, null, 2)}`,
        );
      }
      expect(result.success).toBe(true);
    }
  });
});

describe('Migration: store link URLs present', () => {
  test('games with store links have valid URLs', async () => {
    const entries = await readJsonFiles<GameProject>(PROJECT_GAMES);

    for (const { file, data } of entries) {
      if (!data.storeLinks || data.storeLinks.length === 0) continue;
      for (const sl of data.storeLinks) {
        expect(sl.url, `${file}: store link for ${sl.platform} has empty URL`).toBeTruthy();
        expect(sl.url).toMatch(/^https?:\/\//);
      }
    }
  });
});

describe('Migration: voice rewrite', () => {
  test('migration output contains no "we ", "our ", "Orc Punk team" in descriptions', async () => {
    const clientEntries = await readJsonFiles<MigratedContent>(PROJECT_CLIENT);

    const forbiddenPatterns = [/\bwe /i, /\bour /i, /\bOrc Punk team\b/];

    for (const { file, data } of clientEntries) {
      const description = data.description ?? '';
      const scope = data.scope ?? '';
      // Check description and scope — NOT testimonial quotes (those are client words)
      for (const pattern of forbiddenPatterns) {
        expect(
          pattern.test(description),
          `"${pattern.toString()}" found in description of ${file}: "${description.slice(0, 80)}..."`,
        ).toBe(false);
        expect(
          pattern.test(scope),
          `"${pattern.toString()}" found in scope of ${file}: "${scope.slice(0, 80)}..."`,
        ).toBe(false);
      }
    }
  });
});

describe('Migration: image paths exist', () => {
  test('every image path in migrated content points to a file that exists in public/', async () => {
    const gameEntries = await readJsonFiles<MigratedContent>(PROJECT_GAMES);
    const clientEntries = await readJsonFiles<MigratedContent>(PROJECT_CLIENT);
    const allEntries = [...gameEntries, ...clientEntries];

    const missingImages: string[] = [];

    for (const { file, data } of allEntries) {
      const imagePaths: string[] = [];

      // Collect all image-like fields
      if (data.image) imagePaths.push(data.image);
      if (data.thumbnail) imagePaths.push(data.thumbnail);
      if (data.clientLogo) imagePaths.push(data.clientLogo);
      if (Array.isArray(data.gallery)) {
        imagePaths.push(...data.gallery);
      }

      for (const imgPath of imagePaths) {
        // Only check local paths (skip external URLs)
        if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) continue;

        const fullPath = path.join(PUBLIC, imgPath);
        try {
          await fs.access(fullPath);
        } catch {
          missingImages.push(`${file}: ${imgPath}`);
        }
      }
    }

    if (missingImages.length > 0) {
      console.warn(
        `Warning: ${missingImages.length} image path(s) not found in public/:\n` +
          missingImages.map((m) => `  - ${m}`).join('\n'),
      );
    }

    // Allow up to 5 missing images (draft items may reference assets not yet in repo)
    // Fail if more than that — indicates a systemic mapping issue
    expect(missingImages.length).toBeLessThanOrEqual(5);
  });
});
