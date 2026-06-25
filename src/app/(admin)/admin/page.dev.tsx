import Link from 'next/link';
import { CONTENT_TYPES } from '@/lib/admin/schemas';
import { listProjectSlugs } from '@/lib/admin/file-ops';

const ACCENT_MAP: Record<string, string> = {
  'projects/games': 'border-magenta/40 hover:border-magenta/70 hover:shadow-[0_0_20px_rgba(227,23,210,0.1)]',
  'projects/client': 'border-turquoise/40 hover:border-turquoise/70 hover:shadow-[0_0_20px_rgba(5,237,229,0.1)]',
  'projects/personal': 'border-yellow/40 hover:border-yellow/70 hover:shadow-[0_0_20px_rgba(255,253,0,0.08)]',
  consulting: 'border-surface-3 hover:border-text-muted',
  identity: 'border-surface-3 hover:border-text-muted',
};

export default async function AdminDashboard() {
  const projectEntries = Object.entries(CONTENT_TYPES).filter(
    (pair): pair is [string, typeof CONTENT_TYPES[keyof typeof CONTENT_TYPES] & { kind: 'project' }] =>
      pair[1].kind === 'project',
  );
  const counts = await Promise.all(
    projectEntries.map(async ([key, entry]) => {
      const slugs = await listProjectSlugs(entry.category);
      return [key, slugs.length] as const;
    }),
  );
  const projectCounts: Record<string, number> = Object.fromEntries(counts);

  return (
    <div>
      <div className="mb-10">
        <p className="text-[10px] font-space-mono text-text-muted uppercase tracking-[0.2em] mb-1">
          Content Management
        </p>
        <h1 className="text-xl font-syne font-bold text-text-primary">
          Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(CONTENT_TYPES).map(([key, entry]) => {
          const href =
            entry.kind === 'project'
              ? `/admin/projects/${entry.category}/`
              : `/admin/${key}/`;

          return (
            <Link
              key={key}
              href={href}
              className={`group block p-5 rounded-lg border bg-surface-1/50 transition-all duration-200 ${ACCENT_MAP[key] ?? 'border-surface-3 hover:border-text-muted'}`}
            >
              <div>
                <span className="text-[10px] font-space-mono text-text-muted uppercase">
                  {entry.kind === 'project' ? 'Collection' : 'Singleton'}
                </span>
                <h2 className="text-sm font-semibold text-text-primary mt-0.5 group-hover:text-white transition-colors">
                  {entry.label}
                </h2>
              </div>
              {entry.kind === 'project' && (
                <p className="text-xs font-space-mono text-text-muted mt-3">
                  {projectCounts[key] ?? 0} {(projectCounts[key] ?? 0) === 1 ? 'project' : 'projects'}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-10">
        <Link
          href="/admin/projects/new/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-surface-2 border border-surface-3 text-sm font-space-mono text-text-secondary hover:text-turquoise hover:border-turquoise/40 transition-all duration-200"
        >
          <span className="text-turquoise">+</span>
          New Project
        </Link>
      </div>
    </div>
  );
}
