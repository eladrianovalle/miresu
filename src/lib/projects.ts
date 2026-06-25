import { promises as fs } from 'fs';
import path from 'path';
import { cache as reactCache } from 'react';
import type { z } from 'zod';
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
  type GameProject,
  type ClientProject,
  type PersonalCategoryProject,
  type Identity,
} from '@/types/project-content';

// React's `cache()` is only callable during a Server Component render. In a plain
// Node context (e.g. the `scripts/build-resume-pdf.tsx` build step) the import is
// not a function, so fall back to an identity wrapper — memoization is a render-time
// optimization only and its absence does not change loader output.
const cache: typeof reactCache =
  typeof reactCache === 'function'
    ? reactCache
    : (((fn: unknown) => fn) as typeof reactCache);

const CONTENT_DIR = path.join(process.cwd(), 'src/content');
const PROJECTS_DIR = path.join(CONTENT_DIR, 'projects');

// --- Discriminated union type ---

export type Project =
  | (GameProject & { category: 'games' })
  | (ClientProject & { category: 'client' })
  | (PersonalCategoryProject & { category: 'personal' });

export type ProjectCategory = 'games' | 'client' | 'personal';

const CATEGORIES: ProjectCategory[] = ['games', 'client', 'personal'];

const schemaForCategory = {
  games: GameProjectSchema,
  client: ClientProjectSchema,
  personal: PersonalCategorySchema,
} as const;

// --- Loaders ---

async function loadCategoryProjects<T extends ProjectCategory>(
  category: T,
): Promise<Project[]> {
  const dir = path.join(PROJECTS_DIR, category);
  const schema = schemaForCategory[category];

  try {
    const files = await fs.readdir(dir);
    const projects = await Promise.all(
      files
        .filter((f) => f.endsWith('.json'))
        .map(async (file) => {
          const raw = await fs.readFile(path.join(dir, file), 'utf-8');
          const parsed = schema.parse(JSON.parse(raw));
          return { ...parsed, category } as Project;
        }),
    );
    return projects;
  } catch (error) {
    // Handle missing directory or read errors gracefully
    if (
      error instanceof Error &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return [];
    }
    console.error(`Error loading ${category} projects:`, error);
    return [];
  }
}

export async function getProjects(
  category?: ProjectCategory,
): Promise<Project[]> {
  const isDev = process.env.NODE_ENV !== 'production';
  const categoriesToLoad = category ? [category] : CATEGORIES;

  const allProjects = (
    await Promise.all(categoriesToLoad.map(loadCategoryProjects))
  ).flat();

  // Filter out drafts in production
  const filtered = isDev
    ? allProjects
    : allProjects.filter((p) => !p.draft);

  // Sort by year descending
  return filtered.sort((a, b) => b.year - a.year);
}

// Projects shown on the public site (portfolio directory, standalone pages,
// sitemap). Honors `surfaces.site` — entries kept off the site (e.g. a job with
// no showcase) are excluded here but remain available to the resume via the raw
// getProjects(). The resume must NOT use this accessor: it needs site:false
// entries for the experience projection.
export async function getSiteProjects(
  category?: ProjectCategory,
): Promise<Project[]> {
  return (await getProjects(category)).filter((p) => p.surfaces.site);
}

export const getProjectBySlug = cache(async function getProjectBySlug(
  slug: string,
): Promise<Project | null> {
  for (const category of CATEGORIES) {
    const filePath = path.join(PROJECTS_DIR, category, `${slug}.json`);
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const schema = schemaForCategory[category];
      const parsed = schema.parse(JSON.parse(raw));
      return { ...parsed, category } as Project;
    } catch {
      // File doesn't exist in this category — try next
      continue;
    }
  }
  return null;
});

export function getProjectCategories(): ProjectCategory[] {
  return [...CATEGORIES];
}

export const getIdentity = cache(async function getIdentity(): Promise<Identity> {
  const filePath = path.join(CONTENT_DIR, 'identity.json');
  const raw = await fs.readFile(filePath, 'utf-8');
  return IdentitySchema.parse(JSON.parse(raw));
});

// Read one JSON file (relative to CONTENT_DIR) through a schema, returning null
// if it's missing or invalid. Shared by every optional singleton loader.
function loadSingleton<T>(relPath: string, schema: z.ZodType<T>) {
  return cache(async function load(): Promise<T | null> {
    try {
      const raw = await fs.readFile(path.join(CONTENT_DIR, relPath), 'utf-8');
      return schema.parse(JSON.parse(raw));
    } catch {
      return null;
    }
  });
}

export const getConsulting = loadSingleton('consulting.json', ConsultingContentSchema);

// --- Resume singletons (graceful if missing) ---

export const getSkillsTaxonomy = loadSingleton('resume/skills.json', SkillsTaxonomySchema);
export const getResumeProjects = loadSingleton('resume/projects.json', ResumeProjectsSchema);
export const getEducation = loadSingleton('resume/education.json', EducationListSchema);
export const getResumeHeader = loadSingleton('resume/header.json', ResumeHeaderSchema);
