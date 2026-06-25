import type { Project } from '@/lib/projects';

export function DossierLinks({ project }: { project: Project }) {
  if (!project.links || project.links.length === 0) return null;

  return (
    <div className="cc-dossier-section">
      <div className="cc-section-label">Links</div>
      <div className="cc-dossier-links">
        {project.links.map((link, i) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener"
            className={
              i === 0 ? 'cc-dossier-link primary' : 'cc-dossier-link'
            }
          >
            {link.label} ↗
          </a>
        ))}
      </div>
    </div>
  );
}
