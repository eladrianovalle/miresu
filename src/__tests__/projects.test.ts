import { describe, test, expect, vi, beforeEach } from 'vitest';

// --- Mock React cache (not available in vitest) ---
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { ...actual, cache: <T extends (...args: any[]) => any>(fn: T) => fn };
});

// --- Mock fs ---
// Note: vi.mock is hoisted, so we must inline path computations inside the factory.

vi.mock('fs', async () => {
  const _path = await import('path');
  const _projectsRoot = _path.join(process.cwd(), 'src/content/projects');
  const _contentRoot = _path.join(process.cwd(), 'src/content');

  const files: Record<string, string> = {
    [_path.join(_projectsRoot, 'games', 'cyber-siege.json')]:
      JSON.stringify({
        slug: 'cyber-siege', title: 'Cyber Siege', description: 'A cyberpunk strategy game.',
        image: '/assets/images/cyber-siege.png', role: 'Lead Developer', organization: 'ORC PUNK', relationship: 'own',
        status: 'released', year: 2024, platforms: ['PC', 'Mac'],
        storeLinks: [{ platform: 'steam', url: 'https://store.steampowered.com/app/123' }],
      }),
    [_path.join(_projectsRoot, 'games', 'secret-game.json')]:
      JSON.stringify({
        slug: 'secret-game', title: 'Secret Game', description: 'An unannounced game.',
        image: '/assets/images/secret.png', role: 'Director', organization: 'ORC PUNK', relationship: 'own',
        status: 'in-progress', year: 2026, draft: true, platforms: ['PC'],
      }),
    [_path.join(_projectsRoot, 'client', 'acme-portal.json')]:
      JSON.stringify({
        slug: 'acme-portal', title: 'Acme Portal', description: 'Client web portal.',
        image: '/assets/images/acme.png', role: 'Tech Lead', organization: 'Acme Corp', relationship: 'client',
        status: 'released', year: 2023,
      }),
    [_path.join(_projectsRoot, 'personal', 'pixel-garden.json')]:
      JSON.stringify({
        slug: 'pixel-garden', title: 'Pixel Garden', description: 'An interactive installation.',
        image: '/assets/images/pixel-garden.png', role: 'Creator', organization: 'ORC PUNK', relationship: 'own',
        status: 'prototype', year: 2025, medium: 'Interactive Installation',
      }),
    [_path.join(_contentRoot, 'identity.json')]:
      JSON.stringify({
        name: 'Adriano', role: 'Creative Technologist',
        tagline: 'Building weird things on the internet.',
        bio: 'Game developer and creative technologist based in Chicago.',
        id: 'OPR-001', established: 2020, email: 'hello@orcpunk.com',
        socialLinks: [{ platform: 'github', url: 'https://github.com/orcpunk' }],
        availability: { status: 'available', message: 'Open to new projects.' },
      }),
  };

  const dirs: Record<string, string[]> = {
    [_path.join(_projectsRoot, 'games')]: ['cyber-siege.json', 'secret-game.json'],
    [_path.join(_projectsRoot, 'client')]: ['acme-portal.json'],
    [_path.join(_projectsRoot, 'personal')]: ['pixel-garden.json'],
  };

  return {
    promises: {
      readdir: vi.fn((dir: string) => {
        const entries = dirs[dir];
        if (!entries) {
          const err = new Error(`ENOENT: no such file or directory, scandir '${dir}'`) as NodeJS.ErrnoException;
          err.code = 'ENOENT';
          throw err;
        }
        return entries;
      }),
      readFile: vi.fn((filePath: string) => {
        const content = files[filePath];
        if (!content) {
          const err = new Error(`ENOENT: no such file or directory, open '${filePath}'`) as NodeJS.ErrnoException;
          err.code = 'ENOENT';
          throw err;
        }
        return content;
      }),
    },
  };
});

// Import after mock
import {
  getProjects,
  getProjectBySlug,
  getProjectCategories,
  getIdentity,
} from '@/lib/projects';

// --- Tests ---

describe('getProjects', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
  });

  test('returns all non-draft projects sorted by year desc in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const projects = await getProjects();

    // Should exclude the draft game (secret-game)
    expect(projects).toHaveLength(3);
    expect(projects.map((p) => p.slug)).not.toContain('secret-game');

    // Sorted by year descending
    const years = projects.map((p) => p.year);
    expect(years).toEqual([...years].sort((a, b) => b - a));
  });

  test('includes draft projects in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const projects = await getProjects();

    expect(projects).toHaveLength(4);
    expect(projects.map((p) => p.slug)).toContain('secret-game');
  });

  test('returns only game-category projects when filtered', async () => {
    const projects = await getProjects('games');

    expect(projects.length).toBeGreaterThan(0);
    for (const p of projects) {
      expect(p.category).toBe('games');
    }
  });

  test('returns only client-category projects when filtered', async () => {
    const projects = await getProjects('client');

    expect(projects).toHaveLength(1);
    expect(projects[0].category).toBe('client');
    expect(projects[0].slug).toBe('acme-portal');
  });

  test('draft projects are excluded when NODE_ENV is production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const projects = await getProjects();

    const slugs = projects.map((p) => p.slug);
    expect(slugs).not.toContain('secret-game');
  });
});

describe('getProjectBySlug', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
  });

  test('returns project with category field attached', async () => {
    const project = await getProjectBySlug('acme-portal');

    expect(project).not.toBeNull();
    expect(project!.slug).toBe('acme-portal');
    expect(project!.category).toBe('client');
  });

  test('returns null for nonexistent slug', async () => {
    const project = await getProjectBySlug('does-not-exist');
    expect(project).toBeNull();
  });
});

describe('getProjectCategories', () => {
  test('returns ["games", "client", "personal"]', () => {
    const categories = getProjectCategories();
    expect(categories).toEqual(['games', 'client', 'personal']);
  });

  test('returns a new array each call (not mutable reference)', () => {
    const a = getProjectCategories();
    const b = getProjectCategories();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

describe('getIdentity', () => {
  test('returns parsed identity data', async () => {
    const identity = await getIdentity();

    expect(identity.name).toBe('Adriano');
    expect(identity.role).toBe('Creative Technologist');
    expect(identity.email).toBe('hello@orcpunk.com');
    expect(identity.availability.status).toBe('available');
    expect(identity.socialLinks).toHaveLength(1);
  });
});
