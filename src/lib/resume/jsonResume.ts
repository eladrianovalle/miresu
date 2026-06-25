import type { ResumeModel } from './types';
import { SITE_ORIGIN, projectPath } from './format';

// JSON Resume export (https://jsonresume.org/schema) — the portable interchange
// format (LinkedIn import rides on it via existing LinkedIn→JSON Resume tools).
// This is a pure projection from ResumeModel, exactly like the HTML/PDF
// renderers: it only reads the model. Site-first concepts (relationship,
// surfaces, curated linkage, NDA org) have no JSON Resume equivalent — work uses
// the already-masked displayOrg, and the rest is intentionally dropped.

export interface JsonResume {
  $schema: string;
  basics: {
    name: string;
    email: string;
    phone?: string;
    url: string;
    location?: { city?: string; region?: string };
    profiles: { network: string; url: string }[];
  };
  work: {
    name: string;
    position: string;
    startDate: string;
    endDate?: string;
    highlights: string[];
  }[];
  education: {
    institution: string;
    studyType: string;
    endDate?: string;
  }[];
  skills: { name: string; keywords: string[] }[];
  languages: { language: string; fluency?: string }[];
  projects: {
    name: string;
    startDate: string;
    description: string;
    keywords: string[];
    url: string;
  }[];
  meta: { canonical: string; version: string };
}

const SCHEMA_URL =
  'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json';

// "White Plains, NY" → { city: 'White Plains', region: 'NY' }
function parseLocation(loc?: string): JsonResume['basics']['location'] | undefined {
  if (!loc) return undefined;
  const [city, region] = loc.split(',').map((s) => s.trim());
  return region ? { city, region } : { city };
}

// "English (native)" → { language: 'English', fluency: 'native' }
function parseLanguage(item: string): { language: string; fluency?: string } {
  const match = /^(.+?)\s*\(([^)]+)\)\s*$/.exec(item);
  return match ? { language: match[1].trim(), fluency: match[2].trim() } : { language: item.trim() };
}

export function toJsonResume(model: ResumeModel): JsonResume {
  const { header } = model;
  const location = parseLocation(header.location);

  // The "Languages" skill group maps to JSON Resume's dedicated languages
  // section; every other group stays in skills.
  const isLanguages = (group: string) => group.toLowerCase() === 'languages';

  return {
    $schema: SCHEMA_URL,
    basics: {
      name: header.name,
      email: header.email,
      ...(header.phone ? { phone: header.phone } : {}),
      url: SITE_ORIGIN,
      ...(location ? { location } : {}),
      profiles: header.links.map((l) => ({ network: l.label, url: l.url })),
    },
    work: model.experience.map((e) => ({
      name: e.displayOrg,
      position: e.title,
      startDate: e.dateRange.start,
      // JSON Resume convention: an ongoing role omits endDate.
      ...(e.dateRange.end === 'present' ? {} : { endDate: e.dateRange.end }),
      highlights: e.bullets,
    })),
    education: model.education.map((ed) => ({
      institution: ed.institution,
      studyType: ed.credential,
      ...(ed.year ? { endDate: ed.year } : {}),
    })),
    skills: model.skills
      .filter((g) => !isLanguages(g.group))
      .map((g) => ({ name: g.group, keywords: g.items })),
    languages: model.skills
      .filter((g) => isLanguages(g.group))
      .flatMap((g) => g.items.map(parseLanguage)),
    projects: model.projects.map((p) => ({
      name: p.title,
      startDate: String(p.year),
      description: p.summary,
      keywords: p.stack,
      url: `${SITE_ORIGIN}${projectPath(p.slug)}`,
    })),
    meta: { canonical: SITE_ORIGIN, version: 'miresu-resume-1' },
  };
}
