import type { Project } from '@/lib/projects';
import { DossierViewer } from './DossierViewer';

export function ProjectDossier({ project }: { project: Project }) {
  return (
    <article className="cc-project-dossier" aria-label={project.title}>
      <DossierViewer project={project} />
    </article>
  );
}
