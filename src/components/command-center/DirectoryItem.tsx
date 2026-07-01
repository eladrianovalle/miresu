'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { Project } from '@/lib/projects';
import { getHeroImage } from '@/lib/project-utils';
import { categoryLabels } from '@/lib/site-labels';
import { DraftBadge } from '@/components/ui/DraftBadge';

type DirectoryItemProps = {
  project: Project;
  index?: number;
};

function StatusBadge({ project }: { project: Project }) {
  if (project.confidential) {
    return <span className="cc-status-badge classified">[UNDER NDA]</span>;
  }

  const statusClass = project.status.replace(/\s+/g, '-');
  return <span className={`cc-status-badge ${statusClass}`}>{project.status}</span>;
}

export function DirectoryItem({ project, index = 0 }: DirectoryItemProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const imageSrc = project.confidential ? null : (project.thumbnail ?? getHeroImage(project));
  const categoryLabel = categoryLabels[project.category];

  const query = searchParams.toString();
  const href = `/projects/${project.slug}/${query ? `?${query}` : ''}`;
  // The currently-open project (its dossier is showing) stays lit in the list.
  // Compare with the trailing slash stripped from both sides: under static
  // export (trailingSlash:true) usePathname() can report the path with or
  // without the slash, and an exact match would flip `active` + aria-current
  // between SSR and hydration.
  const isActive =
    pathname.replace(/\/$/, '') === `/projects/${project.slug}`;

  return (
    <Link
      href={href}
      prefetch={true}
      className={`cc-project-item${isActive ? ' active' : ''}`}
      data-category={project.category}
      aria-current={isActive ? 'page' : undefined}
      style={{ '--drift-del': `${(index * 0.7).toFixed(1)}s` } as React.CSSProperties}
      role="option"
      aria-label={`${project.title} — ${categoryLabel}, ${project.year}, ${project.status}`}
    >
      <div className="cc-project-item-info">
        <div className="cc-project-item-title">{project.title}</div>
        <div className="cc-project-item-meta">
          <span className="cc-category-tag" data-cat={project.category}>
            {categoryLabel}
          </span>
          <span className="cc-meta-sep">&middot;</span>
          <span>{project.year}</span>
          {project.role && (
            <>
              <span className="cc-meta-sep">&middot;</span>
              <span className="cc-meta-role">{project.role}</span>
            </>
          )}
        </div>
      </div>
      <div className="cc-project-thumb-wrapper">
        <DraftBadge draft={project.draft} />
        {imageSrc ? (
          <Image
            className="cc-project-thumb"
            src={imageSrc}
            alt={`${project.title} thumbnail`}
            fill
            sizes="140px"
          />
        ) : (
          <div className="cc-project-thumb" />
        )}
        <StatusBadge project={project} />
      </div>
    </Link>
  );
}
