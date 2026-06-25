import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readSingleton } from '@/lib/admin/file-ops';
import { getJsonSchemaWithAnnotations, isSingletonKey, CONTENT_TYPES } from '@/lib/admin/schemas';
import { ContentForm } from '@/components/admin/ContentForm';

// Generic singleton editor. Static sibling routes (consulting/, identity/,
// projects/) take precedence; this dynamic segment serves the registry-driven
// singletons (e.g. the résumé singletons) with no per-singleton page file.
export default async function SingletonEditPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  if (!isSingletonKey(key)) notFound();

  const result = await readSingleton(key);
  const data = result.data as Record<string, unknown>;
  const schemaInfo = getJsonSchemaWithAnnotations(key);

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/"
          className="text-xs font-space-mono text-text-muted hover:text-accent-secondary transition-colors"
        >
          &larr; Dashboard
        </Link>
        <h1 className="text-xl font-syne font-bold text-text-primary">
          {CONTENT_TYPES[key].label}
        </h1>
      </div>
      <ContentForm
        initialData={data}
        jsonSchema={schemaInfo.jsonSchema}
        annotations={schemaInfo.annotations}
        saveEndpoint={`/api/admin/singleton/${key}/`}
        saveMethod="PUT"
      />
    </div>
  );
}
