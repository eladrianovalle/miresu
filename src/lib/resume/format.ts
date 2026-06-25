// Shared formatting/derivation for BOTH resume renderers (the on-site HTML view
// and the build-time PDF) so the two surfaces never diverge. No framework or
// Date/locale dependency — pure, deterministic, importable from the Node build.

import { siteConfig } from '@/site.config';
import type { ResumeHeader } from './types';

// One contact entry, in the order it should appear. The renderers map over this
// so neither has to know which fields are present or in what order.
export type ContactField =
  | { kind: 'location'; value: string }
  | { kind: 'phone'; value: string }
  | { kind: 'email'; value: string }
  | { kind: 'link'; label: string; url: string };

// Single source of truth for resume contact fields and their order: location,
// phone, email, then header links. The HTML view renders these as
// text/tel:/mailto:/anchor; the PDF renders them as plain (cleanUrl'd) text.
export function contactFields(header: ResumeHeader): ContactField[] {
  const fields: ContactField[] = [];
  if (header.location) fields.push({ kind: 'location', value: header.location });
  if (header.phone) fields.push({ kind: 'phone', value: header.phone });
  fields.push({ kind: 'email', value: header.email });
  for (const link of header.links) {
    fields.push({ kind: 'link', label: link.label, url: link.url });
  }
  return fields;
}

// 'YYYY-MM' -> 'Mon YYYY'   ·   'YYYY' -> 'YYYY'   ·   'present' -> 'Present'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function formatDate(value: string): string {
  if (value === 'present') return 'Present';
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return value; // year-only fallback ('YYYY') renders as-is
  const [, year, month] = match;
  return `${MONTHS[Number(month) - 1] ?? month} ${year}`;
}

export function formatDateRange(range?: { start: string; end: string }): string {
  if (!range) return '';
  const start = formatDate(range.start);
  const end = formatDate(range.end);
  // A single-point span shows once, not "2018 — 2018". projectResume emits
  // { start: 'YYYY', end: 'YYYY' } for a year-only experience entry (one with a
  // `year` but no `dateRange`), so this collapse is the formatter's job.
  return start === end ? start : `${start} — ${end}`;
}

// Canonical origin for the public site — used to build absolute project links
// in the PDF (the on-site HTML view links relatively via withBasePath instead).
// Sourced from the single site config (src/site.config.ts).
export const SITE_ORIGIN = siteConfig.url;

// Path to a project's standalone page. Both resume renderers link here: the
// HTML view wraps it with withBasePath, the PDF prefixes it with SITE_ORIGIN.
export function projectPath(slug: string): string {
  return `/projects/${slug}/`;
}

// A URL without protocol/www/trailing-slash noise — still plain, ATS-readable
// text, just tidier. Used where a link is shown as text (the PDF) rather than
// hyperlinked (the on-site view shows the label instead).
export function cleanUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
}
