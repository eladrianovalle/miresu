import { z } from 'zod';
import {
  GameProjectSchema,
  ClientProjectSchema,
  PersonalCategorySchema,
  ConsultingContentSchema,
  IdentitySchema,
  SkillsTaxonomySchema,
  EducationListSchema,
  ResumeHeaderSchema,
  ResumeProjectsSchema,
} from '@/types/project-content';

// --- Content type definitions ---

export type ProjectCategoryKey = 'games' | 'client' | 'personal';
export type SingletonKey =
  | 'consulting'
  | 'identity'
  | 'resume-header'
  | 'resume-skills'
  | 'resume-education'
  | 'resume-projects';
export type ContentTypeKey = `projects/${ProjectCategoryKey}` | SingletonKey;

interface ProjectContentType {
  kind: 'project';
  schema: z.ZodType;
  /** Relative to process.cwd() */
  dir: string;
  label: string;
  category: ProjectCategoryKey;
}

interface SingletonContentType {
  kind: 'singleton';
  schema: z.ZodType;
  /** Relative to process.cwd() */
  filePath: string;
  label: string;
}

export type ContentTypeEntry = ProjectContentType | SingletonContentType;

export const CONTENT_TYPES: Record<ContentTypeKey, ContentTypeEntry> = {
  'projects/games': {
    kind: 'project',
    schema: GameProjectSchema,
    dir: 'src/content/projects/games',
    label: 'Game Projects',
    category: 'games',
  },
  'projects/client': {
    kind: 'project',
    schema: ClientProjectSchema,
    dir: 'src/content/projects/client',
    label: 'Client Projects',
    category: 'client',
  },
  'projects/personal': {
    kind: 'project',
    schema: PersonalCategorySchema,
    dir: 'src/content/projects/personal',
    label: 'Collaborations',
    category: 'personal',
  },
  consulting: {
    kind: 'singleton',
    schema: ConsultingContentSchema,
    filePath: 'src/content/consulting.json',
    label: 'Consulting',
  },
  identity: {
    kind: 'singleton',
    schema: IdentitySchema,
    filePath: 'src/content/identity.json',
    label: 'Identity',
  },
  'resume-header': {
    kind: 'singleton',
    schema: ResumeHeaderSchema,
    filePath: 'src/content/resume/header.json',
    label: 'Résumé — Header',
  },
  'resume-skills': {
    kind: 'singleton',
    schema: SkillsTaxonomySchema,
    filePath: 'src/content/resume/skills.json',
    label: 'Résumé — Skills',
  },
  'resume-education': {
    kind: 'singleton',
    schema: EducationListSchema,
    filePath: 'src/content/resume/education.json',
    label: 'Résumé — Education',
  },
  'resume-projects': {
    kind: 'singleton',
    schema: ResumeProjectsSchema,
    filePath: 'src/content/resume/projects.json',
    label: 'Résumé — Projects',
  },
} as const;

export const PROJECT_CATEGORIES: ProjectCategoryKey[] = ['games', 'client', 'personal'];

/** Narrow an arbitrary route param to a known singleton content key. */
export function isSingletonKey(key: string): key is SingletonKey {
  const entry = (CONTENT_TYPES as Record<string, ContentTypeEntry>)[key];
  return entry !== undefined && entry.kind === 'singleton';
}

// --- Field annotations ---

/** UI hints layered on top of JSON Schema output */
export interface FieldAnnotations {
  fieldOrder: string[];
  hints: Record<string, string>;
  textareaFields: string[];
}

/** Long-text fields that should render as <textarea> instead of <input> */
const TEXTAREA_FIELDS = new Set([
  'description', 'body', 'quote', 'bio', 'subheadline', 'headline',
  'footnote', 'tagline',
]);

const FIELD_HINTS: Record<string, string> = {
  confidential: 'Hides gallery and thumbnail, shows [CLASSIFIED // UNDER NDA] overlay',
  draft: 'Draft projects are visible in development but hidden in production',
  featured: 'Featured projects may receive special placement (not currently used)',
  slug: 'URL-safe identifier. Cannot be changed after creation.',
  accentColor: 'Neon accent color for project detail view',
  organization: 'Who the work was for (e.g. your own studio, or a client/employer name).',
  relationship: 'own = your own product/IP · client = freelance/contract · employer = full-time · collaboration. Drives the dossier label and resume grouping.',
  resumeTitle: 'Resume-facing job title (e.g. "Senior Unity Engineer"). Falls back to Role if blank.',
  enabled: 'Disabled store links are hidden from the public site',
};

/**
 * Build annotations for a content type by inspecting its Zod schema shape.
 * Field order is derived from Object.keys(schema.shape), which preserves
 * declaration order in V8/modern engines.
 */
export function getAnnotations(typeKey: ContentTypeKey): FieldAnnotations {
  const entry = CONTENT_TYPES[typeKey];
  const schema = entry.schema;

  // Access the underlying shape to get field order
  // Zod 4 objects expose .shape as a getter
  let fieldOrder: string[] = [];
  if ('shape' in schema && typeof schema.shape === 'object' && schema.shape !== null) {
    fieldOrder = Object.keys(schema.shape as Record<string, unknown>);
  }

  // Collect textarea fields present in this schema
  const textareaFields = fieldOrder.filter((f) => TEXTAREA_FIELDS.has(f));

  // Filter hints to only those relevant to this schema
  const hints: Record<string, string> = {};
  for (const key of fieldOrder) {
    if (FIELD_HINTS[key]) {
      hints[key] = FIELD_HINTS[key];
    }
  }

  return { fieldOrder, hints, textareaFields };
}

/**
 * Convert a content type's Zod schema to JSON Schema 2020-12
 * with UI annotations attached.
 */
export function getJsonSchemaWithAnnotations(typeKey: ContentTypeKey) {
  const entry = CONTENT_TYPES[typeKey];
  const jsonSchema = z.toJSONSchema(entry.schema);
  const annotations = getAnnotations(typeKey);

  return {
    type: typeKey,
    label: entry.label,
    jsonSchema,
    annotations,
  };
}
