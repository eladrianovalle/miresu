import type { Project } from '@/lib/projects';
import { relationshipLabels } from '@/lib/site-labels';

const CATEGORY_ACCENT: Record<Project['category'], string> = {
  games: 'accent',
  client: 'accent-secondary',
  personal: 'accent-tertiary',
};

export function DossierMeta({ project }: { project: Project }) {
  const accent = CATEGORY_ACCENT[project.category];

  return (
    <div className="cc-dossier-meta">
      <div className="cc-meta-field">
        <span className="cc-meta-label">Role</span>
        <span className={`cc-meta-value ${accent}`}>{project.role}</span>
      </div>
      <div className="cc-meta-field">
        <span className="cc-meta-label">{relationshipLabels[project.relationship]}</span>
        <span className="cc-meta-value">{project.organization}</span>
      </div>
      <div className="cc-meta-field">
        <span className="cc-meta-label">Year</span>
        <span className="cc-meta-value">{project.year}</span>
      </div>
      <div className="cc-meta-field">
        <span className="cc-meta-label">Status</span>
        <span className="cc-meta-value">{project.status.replace(/-/g, ' ')}</span>
      </div>
      {project.category === 'games' && (
        <div className="cc-meta-field">
          <span className="cc-meta-label">Platforms</span>
          <span className="cc-meta-value">
            {project.platforms.join(', ')}
          </span>
        </div>
      )}
      {(project.stack?.length ?? 0) > 0 && (
        <div className="cc-meta-field cc-meta-stack">
          <span className="cc-meta-label">Stack</span>
          <span className="cc-meta-value">
            {project.stack!.map((tech) => (
              <span key={tech} className="cc-stack-tag">{tech}</span>
            ))}
          </span>
        </div>
      )}
    </div>
  );
}
