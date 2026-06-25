import { describe, test, expect } from 'vitest';
import { projectResume } from './projectResume';
import type { Project } from '@/lib/projects';
import type { Identity } from '@/types/project-content';

// --- Small inline fixtures (NOT the real content) ---

const identity: Identity = {
  name: 'Test Person',
  role: 'Test Role',
  tagline: 't',
  bio: 'b',
  id: 'X-1',
  location: 'Testville',
  established: 2010,
  email: 'test@example.com',
  socialLinks: [
    { platform: 'instagram', url: 'https://instagram.com/x' },
    { platform: 'linkedin', url: 'https://linkedin.com/in/x' },
    { platform: 'github', url: 'https://github.com/x' },
  ],
  availability: { status: 'available' },
};

function makeProject(overrides: Partial<Project>): Project {
  return {
    slug: 'p',
    title: 'P',
    description: 'A thing happened. Then another thing.',
    role: 'Engineer',
    organization: 'ORC PUNK',
    relationship: 'own',
    status: 'released',
    year: 2020,
    featured: false,
    draft: false,
    confidential: false,
    surfaces: { site: true, resume: true },
    category: 'games',
    platforms: ['PC'],
    ...overrides,
  } as Project;
}

describe('projectResume — header', () => {
  test('keeps only professional links (linkedin/github) in preferred order', () => {
    const model = projectResume([], identity);
    expect(model.header.links.map((l) => l.url)).toEqual([
      'https://linkedin.com/in/x',
      'https://github.com/x',
    ]);
    expect(model.header.name).toBe('Test Person');
    expect(model.header.location).toBe('Testville');
  });
});

describe('projectResume — grouping', () => {
  test('collapses multiple projects under the same organization into one entry', () => {
    const projects = [
      makeProject({ slug: 'a', organization: 'BigCo', relationship: 'employer', resumeTitle: 'Senior Eng', year: 2022 }),
      makeProject({ slug: 'b', organization: 'BigCo', relationship: 'employer', resumeTitle: 'Eng', year: 2021 }),
    ];
    const model = projectResume(projects, identity);
    expect(model.experience).toHaveLength(1);
    const entry = model.experience[0];
    expect(entry.org).toBe('BigCo');
    expect(entry.sourceSlugs).toEqual(['a', 'b']);
    // Newest member's resume title wins.
    expect(entry.title).toBe('Senior Eng');
  });

  test('groups by organization across categories', () => {
    const projects = [
      makeProject({ slug: 'c', category: 'client', relationship: 'client', organization: 'Juncture Media', year: 2017 }),
      makeProject({ slug: 'g', organization: 'ORC PUNK', year: 2020 }),
    ];
    const model = projectResume(projects, identity);
    const orgs = model.experience.map((e) => e.org).sort();
    expect(orgs).toEqual(['Juncture Media', 'ORC PUNK']);
  });
});

describe('projectResume — ordering', () => {
  test('sorts experience by end date desc, with year fallback', () => {
    const projects = [
      makeProject({ slug: 'old', organization: 'OldCo', year: 2015 }),
      makeProject({ slug: 'new', organization: 'NewCo', dateRange: { start: '2023-01', end: '2024-06' } }),
      makeProject({ slug: 'mid', organization: 'MidCo', year: 2019 }),
    ];
    const model = projectResume(projects, identity);
    expect(model.experience.map((e) => e.org)).toEqual(['NewCo', 'MidCo', 'OldCo']);
  });

  test('present sorts newest', () => {
    const projects = [
      makeProject({ slug: 'done', organization: 'DoneCo', dateRange: { start: '2020-01', end: '2022-01' } }),
      makeProject({ slug: 'current', organization: 'CurrentCo', dateRange: { start: '2023-01', end: 'present' } }),
    ];
    const model = projectResume(projects, identity);
    expect(model.experience[0].org).toBe('CurrentCo');
  });
});

describe('projectResume — confidential', () => {
  test('emits a single neutral scope line when no curated bullets exist', () => {
    const projects = [
      makeProject({
        slug: 'secret',
        organization: 'SecretCo',
        confidential: true,
        description: 'Top secret prototype with avatar customization and netcode.',
      }),
    ];
    const model = projectResume(projects, identity);
    const entry = model.experience[0];
    expect(entry.displayOrg).toBe('Confidential (under NDA)');
    expect(entry.bullets).toHaveLength(1);
    // No specifics leak from the description.
    expect(entry.bullets[0]).not.toContain('avatar');
    expect(entry.bullets[0]).toContain('NDA');
  });

  test('clears the mask (shows real org + approved bullets) when curated resumeBullets exist', () => {
    const projects = [
      makeProject({
        slug: 'secret',
        organization: 'SecretCo',
        confidential: true,
        description: 'Top secret prototype with avatar customization and netcode.',
        resumeBullets: [
          'Built foundational networking and avatar systems (approved language).',
          'Led cross-functional prototyping.',
        ],
      }),
    ];
    const model = projectResume(projects, identity);
    const entry = model.experience[0];
    // Confidential + approved bullets => cleared for the resume (real org shows).
    expect(entry.displayOrg).toBe('SecretCo');
    expect(entry.org).toBe('SecretCo');
    expect(entry.bullets).toEqual([
      'Built foundational networking and avatar systems (approved language).',
      'Led cross-functional prototyping.',
    ]);
    // The neutral fallback line is NOT used when curated bullets exist.
    expect(entry.bullets.some((b) => b.includes('NDA'))).toBe(false);
  });

  test('a confidential member never leaks its description into a non-masked group', () => {
    // Same org: one public project (with bullets) + one confidential project
    // (no curated bullets, sensitive description). The group is NOT masked
    // because not every member is confidential — but the confidential member
    // must contribute nothing (no description-derived fallback).
    const projects = [
      makeProject({
        slug: 'public',
        organization: 'Acme',
        relationship: 'employer',
        year: 2021,
        resumeBullets: ['Shipped the public feature.'],
      }),
      makeProject({
        slug: 'secret',
        organization: 'Acme',
        relationship: 'employer',
        year: 2020,
        confidential: true,
        description: 'Unreleased avatar-customization netcode prototype.',
      }),
    ];
    const entry = projectResume(projects, identity).experience[0];
    expect(entry.displayOrg).toBe('Acme'); // not masked — a public member discloses the org
    expect(entry.bullets).toEqual(['Shipped the public feature.']);
    expect(entry.bullets.join(' ')).not.toContain('avatar'); // no leak
  });
});

describe('projectResume — date ordering', () => {
  test('a year-only end date is not mis-ordered against same-year YYYY-MM (no localeCompare bug)', () => {
    // Under string localeCompare, '2017' sorts BEFORE '2017-05'. The numeric
    // dateSortKey treats a year-only end as that year's December, so the
    // year-only role is the more recent of the two.
    const projects = [
      makeProject({ slug: 'early', organization: 'EarlyCo', dateRange: { start: '2017-01', end: '2017-05' } }),
      makeProject({ slug: 'yearonly', organization: 'YearCo', year: 2017 }), // no dateRange → end '2017'
    ];
    const orgs = projectResume(projects, identity).experience.map((e) => e.org);
    expect(orgs).toEqual(['YearCo', 'EarlyCo']);
  });

  test("'present' always sorts newest", () => {
    const projects = [
      makeProject({ slug: 'past', organization: 'PastCo', dateRange: { start: '2019-01', end: '2024-01' } }),
      makeProject({ slug: 'now', organization: 'NowCo', dateRange: { start: '2020-01', end: 'present' } }),
    ];
    const orgs = projectResume(projects, identity).experience.map((e) => e.org);
    expect(orgs).toEqual(['NowCo', 'PastCo']);
  });
});

describe('projectResume — header override', () => {
  test('header phone/email/location/links win over identity', () => {
    const model = projectResume([], identity, {
      header: {
        email: 'override@orcpunk.com',
        phone: '917.825.7155',
        location: 'White Plains, NY',
        links: [{ label: 'Portfolio', url: 'https://orcpunk.com' }],
      },
    });
    // Name always comes from identity.
    expect(model.header.name).toBe('Test Person');
    expect(model.header.phone).toBe('917.825.7155');
    expect(model.header.location).toBe('White Plains, NY');
    expect(model.header.email).toBe('override@orcpunk.com');
    expect(model.header.links).toEqual([
      { label: 'Portfolio', url: 'https://orcpunk.com' },
    ]);
  });

  test('falls back to identity when no header override is provided', () => {
    const model = projectResume([], identity);
    expect(model.header.email).toBe('test@example.com');
    expect(model.header.phone).toBeUndefined();
    // Derived professional links from socialLinks still apply.
    expect(model.header.links.map((l) => l.url)).toEqual([
      'https://linkedin.com/in/x',
      'https://github.com/x',
    ]);
  });
});

describe('projectResume — projects', () => {
  test('is empty when no curated projects are provided', () => {
    expect(projectResume([], identity).projects).toEqual([]);
  });

  test('takes title + year from the live project, stack/summary from the curated entry', () => {
    const projects = [
      makeProject({ slug: 'narakan', title: 'Into the Dark: Narakan', year: 2018 }),
    ];
    const model = projectResume(projects, identity, {
      projects: {
        entries: [{ slug: 'narakan', stack: ['Unity', 'C#'], summary: 'A rogue-like.' }],
      },
    });
    expect(model.projects).toEqual([
      {
        title: 'Into the Dark: Narakan',
        year: 2018,
        slug: 'narakan',
        stack: ['Unity', 'C#'],
        summary: 'A rogue-like.',
      },
    ]);
  });

  test('sorts projects newest-first by year, regardless of curated order', () => {
    const projects = [
      makeProject({ slug: 'old', year: 2017 }),
      makeProject({ slug: 'new', year: 2022 }),
      makeProject({ slug: 'mid', year: 2019 }),
    ];
    const model = projectResume(projects, identity, {
      projects: {
        entries: [
          { slug: 'old', stack: [], summary: 'o' },
          { slug: 'new', stack: [], summary: 'n' },
          { slug: 'mid', stack: [], summary: 'm' },
        ],
      },
    });
    expect(model.projects.map((p) => p.slug)).toEqual(['new', 'mid', 'old']);
  });

  test('drops curated entries whose slug matches no project (no dead links)', () => {
    const projects = [makeProject({ slug: 'narakan' })];
    const model = projectResume(projects, identity, {
      projects: {
        entries: [
          { slug: 'narakan', stack: ['Unity'], summary: 'x' },
          { slug: 'ghost', stack: ['Unity'], summary: 'y' },
        ],
      },
    });
    expect(model.projects.map((p) => p.slug)).toEqual(['narakan']);
  });
});

describe('projectResume — bullets', () => {
  test('uses curated resumeBullets when present', () => {
    const projects = [
      makeProject({ slug: 'b', organization: 'Co', resumeBullets: ['Did the thing well.'] }),
    ];
    const model = projectResume(projects, identity);
    expect(model.experience[0].bullets).toEqual(['Did the thing well.']);
  });

  test('falls back to a clearly-rough TODO bullet when none provided', () => {
    const projects = [
      makeProject({ slug: 'b', organization: 'Co', description: 'Built a launcher. More detail here.' }),
    ];
    const model = projectResume(projects, identity);
    expect(model.experience[0].bullets[0]).toContain('TODO');
  });
});

describe('projectResume — filtering and sourceSlugs', () => {
  test('excludes draft and resume-hidden (surfaces.resume:false) projects', () => {
    const projects = [
      makeProject({ slug: 'visible', organization: 'VisibleCo' }),
      makeProject({ slug: 'draft', organization: 'DraftCo', draft: true }),
      makeProject({ slug: 'hidden', organization: 'HiddenCo', surfaces: { site: true, resume: false } }),
    ];
    const model = projectResume(projects, identity);
    expect(model.experience.map((e) => e.org)).toEqual(['VisibleCo']);
  });

  test('every entry has at least one sourceSlug', () => {
    const projects = [
      makeProject({ slug: 'a', organization: 'A' }),
      makeProject({ slug: 'b', organization: 'B' }),
    ];
    const model = projectResume(projects, identity);
    for (const entry of model.experience) {
      expect(entry.sourceSlugs.length).toBeGreaterThan(0);
    }
  });

  test('year-only projects produce YYYY date range', () => {
    const projects = [makeProject({ slug: 'a', organization: 'A', year: 2018 })];
    const model = projectResume(projects, identity);
    expect(model.experience[0].dateRange).toEqual({ start: '2018', end: '2018' });
  });
});
