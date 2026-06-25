// projectResume — the single pure projection from content into a ResumeModel.
// ALL resume logic lives here; both renderers (HTML view + PDF) are dumb and
// only read the returned model. No I/O, no framework imports — pure functions
// so it is trivially unit-testable.

import type { Project } from '@/lib/projects';
import type {
  Identity,
  SkillsTaxonomy,
  ResumeProjects,
  EducationList,
  ResumeHeaderData,
} from '@/types/project-content';
import type {
  ResumeModel,
  ResumeLink,
  ExperienceEntry,
  ProjectEntry,
  SkillGroup,
  EducationEntry,
} from './types';

interface ResumeSingletons {
  skills?: SkillsTaxonomy | null;
  projects?: ResumeProjects | null;
  education?: EducationList | null;
  header?: ResumeHeaderData | null;
}

// Social platforms we surface on a resume, in preference order.
const PREFERRED_LINK_ORDER = ['linkedin', 'github', 'website', 'portfolio'];

function buildHeader(
  identity: Identity,
  header?: ResumeHeaderData | null,
): ResumeModel['header'] {
  // Keep only recognized professional links, ordered by PREFERRED_LINK_ORDER.
  const rank = (platform: string) => PREFERRED_LINK_ORDER.indexOf(platform.toLowerCase());
  const derivedLinks: ResumeLink[] = identity.socialLinks
    .filter((link) => rank(link.platform) !== -1)
    .sort((a, b) => rank(a.platform) - rank(b.platform))
    .map((link) => ({ label: link.label ?? link.platform, url: link.url }));

  // Resume-only header overrides win when present; otherwise fall back to
  // identity.json (name always comes from identity).
  const links =
    header?.links && header.links.length > 0 ? header.links : derivedLinks;

  return {
    name: identity.name,
    location: header?.location ?? identity.location,
    phone: header?.phone,
    email: header?.email ?? identity.email,
    links,
  };
}

// The org a project groups under on the resume.
function orgFor(project: Project): string {
  return project.organization;
}

// Resume-facing job title; falls back to the site-facing role.
function titleFor(project: Project): string {
  return project.resumeTitle ?? project.role;
}

// Deterministic, deliberately-rough fallback bullets when no curated
// resumeBullets exist. Kept obviously crude so it reads as needing a human
// pass — we never want auto-generated prose to look finished.
function fallbackBullets(project: Project): string[] {
  const bullets: string[] = [];
  if (project.category === 'client' && project.scope) {
    bullets.push(`TODO polish — ${project.scope}`);
  } else if (project.description) {
    // Crude: first sentence of the description, trimmed.
    const firstSentence = project.description.split(/(?<=[.!?])\s/)[0]?.trim();
    if (firstSentence) bullets.push(`TODO polish — ${firstSentence}`);
  }
  return bullets;
}

// Single source of truth for ordering by end date. 'present' is newest;
// 'YYYY-MM' → year*12+month; a year-only fallback ('YYYY') counts as that
// year's December so it never sinks below an early month of the same year.
// (A numeric key avoids the mixed-length-string localeCompare bug where
// '2017' would sort as older than '2017-05'.)
function dateSortKey(value: string): number {
  if (value === 'present') return Number.POSITIVE_INFINITY;
  const match = /^(\d{4})(?:-(\d{2}))?$/.exec(value);
  if (!match) return 0;
  return Number(match[1]) * 12 + (match[2] ? Number(match[2]) : 12);
}

const endKeyOf = (p: Project): number => dateSortKey(p.dateRange?.end ?? `${p.year}`);

// Bullets a single project contributes to its entry. A confidential project
// contributes ONLY its approved (curated) resumeBullets — never a
// description-derived fallback — so its specifics can't leak even when it shares
// an org group with a non-confidential project.
function bulletsForMember(project: Project): string[] {
  if (project.confidential) return project.resumeBullets ?? [];
  return project.resumeBullets && project.resumeBullets.length > 0
    ? project.resumeBullets
    : fallbackBullets(project);
}

function buildExperience(projects: Project[]): ExperienceEntry[] {
  // Exclude drafts and entries not surfaced on the resume.
  const visible = projects.filter((p) => !p.draft && p.surfaces.resume);

  // Group by org. Within a group we collapse multiple projects into one entry.
  const groups = new Map<string, Project[]>();
  for (const project of visible) {
    const org = orgFor(project);
    const existing = groups.get(org);
    if (existing) existing.push(project);
    else groups.set(org, [project]);
  }

  const entries: ExperienceEntry[] = [];

  for (const [org, members] of groups) {
    // Sort members newest-first (by end date) so dates/titles/bullets read top-down.
    const sorted = [...members].sort((a, b) => endKeyOf(b) - endKeyOf(a));

    const newest = sorted[0];
    const oldest = sorted[sorted.length - 1];
    const title = titleFor(newest);

    // Span from oldest start to newest end, falling back to `year` ('YYYY').
    const start = oldest.dateRange?.start ?? `${oldest.year}`;
    const end = newest.dateRange?.end ?? `${newest.year}`;

    const curated = sorted.flatMap((m) => m.resumeBullets ?? []);

    // Mask only when EVERY contributing project is confidential AND none has
    // approved language to show. A single non-confidential member discloses the
    // real org. (The public site hero keeps its own [CLASSIFIED] treatment.)
    const masked = members.every((m) => m.confidential) && curated.length === 0;
    const displayOrg = masked ? 'Confidential (under NDA)' : org;

    const bullets = masked
      ? ['Confidential engagement — details under NDA.']
      : sorted.flatMap(bulletsForMember);

    entries.push({
      org,
      displayOrg,
      title,
      dateRange: { start, end },
      bullets,
      sourceSlugs: sorted.map((m) => m.slug),
    });
  }

  // Sort entries newest-first by end date — same key as the member sort.
  return entries.sort((a, b) => dateSortKey(b.dateRange.end) - dateSortKey(a.dateRange.end));
}

// Curated portfolio highlights. Each entry names a site project by slug; the
// title comes from the live project (single source of truth) and the slug is
// passed through so renderers can link to /projects/[slug]/. Entries whose slug
// matches no project are dropped (never render a dead link).
function buildProjects(
  projects: Project[],
  curated?: ResumeProjects | null,
): ProjectEntry[] {
  if (!curated) return [];
  const bySlug = new Map(projects.map((p) => [p.slug, p]));
  return curated.entries
    .flatMap((entry) => {
      const project = bySlug.get(entry.slug);
      if (!project) return [];
      return [
        {
          title: project.title,
          year: project.year,
          slug: entry.slug,
          stack: entry.stack,
          summary: entry.summary,
        },
      ];
    })
    // Newest first; equal years keep curated order (stable sort).
    .sort((a, b) => b.year - a.year);
}

function buildSkills(skills?: SkillsTaxonomy | null): SkillGroup[] {
  if (!skills) return [];
  return skills.groups.map((g) => ({ group: g.group, items: g.items }));
}

function buildEducation(education?: EducationList | null): EducationEntry[] {
  if (!education) return [];
  return education.entries.map((e) => ({
    institution: e.institution,
    credential: e.credential,
    year: e.year,
  }));
}

export function projectResume(
  projects: Project[],
  identity: Identity,
  singletons: ResumeSingletons = {},
): ResumeModel {
  return {
    header: buildHeader(identity, singletons.header),
    experience: buildExperience(projects),
    projects: buildProjects(projects, singletons.projects),
    skills: buildSkills(singletons.skills),
    education: buildEducation(singletons.education),
  };
}
