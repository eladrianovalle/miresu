import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NODE_ENV === 'production') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-primary-dark text-text-primary font-body [&_a]:no-underline tracking-normal [&_*]:tracking-normal">
      <header className="border-b border-surface-3/60 bg-surface-1/80 backdrop-blur-sm sticky top-0 z-50">
        <nav className="flex items-center gap-1 max-w-6xl mx-auto px-6 h-12">
          <Link
            href="/admin/"
            className="font-mono text-sm font-bold text-accent-secondary tracking-wider mr-4 hover:text-white transition-colors"
          >
            ORC:ADMIN
          </Link>
          <span className="w-px h-4 bg-surface-3 mr-3" />
          {[
            { href: '/admin/projects/games/', label: 'Games' },
            { href: '/admin/projects/client/', label: 'Client' },
            { href: '/admin/projects/personal/', label: 'Collabs' },
            { href: '/admin/consulting/', label: 'Consulting' },
            { href: '/admin/identity/', label: 'Identity' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-2.5 py-1 text-xs font-mono text-text-muted hover:text-text-primary hover:bg-surface-2 rounded transition-colors"
            >
              {label}
            </Link>
          ))}
          <span className="ml-auto px-2 py-0.5 text-[10px] font-mono text-accent-tertiary bg-accent-tertiary/10 rounded border border-accent-tertiary/20">
            DEV
          </span>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
