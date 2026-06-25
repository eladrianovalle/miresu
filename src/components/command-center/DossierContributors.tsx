export function DossierContributors({
  contributors,
}: {
  contributors: { name: string; role: string; url?: string }[];
}) {
  if (contributors.length < 2) return null;

  return (
    <div className="cc-dossier-section">
      <div className="cc-section-label">Contributors</div>
      <div className="cc-contributors-list">
        {contributors.map((c) => (
          <div key={c.name} className="cc-contributor-row">
            {c.url ? (
              <a
                href={c.url}
                target="_blank"
                rel="noopener"
                className="cc-contributor-name"
              >
                {c.name}
              </a>
            ) : (
              <span className="cc-contributor-name">{c.name}</span>
            )}
            <span className="cc-contributor-role">{c.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
