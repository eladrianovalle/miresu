import Link from 'next/link';
import { readSingleton } from '@/lib/admin/file-ops';
import { getJsonSchemaWithAnnotations } from '@/lib/admin/schemas';
import { ContentForm } from '@/components/admin/ContentForm';

// Dev-only theme editor. Edits the whole palette (light + dark), fonts, default
// mode + toggle, and the optional skin knobs, then writes src/content/theme.json
// through the generic singleton save route. `.dev.tsx` keeps it out of the static
// export (see next.config.js pageExtensions handling).
export default async function ThemeEditPage() {
  const result = await readSingleton('theme');
  const data = result.data as Record<string, unknown>;
  const schemaInfo = getJsonSchemaWithAnnotations('theme');

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/"
          className="text-xs font-mono text-text-muted hover:text-accent-secondary transition-colors"
        >
          &larr; Dashboard
        </Link>
        <h1 className="text-xl font-display font-bold text-text-primary">Theme</h1>
      </div>
      <ContentForm
        initialData={data}
        jsonSchema={schemaInfo.jsonSchema}
        annotations={schemaInfo.annotations}
        saveEndpoint="/api/admin/singleton/theme/"
        saveMethod="PUT"
      />
    </div>
  );
}
