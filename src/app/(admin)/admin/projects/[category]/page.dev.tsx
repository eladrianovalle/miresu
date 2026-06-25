import Link from 'next/link';
import { PROJECT_CATEGORIES, CONTENT_TYPES, type ProjectCategoryKey } from '@/lib/admin/schemas';
import { listProjectSlugs, readProject } from '@/lib/admin/file-ops';
import { notFound } from 'next/navigation';

export default async function ProjectListPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  if (!PROJECT_CATEGORIES.includes(category as ProjectCategoryKey)) {
    notFound();
  }

  const cat = category as ProjectCategoryKey;
  const entry = CONTENT_TYPES[`projects/${cat}`];
  const slugs = await listProjectSlugs(cat);

  const items = await Promise.all(
    slugs.map(async (slug) => {
      try {
        const result = await readProject(cat, slug);
        const data = result.data as Record<string, unknown>;
        return {
          slug,
          title: data.title as string | undefined,
          draft: data.draft as boolean | undefined,
          year: data.year as number | undefined,
        };
      } catch {
        return { slug };
      }
    }),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/"
            className="text-xs font-space-mono text-text-muted hover:text-accent-secondary transition-colors"
          >
            &larr; Dashboard
          </Link>
          <h1 className="text-xl font-syne font-bold text-text-primary">{entry.label}</h1>
          <span className="text-xs font-space-mono text-text-muted bg-surface-2 px-2 py-0.5 rounded">
            {slugs.length}
          </span>
        </div>
        <Link
          href="/admin/projects/new/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-surface-3 text-xs font-space-mono text-text-muted hover:text-accent-secondary hover:border-accent-secondary/40 transition-all"
        >
          <span className="text-accent-secondary">+</span> New
        </Link>
      </div>
      <ul className="space-y-1">
        {items.map(({ slug, title, draft, year }) => (
          <li key={slug}>
            <Link
              href={`/admin/projects/${category}/${slug}/`}
              className="group flex items-center gap-4 p-3.5 rounded-lg border border-transparent hover:border-surface-3 hover:bg-surface-1/50 transition-all"
            >
              <span className="font-space-mono text-sm text-text-secondary group-hover:text-accent-secondary transition-colors min-w-[140px]">
                {slug}
              </span>
              {title && (
                <span className="text-sm text-text-muted group-hover:text-text-primary transition-colors truncate">
                  {title}
                </span>
              )}
              <span className="ml-auto flex items-center gap-2">
                {year && (
                  <span className="text-[10px] font-space-mono text-text-muted/60">{year}</span>
                )}
                {draft && (
                  <span className="text-[10px] font-space-mono text-accent-tertiary bg-accent-tertiary/10 px-1.5 py-0.5 rounded">
                    DRAFT
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-text-muted text-sm p-4 font-space-mono">No projects in this category.</li>
        )}
      </ul>
    </div>
  );
}
