import { z } from 'zod';

// --- Store links ---

export const StoreLinkSchema = z.object({
  platform: z.enum(['steam', 'itch', 'epic', 'gog', 'appstore', 'playstore']),
  url: z.string().url(),
  enabled: z.boolean().optional().default(true),
});

// --- Consulting ---

const ConsultingEngagementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  bullets: z.array(z.string()),
  pricing: z.string(),
  accentColor: z.string(),
});

const ConsultingValueSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

const ConsultingClientTypeSchema = z.object({
  label: z.string(),
});

const ConsultingClientLogoSchema = z.object({
  name: z.string(),
  logo: z.string(),
});

const ConsultingTestimonialSchema = z.object({
  quote: z.string(),
  author: z.string(),
  role: z.string().optional(),
  company: z.string().optional(),
});

export const ConsultingContentSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  tagline: z.string(),
  // Optional hero image for the consulting dossier. When present it fills the
  // hero band (cover); when omitted the band keeps its gradient treatment.
  heroImage: z.string().optional(),
  ctaPrimary: z.object({ label: z.string(), href: z.string() }),
  ctaSecondary: z.object({ label: z.string(), href: z.string() }),
  whatIDo: z.object({
    overline: z.string(),
    headline: z.string(),
    body: z.string(),
    skills: z.array(z.string()),
  }),
  engagements: z.object({
    overline: z.string(),
    headline: z.string(),
    tiers: z.array(ConsultingEngagementSchema),
    footnote: z.string(),
  }),
  howIWork: z.object({
    overline: z.string(),
    headline: z.string(),
    body: z.string(),
    values: z.array(ConsultingValueSchema),
  }),
  clientFit: z.object({
    overline: z.string(),
    headline: z.string(),
    clientTypes: z.array(ConsultingClientTypeSchema),
    pastClients: z.array(z.string()),
    clientLogos: z.array(ConsultingClientLogoSchema).optional(),
  }),
  testimonials: z.array(ConsultingTestimonialSchema).optional(),
  ctaSection: z.object({
    headline: z.string(),
    subheadline: z.string(),
    primaryButton: z.object({ label: z.string(), href: z.string() }),
    secondaryButton: z.object({ label: z.string(), href: z.string() }),
    guideLink: z.object({ label: z.string(), href: z.string() }).optional(),
  }),
  closing: z.object({ body: z.string() }),
});

export type ConsultingContent = z.infer<typeof ConsultingContentSchema>;

// --- Shared sub-schemas ---

const ContributorSchema = z.object({
  name: z.string(),
  role: z.string(),
  url: z.string().url().optional(),
});

const ProjectLinkSchema = z.object({
  label: z.string(),
  url: z.string().url(),
  type: z.enum(['social', 'presskit', 'website', 'store', 'other']),
});

const VideoSchema = z.object({
  src: z.string(),
  poster: z.string(),
  type: z.enum(['hero', 'gallery']),
});

const TestimonialSchema = z.object({
  quote: z.string(),
  author: z.string(),
  role: z.string().optional(),
  company: z.string().optional(),
});

// StoreLinkSchema imported from content.ts (single source of truth for badge compatibility)

// --- Resume sub-schemas ---
// All resume-related project fields are OPTIONAL so existing project JSONs
// validate unchanged. They back-fill structured career data (employment dates,
// titles, employer, curated bullets) that the resume generator projects from.

const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

const DateRangeSchema = z.object({
  start: z.string().regex(YEAR_MONTH, 'Expected YYYY-MM'),
  end: z.union([z.string().regex(YEAR_MONTH, 'Expected YYYY-MM'), z.literal('present')]),
});

// --- Base project schema ---

export const ProjectBaseSchema = z.object({
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  // Optional: when blank/omitted, the display description falls back to the
  // project's `resumeBullets` strung into prose (see `descriptionFor`). Lets an
  // economical entry (just bullets) avoid a second source of truth.
  description: z.string().optional(),
  image: z.string().optional(),
  thumbnail: z.string().optional(),
  role: z.string(),
  contributors: z.array(ContributorSchema).optional(),
  // Who the work was for, and the nature of the relationship. One generic model
  // (replaces the old entity/client/employment.org trio): `organization` is the
  // name; `relationship` drives display + resume grouping.
  organization: z.string(),
  relationship: z.enum(['own', 'client', 'employer', 'collaboration']),
  status: z.enum(['released', 'in-progress', 'prototype', 'archived', 'classified']),
  year: z.number(),
  featured: z.boolean().optional().default(false),
  draft: z.boolean().optional().default(false),
  links: z.array(ProjectLinkSchema).optional(),
  tags: z.array(z.string()).optional(),
  video: VideoSchema.optional(),
  confidential: z.boolean().optional().default(false),
  testimonial: TestimonialSchema.optional(),
  gallery: z.array(z.string()).optional(),
  stack: z.array(z.string()).optional(),
  // --- Resume back-fill fields (all optional) ---
  dateRange: DateRangeSchema.optional(),
  // Resume-facing job title (distinct from the site-facing `role`); falls back
  // to `role` when absent. Was `employment.title`.
  resumeTitle: z.string().optional(),
  resumeBullets: z.array(z.string()).optional(),
  // Where this entry surfaces. Each key defaults true, and the object itself
  // defaults to both-on, so existing JSONs validate to {site:true, resume:true}.
  // Set `resume:false` for entries kept off the resume; `site:false` for entries
  // (e.g. a job with no showcase) kept off the portfolio. Designed to accept
  // more surfaces later without touching the renderers.
  surfaces: z
    .object({
      site: z.boolean().default(true),
      resume: z.boolean().default(true),
    })
    .default({ site: true, resume: true }),
});

// --- Category-specific schemas ---

export const GameProjectSchema = ProjectBaseSchema.extend({
  platforms: z.array(z.string()),
  storeLinks: z.array(StoreLinkSchema).optional(),
  accentColor: z.enum(['magenta', 'turquoise', 'yellow']).optional(),
});

export const ClientProjectSchema = ProjectBaseSchema.extend({
  scope: z.string().optional(),
  clientLogo: z.string().optional(),
});

export const PersonalCategorySchema = ProjectBaseSchema.extend({
  medium: z.string().optional(),
  collaborationType: z.string().optional(),
});

// --- Identity schema ---

const SocialLinkSchema = z.object({
  platform: z.string(),
  url: z.string().url(),
  label: z.string().optional(),
});

const AvailabilitySchema = z.object({
  status: z.enum(['available', 'limited', 'unavailable']),
  message: z.string().optional(),
});

export const IdentitySchema = z.object({
  name: z.string(),
  role: z.string(),
  tagline: z.string(),
  bio: z.string(),
  // Optional operator/badge id (e.g. "SR-001"). Stylized chrome — a fork can
  // omit it and hide the ID line via siteConfig.chrome.showId.
  id: z.string().optional(),
  location: z.string().optional(),
  established: z.number(),
  email: z.string().email(),
  socialLinks: z.array(SocialLinkSchema),
  availability: AvailabilitySchema,
});

// --- Resume singleton schemas ---
// Career data that has no natural home on a project: the skills taxonomy and
// education history. Stored under src/content/resume/.

export const SkillsTaxonomySchema = z.object({
  groups: z.array(
    z.object({
      group: z.string(),
      items: z.array(z.string()),
    }),
  ),
});

// Curated portfolio highlights for the resume's PROJECTS section. Each entry
// references a real site project by slug (renderers link to /projects/[slug]/);
// stack + summary are resume-voice copy, independent of the site project's own
// description and stack.
export const ResumeProjectsSchema = z.object({
  entries: z.array(
    z.object({
      slug: z.string(),
      stack: z.array(z.string()),
      summary: z.string(),
    }),
  ),
});

export const EducationListSchema = z.object({
  entries: z.array(
    z.object({
      institution: z.string(),
      credential: z.string(),
      year: z.string().optional(),
    }),
  ),
});

// Resume-only header overrides. Lets the downloadable resume carry contact
// details (phone) that we deliberately do NOT surface on the public site's
// identity card. All fields optional — each falls back to identity.json when
// absent.
export const ResumeHeaderSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  links: z.array(z.object({ label: z.string(), url: z.string().url() })).optional(),
});
export type ResumeHeaderData = z.infer<typeof ResumeHeaderSchema>;

// --- Theme singleton schema (Theme M0) ---
// The site palette is git-managed content (src/content/theme.json), validated
// here and read by src/theme.config.ts. M0 models light + dark palettes but only
// injects the default mode; the toggle/fonts pipeline land in later milestones.

// The 12 semantic color tokens. Each is a hex string — channels are DERIVED in
// code (hexToRgbChannels) at injection time, never authored in the JSON.
export const PaletteSchema = z.object({
  accent: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Expected a hex color, e.g. #abc or #aabbcc'),
  accentSecondary: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Expected a hex color, e.g. #abc or #aabbcc'),
  accentTertiary: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Expected a hex color, e.g. #abc or #aabbcc'),
  primaryDark: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Expected a hex color, e.g. #abc or #aabbcc'),
  surface1: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Expected a hex color, e.g. #abc or #aabbcc'),
  surface2: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Expected a hex color, e.g. #abc or #aabbcc'),
  surface3: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Expected a hex color, e.g. #abc or #aabbcc'),
  border: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Expected a hex color, e.g. #abc or #aabbcc'),
  ivory: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Expected a hex color, e.g. #abc or #aabbcc'),
  textPrimary: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Expected a hex color, e.g. #abc or #aabbcc'),
  textSecondary: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Expected a hex color, e.g. #abc or #aabbcc'),
  textMuted: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Expected a hex color, e.g. #abc or #aabbcc'),
});

// Font family descriptors. Modeled (mirrors src/app/fonts.ts) but NOT consumed
// in M0 — the next/font pipeline rewiring is M2 (#21). Permissive so the schema
// can absorb provider-specific knobs without churn.
const FontDescriptorSchema = z
  .object({
    family: z.string(),
    weights: z.array(z.string()).optional(),
    variable: z.string().optional(),
  })
  .passthrough();

export const ThemeFontsSchema = z.object({
  display: FontDescriptorSchema,
  mono: FontDescriptorSchema,
  body: FontDescriptorSchema,
});

export const ThemeSchema = z.object({
  colors: z.object({ light: PaletteSchema, dark: PaletteSchema }),
  defaultMode: z.enum(['light', 'dark', 'system']),
  enableToggle: z.boolean(),
  fonts: ThemeFontsSchema,
});

export type Palette = z.infer<typeof PaletteSchema>;
export type ThemeFonts = z.infer<typeof ThemeFontsSchema>;
export type ThemeContent = z.infer<typeof ThemeSchema>;

// --- Inferred TypeScript types ---

export type ProjectBase = z.infer<typeof ProjectBaseSchema>;
export type GameProject = z.infer<typeof GameProjectSchema>;
export type ClientProject = z.infer<typeof ClientProjectSchema>;
export type PersonalCategoryProject = z.infer<typeof PersonalCategorySchema>;
export type Identity = z.infer<typeof IdentitySchema>;
export type SkillsTaxonomy = z.infer<typeof SkillsTaxonomySchema>;
export type ResumeProjects = z.infer<typeof ResumeProjectsSchema>;
export type EducationList = z.infer<typeof EducationListSchema>;
