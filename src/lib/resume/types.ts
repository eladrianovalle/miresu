// ResumeModel — the single contract both the on-site HTML view and the PDF
// renderer build against. ALL projection logic lives in projectResume.ts; the
// renderers are dumb and only read this shape. Do not deviate.

export interface ResumeLink {
  label: string;
  url: string;
}

export interface ResumeHeader {
  name: string;
  location?: string;
  phone?: string;
  email: string;
  links: ResumeLink[];
}

export interface ExperienceEntry {
  /** real employer / client / entity — used for grouping and React keys */
  org: string;
  /** org as it should be DISPLAYED — the real org, or 'Confidential (under NDA)'
   *  when the entry is masked. Renderers show this; they make no disclosure decision. */
  displayOrg: string;
  /** role title */
  title: string;
  /** 'YYYY-MM' when known, else 'YYYY' fallback from `year` */
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- 'present' is documented contract, kept explicit for renderers
  dateRange: { start: string; end: string | 'present' };
  bullets: string[];
  /** every entry traces back to its content file(s) */
  sourceSlugs: string[];
}

export interface EducationEntry {
  institution: string;
  credential: string;
  /** graduation/award year, e.g. '2016' — shown right-aligned. */
  year?: string;
}

export interface SkillGroup {
  group: string;
  items: string[];
}

export interface ProjectEntry {
  /** project title, e.g. 'Into the Dark' */
  title: string;
  /** release/work year from the site entry — shown, and sorted newest-first */
  year: number;
  /** site slug — renderers build the link (relative on-site, absolute in the PDF) */
  slug: string;
  /** curated stack/skill line for the resume — independent of the site project's stack */
  stack: string[];
  /** one-line resume-voice blurb */
  summary: string;
}

export interface ResumeModel {
  header: ResumeHeader;
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: SkillGroup[];
  education: EducationEntry[];
}
