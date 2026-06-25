import { describe, test, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '../..');
const APP_DIR = path.join(ROOT, 'src/app');
const ADMIN_API_DIR = path.join(APP_DIR, 'api/admin');
const ADMIN_PAGES_DIR = path.join(APP_DIR, '(admin)/admin');
const CONTENT_DIR = path.join(ROOT, 'src/content/projects');
const STANDALONE_PROJECT_PAGE = path.join(APP_DIR, 'projects/[slug]/page.tsx');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function findFiles(dir: string, pattern: RegExp): Promise<string[]> {
  const results: string[] = [];

  async function walk(d: string) {
    let entries: string[];
    try {
      entries = await fs.readdir(d);
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(d, entry);
      const stat = await fs.stat(full);
      if (stat.isDirectory()) {
        await walk(full);
      } else if (pattern.test(entry)) {
        results.push(full);
      }
    }
  }

  await walk(dir);
  return results;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('pageExtensions: dev-only file conventions', () => {
  test('all admin API routes use .dev.ts extension', async () => {
    const standardRoutes = await findFiles(ADMIN_API_DIR, /^route\.ts$/);
    const devRoutes = await findFiles(ADMIN_API_DIR, /^route\.dev\.ts$/);

    expect(standardRoutes).toHaveLength(0);
    expect(devRoutes.length).toBeGreaterThan(0);
  });

  test('all admin pages use .dev.tsx extension', async () => {
    const standardPages = await findFiles(ADMIN_PAGES_DIR, /^(page|layout)\.tsx$/);
    const devPages = await findFiles(ADMIN_PAGES_DIR, /^(page|layout)\.dev\.tsx$/);

    expect(standardPages).toHaveLength(0);
    expect(devPages.length).toBeGreaterThan(0);
  });

  test('no .dev.ts files exist outside admin directories', async () => {
    const allDevFiles = await findFiles(APP_DIR, /\.dev\.(ts|tsx)$/);
    const nonAdminDevFiles = allDevFiles.filter(
      (f) => !f.includes('/api/admin/') && !f.includes('(admin)/admin/'),
    );

    expect(nonAdminDevFiles).toHaveLength(0);
  });
});

describe('next.config.js: pageExtensions', () => {
  test('static export config excludes dev extensions', async () => {
    const configPath = path.join(ROOT, 'next.config.js');
    const config = await fs.readFile(configPath, 'utf-8');

    // Static export branch should NOT include .dev.ts
    expect(config).toMatch(/isStaticExport.*\{[\s\S]*?pageExtensions.*\[.*'tsx'.*'ts'.*'jsx'.*'js'.*\]/);
    // Dev branch should include .dev.ts and .dev.tsx
    expect(config).toContain("'dev.ts'");
    expect(config).toContain("'dev.tsx'");
  });
});

describe('metadata routes: static export compatibility', () => {
  test('robots.ts exports dynamic = force-static', async () => {
    const content = await fs.readFile(path.join(APP_DIR, 'robots.ts'), 'utf-8');
    expect(content).toContain("export const dynamic = 'force-static'");
  });

  test('sitemap.ts exports dynamic = force-static', async () => {
    const content = await fs.readFile(path.join(APP_DIR, 'sitemap.ts'), 'utf-8');
    expect(content).toContain("export const dynamic = 'force-static'");
  });
});

describe('redirect routes: generateStaticParams', () => {
  test('/games/[slug] has generateStaticParams', async () => {
    const content = await fs.readFile(
      path.join(APP_DIR, 'games/[slug]/page.tsx'),
      'utf-8',
    );
    expect(content).toContain('generateStaticParams');
    expect(content).toContain("getSiteProjects('games')");
  });

  test('/work/[slug] has generateStaticParams', async () => {
    const content = await fs.readFile(
      path.join(APP_DIR, 'work/[slug]/page.tsx'),
      'utf-8',
    );
    expect(content).toContain('generateStaticParams');
    expect(content).toContain("getSiteProjects('client')");
  });

  test('/projects/[...slug] has generateStaticParams', async () => {
    const content = await fs.readFile(
      path.join(APP_DIR, '(command-center)/@detail/projects/[...slug]/page.tsx'),
      'utf-8',
    );
    expect(content).toContain('generateStaticParams');
  });
});

// ---------------------------------------------------------------------------
// Standalone project routes (static export generates /projects/[slug]/index.html)
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

describe('standalone project routes', () => {
  test('/projects/[slug]/page.tsx exists', async () => {
    const stat = await fs.stat(STANDALONE_PROJECT_PAGE);
    expect(stat.isFile()).toBe(true);
  });

  test('/projects/[slug]/page.tsx has generateStaticParams', async () => {
    const content = await fs.readFile(STANDALONE_PROJECT_PAGE, 'utf-8');
    expect(content).toContain('generateStaticParams');
  });

  test('/projects/[slug]/page.tsx has generateMetadata', async () => {
    const content = await fs.readFile(STANDALONE_PROJECT_PAGE, 'utf-8');
    expect(content).toContain('generateMetadata');
  });

  test('/projects/[slug]/page.tsx renders CommandCenterShell or full shell', async () => {
    const content = await fs.readFile(STANDALONE_PROJECT_PAGE, 'utf-8');
    const hasShell =
      content.includes('CommandCenterShell') ||
      (content.includes('SkipLink') &&
        content.includes('Topbar') &&
        content.includes('SplitPanel'));
    expect(hasShell).toBe(true);
  });

  test('standalone route is NOT inside (command-center) route group', () => {
    // The standalone page must live at src/app/projects/, not inside (command-center)
    expect(STANDALONE_PROJECT_PAGE).toContain('/src/app/projects/');
    expect(STANDALONE_PROJECT_PAGE).not.toContain('(command-center)');
  });

  test('every non-draft project slug has a corresponding route', async () => {
    // Read all project JSON files and collect non-draft slugs
    const categories = ['games', 'client', 'personal'];
    const allSlugs: string[] = [];

    for (const category of categories) {
      const entries = await readJsonFiles<{ slug: string; draft?: boolean }>(
        path.join(CONTENT_DIR, category),
      );
      for (const { data } of entries) {
        if (!data.draft) {
          allSlugs.push(data.slug);
        }
      }
    }

    expect(allSlugs.length).toBeGreaterThan(0);

    // Verify the standalone page sources slugs from getSiteProjects (site-visible
    // entries only) so generateStaticParams covers every published page.
    const content = await fs.readFile(STANDALONE_PROJECT_PAGE, 'utf-8');
    expect(content).toContain('getSiteProjects');
    expect(content).toContain('generateStaticParams');
  });
});
