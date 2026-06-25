import { getSiteProjects, getProjectBySlug } from '@/lib/projects';
import { buildProjectMetadata, buildProjectJsonLd, buildOrganizationJsonLd } from '@/lib/metadata';
import { CommandCenterShell, DirectoryPanel, ProjectDossier, MobileBack } from '@/components/command-center';
import { notFound } from 'next/navigation';
import '@/styles/command-center/dossier.css';

export async function generateStaticParams() {
  const projects = await getSiteProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  return buildProjectMetadata(project);
}

export default async function StandaloneProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const projectJsonLd = buildProjectJsonLd(project);
  const orgJsonLd = buildOrganizationJsonLd();

  return (
    <CommandCenterShell
      left={<DirectoryPanel />}
      right={
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(projectJsonLd) }}
          />
          <MobileBack />
          <ProjectDossier project={project} />
        </>
      }
      jsonLd={orgJsonLd}
    />
  );
}
