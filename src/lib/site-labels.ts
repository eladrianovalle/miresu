// Display labels + optional chrome for the project taxonomy, resolved from the
// per-fork siteConfig overlay. The category/relationship *keys* are structural
// (content dirs, schemas, resume grouping); only their human-facing LABELS are
// branding, so they live in config and default to neutral, generic text here.
// A fork overrides any subset in site.config.ts `labels` / `chrome`.
import type { Project } from '@/lib/projects';
import { siteConfig } from '@/site.config';

type ProjectCategory = Project['category'];
type Relationship = Project['relationship'];

// Neutral defaults for the base template — a fork with no `labels` config
// renders these.
const DEFAULT_CATEGORY_LABELS: Record<ProjectCategory, string> = {
  games: 'Projects',
  client: 'Clients',
  personal: 'Personal',
};

const DEFAULT_RELATIONSHIP_LABELS: Record<Relationship, string> = {
  own: 'Independent',
  client: 'Client',
  employer: 'Employer',
  collaboration: 'Collaboration',
};

/** Filter-tab + directory-row label for each project category. */
export const categoryLabels: Record<ProjectCategory, string> = {
  ...DEFAULT_CATEGORY_LABELS,
  ...siteConfig.labels?.categories,
};

/** Dossier meta label for a project's organization, by relationship. */
export const relationshipLabels: Record<Relationship, string> = {
  ...DEFAULT_RELATIONSHIP_LABELS,
  ...siteConfig.labels?.relationships,
};

/** Optional stylized identity chrome. Off by default for the neutral base. */
export const chrome = {
  /** Show the "operator" eyebrow (identity card) + "operator: handle" (topbar). */
  operator: siteConfig.chrome?.operator ?? false,
  /** Show the "ID: …" line (requires identity.id). */
  showId: siteConfig.chrome?.showId ?? false,
};
