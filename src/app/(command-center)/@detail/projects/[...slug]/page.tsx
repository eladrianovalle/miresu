import { getSiteProjects, getProjectBySlug } from '@/lib/projects';
import { buildProjectMetadata, buildProjectJsonLd } from '@/lib/metadata';
import { ProjectDossier, MobileBack } from '@/components/command-center';
import { notFound } from 'next/navigation';
import '@/styles/command-center/dossier.css';

export async function generateStaticParams() {
  const projects = await getSiteProjects();
  return projects.map((p) => ({ slug: [p.slug] }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug[slug.length - 1]);
  if (!project) return {};
  return buildProjectMetadata(project);
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const projectSlug = slug[slug.length - 1];
  const project = await getProjectBySlug(projectSlug);

  if (!project) {
    notFound();
  }

  const jsonLd = buildProjectJsonLd(project);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MobileBack />
      <ProjectDossier project={project} />
    </>
  );
}
