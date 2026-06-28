// Single source of truth for site-level identity used across metadata, the
// resume renderers, and chrome (topbar/footer logos, brand text). Edit this once
// when you fork — everything that needs your name, brand, URL, and social
// handles reads from here. Per-page CONTENT (projects, bio, resume entries)
// lives in src/content/*.json and is editable via the dev-only /admin editor.

export interface SiteConfig {
  /** Canonical public origin, no trailing slash. Used for absolute links in the
   *  resume PDF/JSON and Open Graph metadata. */
  url: string;
  /** The person whose portfolio this is — used in page titles, JSON-LD author. */
  authorName: string;
  /** The brand/studio name shown in chrome and JSON-LD Organization. May equal
   *  authorName for a personal-only brand. */
  brandName: string;
  /** Short descriptor under the name (page title suffix). */
  tagline: string;
  /** Meta description for SEO / social cards. */
  description: string;
  /** Default Open Graph image (under public/). */
  ogImage: string;
  /** Brand mark shown in the topbar + as the faint decorative watermark. */
  logo: string;
  /** Brand logotype (wordmark) shown in the topbar. */
  logotype: string;
  /** Favicon (under public/). */
  favicon: string;
  /** Social handles / profiles. twitter is an @handle. */
  social: {
    twitter: string;
    instagram: string;
    facebook: string;
  };
  /** Display labels for the project taxonomy. The category/relationship keys are
   *  structural (content dirs, schemas, resume grouping); only the labels are
   *  branding. Omit any subset to fall back to the neutral defaults in
   *  src/lib/site-labels.ts. */
  labels?: {
    /** Filter-tab + directory-row labels for the three project categories. */
    categories?: Partial<Record<'games' | 'client' | 'personal', string>>;
    /** Dossier meta label for a project's organization, by relationship. */
    relationships?: Partial<
      Record<'own' | 'client' | 'employer' | 'collaboration', string>
    >;
  };
  /** Optional stylized identity chrome — the "operator" eyebrow + topbar handle
   *  and the "ID: …" line. Off by default; a fork opts in. */
  chrome?: {
    operator?: boolean;
    showId?: boolean;
  };
}

export const siteConfig: SiteConfig = {
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com',
  authorName: 'Sam Rivera',
  brandName: 'Sam Rivera',
  tagline: 'Product Design & Code',
  description:
    'Product designer and developer building thoughtful interfaces and the systems behind them.',
  ogImage: '/assets/images/og-default.svg',
  logo: '/assets/icons/logo.svg',
  logotype: '/assets/icons/logotype.svg',
  favicon: '/assets/images/favicon.png',
  social: {
    twitter: '@samrivera',
    instagram: 'https://www.instagram.com/samrivera',
    facebook: 'https://www.facebook.com/samrivera',
  },
  // Neutral, generic taxonomy labels for the base template. Rename these per
  // fork (e.g. games -> 'Games', personal -> 'Collabs') to match your domain.
  labels: {
    categories: {
      games: 'Projects',
      client: 'Clients',
      personal: 'Personal',
    },
    relationships: {
      own: 'Independent',
      client: 'Client',
      employer: 'Employer',
      collaboration: 'Collaboration',
    },
  },
  // The stylized "operator"/"ID" chrome stays off in the neutral base.
  chrome: {
    operator: false,
    showId: false,
  },
};
