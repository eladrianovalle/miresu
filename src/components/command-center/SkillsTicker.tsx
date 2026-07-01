import type { CSSProperties } from 'react';

// Endless skills "ticker tape" — a broadcast chyron under the hero feed. Pure
// CSS marquee, no JS: the track holds TWO identical sequences and scrolls
// translateX(0 → -50%) forever, so -50% (exactly one sequence width) wraps
// seamlessly. Duration is count-proportional (set as an inline var) so the crawl
// speed stays roughly constant as the list grows. Hover-freeze + reduced-motion
// live in the CSS (dossier.css). a11y: the first sequence is the real,
// semantic list (labeled for context); only the SECOND copy — which exists
// solely to make the marquee wrap seamlessly — is aria-hidden so AT reads the
// skills exactly once.
export function SkillsTicker({ items }: { items: string[] }) {
  if (!items?.length) return null;

  const duration = `${(items.length * 2.5).toFixed(1)}s`;

  return (
    <div className="cc-ticker">
      <div className="cc-ticker-track" style={{ '--ticker-duration': duration } as CSSProperties}>
        {[0, 1].map((copy) => (
          <ul
            className="cc-ticker-seq"
            key={copy}
            aria-label={copy === 0 ? 'Skills and focus areas' : undefined}
            aria-hidden={copy === 1 ? 'true' : undefined}
          >
            {items.map((skill, i) => (
              <li className="cc-ticker-item" key={`${copy}-${i}`}>
                {skill}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
