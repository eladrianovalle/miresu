import { promises as fs, existsSync } from 'fs';
import path from 'path';
import { z } from 'zod';
import {
  GameProjectSchema,
  ClientProjectSchema,
  PersonalCategorySchema,
  IdentitySchema,
  ConsultingContentSchema,
  SkillsTaxonomySchema,
  ResumeProjectsSchema,
  EducationListSchema,
  ResumeHeaderSchema,
} from '@/types/project-content';

function logValid(scope: string, file: string) {
  console.log(`✔ ${scope}: ${file} valid`);
}

function logInvalid(scope: string, file: string, error: unknown) {
  console.error(`✖ ${scope}: ${file} invalid`);
  console.error(error);
  process.exitCode = 1;
}

/**
 * Asset-reference existence guard.
 *
 * Content references local assets by root-relative path (e.g.
 * `/assets/images/games/foo/hero.jpg`). The static export ships with an empty
 * basePath on the apex domain, so `move-export.ts`'s prefix rewrite never runs
 * in prod — meaning a JSON entry pointing at an uncommitted or miscased asset
 * yields a broken image that no build step catches. This walk closes that gap:
 * every `/assets/...` string must resolve to a real file under `public/`.
 *
 * Case sensitivity: `existsSync` is case-insensitive on macOS but case-sensitive
 * on the Linux CI runner, so a miscased path passes locally and fails in CI —
 * which is exactly where we want it caught before deploy.
 */
const PUBLIC_DIR = path.resolve('public');

function collectAssetRefs(value: unknown, acc: string[]): void {
  if (typeof value === 'string') {
    if (value.startsWith('/assets/')) acc.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectAssetRefs(item, acc);
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collectAssetRefs(v, acc);
  }
}

function checkAssetRefs(file: string, data: unknown): void {
  const refs: string[] = [];
  collectAssetRefs(data, refs);
  const missing = refs.filter(
    (ref) => !existsSync(path.join(PUBLIC_DIR, ref.replace(/^\//, ''))),
  );
  if (missing.length > 0) {
    logInvalid(
      'Assets',
      path.relative(process.cwd(), file),
      new Error(
        `References ${missing.length} missing asset file(s):\n` +
          missing.map((m) => `  - ${m} (expected public${m})`).join('\n'),
      ),
    );
  }
}

async function readJsonFiles(dir: string) {
  const resolvedDir = path.resolve(dir);
  const files = await fs.readdir(resolvedDir);
  return Promise.all(
    files
      .filter((file) => file.endsWith('.json'))
      .map(async (file) => {
        const filePath = path.join(resolvedDir, file);
        const raw = await fs.readFile(filePath, 'utf-8');
        return { file: filePath, data: JSON.parse(raw) as unknown };
      })
  );
}

async function validateProjectDir(contentDir: string, subdir: string, schema: z.ZodType, label: string) {
  const dir = path.join(contentDir, subdir);
  let entries;
  try {
    entries = await readJsonFiles(dir);
  } catch {
    return;
  }
  entries.forEach(({ file, data }) => {
    try {
      schema.parse(data);
      logValid(label, path.relative(process.cwd(), file));
      checkAssetRefs(file, data);
    } catch (error) {
      logInvalid(label, path.relative(process.cwd(), file), error);
    }
  });
}

async function validateSingleton(contentDir: string, filename: string, schema: z.ZodType, label: string) {
  const filePath = path.join(contentDir, filename);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(raw) as unknown;
    schema.parse(data);
    logValid(label, path.relative(process.cwd(), filePath));
    checkAssetRefs(filePath, data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    logInvalid(label, filename, error);
  }
}

async function main() {
  const contentDir = path.resolve('src/content');
  await Promise.all([
    validateProjectDir(contentDir, 'projects/games', GameProjectSchema, 'Project/Games'),
    validateProjectDir(contentDir, 'projects/client', ClientProjectSchema, 'Project/Client'),
    validateProjectDir(contentDir, 'projects/personal', PersonalCategorySchema, 'Project/Personal'),
    validateSingleton(contentDir, 'identity.json', IdentitySchema, 'Identity'),
    validateSingleton(contentDir, 'consulting.json', ConsultingContentSchema, 'Consulting'),
    validateSingleton(contentDir, 'resume/skills.json', SkillsTaxonomySchema, 'Resume/Skills'),
    validateSingleton(contentDir, 'resume/projects.json', ResumeProjectsSchema, 'Resume/Projects'),
    validateSingleton(contentDir, 'resume/education.json', EducationListSchema, 'Resume/Education'),
    validateSingleton(contentDir, 'resume/header.json', ResumeHeaderSchema, 'Resume/Header'),
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
