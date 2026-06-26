import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PROJECT_CATEGORIES, type ProjectCategoryKey } from '@/lib/admin/schemas';
import { readProject } from '@/lib/admin/file-ops';
import { getJsonSchemaWithAnnotations } from '@/lib/admin/schemas';
import { ContentForm } from '@/components/admin/ContentForm';

export default async function ProjectEditPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;

  if (!PROJECT_CATEGORIES.includes(category as ProjectCategoryKey)) {
    notFound();
  }

  const cat = category as ProjectCategoryKey;

  let projectData: Record<string, unknown>;
  try {
    const result = await readProject(cat, slug);
    projectData = result.data as Record<string, unknown>;
  } catch {
    notFound();
  }

  const schemaInfo = getJsonSchemaWithAnnotations(`projects/${cat}`);

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/admin/projects/${category}/`}
          className="text-xs font-mono text-text-muted hover:text-accent-secondary transition-colors"
        >
          &larr; {schemaInfo.label}
        </Link>
        <h1 className="text-xl font-display font-bold text-text-primary">{slug}</h1>
      </div>
      <ContentForm
        initialData={projectData}
        jsonSchema={schemaInfo.jsonSchema}
        annotations={schemaInfo.annotations}
        saveEndpoint={`/api/admin/projects/${category}/${slug}/`}
        saveMethod="PUT"
      />
    </div>
  );
}
