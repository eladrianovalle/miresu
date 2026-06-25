import Link from 'next/link';
import { readSingleton } from '@/lib/admin/file-ops';
import { getJsonSchemaWithAnnotations } from '@/lib/admin/schemas';
import { ContentForm } from '@/components/admin/ContentForm';

export default async function ConsultingEditPage() {
  const result = await readSingleton('consulting');
  const data = result.data as Record<string, unknown>;
  const schemaInfo = getJsonSchemaWithAnnotations('consulting');

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/"
          className="text-xs font-space-mono text-text-muted hover:text-accent-secondary transition-colors"
        >
          &larr; Dashboard
        </Link>
        <h1 className="text-xl font-syne font-bold text-text-primary">Consulting</h1>
      </div>
      <ContentForm
        initialData={data}
        jsonSchema={schemaInfo.jsonSchema}
        annotations={schemaInfo.annotations}
        saveEndpoint="/api/admin/consulting/"
        saveMethod="PUT"
      />
    </div>
  );
}
