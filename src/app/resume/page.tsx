import { existsSync } from 'fs';
import path from 'path';
import { Fragment, type ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { withBasePath } from '@/lib/paths';
import { buildMetadata } from '@/lib/metadata';
import { siteConfig } from '@/site.config';
import {
  getProjects,
  getIdentity,
  getSkillsTaxonomy,
  getResumeProjects,
  getEducation,
  getResumeHeader,
} from '@/lib/projects';
import { projectResume } from '@/lib/resume/projectResume';
import { contactFields, formatDateRange, projectPath } from '@/lib/resume/format';

export const metadata: Metadata = buildMetadata({
  title: 'Resume',
  description: `Resume of ${siteConfig.authorName} — experience, skills, projects, and education.`,
});

// Section marker: an accent operator label with a hairline that fades out to the
// right. Echoes the page header's surface-3 divider so sections read as distinct
// blocks without adding decoration for its own sake.
function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <h2 className="whitespace-nowrap font-space-mono text-xs uppercase tracking-widest text-magenta">
        {children}
      </h2>
      <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-magenta/60 via-magenta/20 to-transparent" />
    </div>
  );
}

// The PDF is a build-time artifact (gitignored, emitted by `build:resume-pdf`).
// It exists during static export and prod, but not in a fresh `next dev`, so the
// download link is only shown when the file is actually present — never a 404.
const RESUME_PDF_PUBLIC_PATH = '/assets/resume/resume.pdf';

export default async function ResumePage() {
  const [projects, identity, skills, resumeProjects, education, header] = await Promise.all([
    getProjects(),
    getIdentity(),
    getSkillsTaxonomy(),
    getResumeProjects(),
    getEducation(),
    getResumeHeader(),
  ]);

  const resume = projectResume(projects, identity, {
    skills,
    projects: resumeProjects,
    education,
    header,
  });

  const pdfAvailable = existsSync(path.join(process.cwd(), 'public', RESUME_PDF_PUBLIC_PATH));

  // Inline links: accent color at rest, underline on hover — a quiet, neutral
  // affordance applied consistently across the page.
  const linkClass =
    'text-accent no-underline transition-colors duration-150 hover:underline';

  // Contact line items — order and presence come from contactFields (shared with
  // the PDF); this surface only decides how each kind renders.
  const contactItems: ReactNode[] = contactFields(resume.header).map((field) => {
    switch (field.kind) {
      case 'location':
        return field.value;
      case 'phone':
        return (
          <a href={`tel:${field.value}`} className={linkClass}>
            {field.value}
          </a>
        );
      case 'email':
        return (
          <a href={`mailto:${field.value}`} className={linkClass}>
            {field.value}
          </a>
        );
      case 'link':
        return (
          <a href={field.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {field.label}
          </a>
        );
    }
  });

  return (
    <main className="min-h-screen bg-primary-dark text-text-primary">
      {/* Neutralize reset.css heading margins once for this surface (h2 fully,
          h3 top-only — keeps the 10px below entry titles) so vertical rhythm is
          driven entirely by space-y/mb utilities, not stray UA-style margins. */}
      <div className="mx-auto max-w-3xl px-6 py-12 [&_h2]:my-0 [&_h3]:mt-0">
        <nav className="mb-10 flex items-center justify-between text-sm">
          <Link
            href="/"
            className="font-space-mono text-xs uppercase tracking-wider text-text-secondary no-underline transition-colors duration-150 hover:text-text-primary"
          >
            ← Back to site
          </Link>
          {pdfAvailable && (
            <a
              href={withBasePath(RESUME_PDF_PUBLIC_PATH)}
              download
              className="group inline-flex items-center gap-2 rounded-sm border border-turquoise/50 px-4 py-1.5 font-space-mono text-xs uppercase tracking-widest text-turquoise no-underline transition-colors hover:bg-turquoise hover:text-primary-dark"
            >
              Download PDF
              <span className="transition-transform group-hover:translate-y-0.5">↓</span>
            </a>
          )}
        </nav>

        {/* Header */}
        <header>
          <h1 className="font-syne text-3xl font-bold text-text-primary">{resume.header.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-space-mono text-xs text-text-secondary">
            {contactItems.map((node, i) => (
              <Fragment key={i}>
                {i > 0 && (
                  <span aria-hidden className="text-text-muted/50">
                    ·
                  </span>
                )}
                {node}
              </Fragment>
            ))}
          </div>
        </header>

        {/* Skills */}
        {resume.skills.length > 0 && (
          <section className="mt-8 mb-10">
            <SectionHeading>Skills</SectionHeading>
            <div className="space-y-3">
              {resume.skills.map((group) => (
                <div key={group.group}>
                  <h3 className="font-semibold text-text-primary">{group.group}</h3>
                  <p className="text-text-secondary">{group.items.join(' · ')}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Experience */}
        <section className="mb-10">
          <SectionHeading>Experience</SectionHeading>
          <div className="divide-y divide-surface-3">
            {resume.experience.map((entry) => (
              <article key={`${entry.org}-${entry.sourceSlugs.join('-')}`} className="pt-6 first:pt-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <h3 className="font-syne text-lg font-semibold text-text-primary">
                    {entry.title}
                    <span className="text-text-secondary">
                      {' · '}
                      {entry.displayOrg}
                    </span>
                  </h3>
                  <span className="font-space-mono text-sm text-text-secondary">
                    {formatDateRange(entry.dateRange)}
                  </span>
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-text-primary">
                  {entry.bullets.map((bullet, i) => (
                    <li key={i} className="leading-relaxed">
                      {bullet}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* Projects — curated portfolio highlights, each linking to its site page */}
        {resume.projects.length > 0 && (
          <section className="mb-10">
            <SectionHeading>Projects</SectionHeading>
            <div className="divide-y divide-surface-3">
              {resume.projects.map((project) => (
                <article key={project.slug} className="pt-6 first:pt-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <h3 className="font-syne text-lg font-semibold text-text-primary">
                      <Link href={projectPath(project.slug)} className={linkClass}>
                        {project.title}
                      </Link>
                    </h3>
                    <span className="font-space-mono text-sm text-text-secondary">
                      {project.year}
                    </span>
                  </div>
                  <p className="mt-0.5 font-space-mono text-xs text-text-muted">
                    {project.stack.join(' · ')}
                  </p>
                  <p className="mt-2 leading-relaxed text-text-primary">{project.summary}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <section className="mb-10">
            <SectionHeading>Education</SectionHeading>
            <div className="space-y-4">
              {resume.education.map((entry) => (
                <div key={`${entry.institution}-${entry.credential}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <h3 className="font-semibold text-text-primary">{entry.institution}</h3>
                    {entry.year && (
                      <span className="font-space-mono text-sm text-text-secondary">
                        {entry.year}
                      </span>
                    )}
                  </div>
                  <p className="text-text-secondary">{entry.credential}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
