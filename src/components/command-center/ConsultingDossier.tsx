import type { ConsultingContent } from '@/types/project-content';
import { ConsultingTitleGroup } from './ConsultingTitleGroup';

export function ConsultingDossier({ data }: { data: ConsultingContent }) {
  return (
    <div>
      {/* Hero — gradient treatment (no image for consulting) */}
      <div className="cc-consulting-hero" />

      <div className="cc-dossier-content">
        {/* Header */}
        <div className="cc-dossier-header">
          <ConsultingTitleGroup tagline={data.tagline} headline={data.headline} />
          <p className="cc-dossier-subtitle">{data.subheadline}</p>
        </div>

        {/* Meta */}
        <div className="cc-dossier-meta">
          <div className="cc-meta-field">
            <span className="cc-meta-label">Status</span>
            <span className="cc-meta-value accent-yellow">Available</span>
          </div>
          <div className="cc-meta-field">
            <span className="cc-meta-label">Based In</span>
            <span className="cc-meta-value">Brooklyn, NY</span>
          </div>
          <div className="cc-meta-field">
            <span className="cc-meta-label">Since</span>
            <span className="cc-meta-value">2017</span>
          </div>
        </div>

        {/* What I Do */}
        <div className="cc-dossier-section">
          <div className="cc-section-label">{data.whatIDo.overline}</div>
          <p className="cc-dossier-description">{data.whatIDo.body}</p>
          <ul className="cc-consulting-skills">
            {data.whatIDo.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </div>

        {/* Engagement Tiers */}
        <div className="cc-dossier-section">
          <div className="cc-section-label">{data.engagements.overline}</div>
          <div className="cc-consulting-tiers">
            {data.engagements.tiers.map((tier) => (
              <div
                key={tier.id}
                className={`cc-consulting-tier accent-${tier.accentColor}`}
              >
                <h3 className="cc-tier-title">{tier.title}</h3>
                <p className="cc-tier-description">{tier.description}</p>
                <ul className="cc-tier-bullets">
                  {tier.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
                <p className="cc-tier-pricing">{tier.pricing}</p>
              </div>
            ))}
          </div>
          <p className="cc-consulting-footnote">{data.engagements.footnote}</p>
        </div>

        {/* How I Work */}
        <div className="cc-dossier-section">
          <div className="cc-section-label">{data.howIWork.overline}</div>
          <p className="cc-dossier-description">{data.howIWork.body}</p>
          <div className="cc-consulting-values">
            {data.howIWork.values.map((v) => (
              <div key={v.title} className="cc-value-item">
                <span className="cc-value-title">{v.title}</span>
                {v.description && (
                  <span className="cc-value-desc">{v.description}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Client Fit */}
        <div className="cc-dossier-section">
          <div className="cc-section-label">{data.clientFit.overline}</div>
          <div className="cc-contributors-list">
            {data.clientFit.pastClients.map((client) => (
              <div key={client} className="cc-contributor-row">
                <span className="cc-contributor-name">{client}</span>
                <span className="cc-contributor-role">past client</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        {data.testimonials && data.testimonials.length > 0 && (
          <div className="cc-dossier-section">
            <div className="cc-section-label">Testimonials</div>
            {data.testimonials.map((t) => (
              <div key={t.author} className="cc-testimonial">
                <p className="cc-testimonial-text">&ldquo;{t.quote}&rdquo;</p>
                <p className="cc-testimonial-author">
                  &mdash; {t.author}, {t.company}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div className="cc-dossier-section">
          <div className="cc-section-label">Get In Touch</div>
          <div className="cc-dossier-links">
            <a
              href={data.ctaPrimary.href}
              target="_blank"
              rel="noopener"
              className="cc-dossier-link primary"
            >
              {data.ctaPrimary.label} ↗
            </a>
            <a
              href={data.ctaSecondary.href}
              className="cc-dossier-link"
            >
              {data.ctaSecondary.label} ↗
            </a>
          </div>
        </div>

        {/* Closing */}
        <div className="cc-dossier-section">
          <p className="cc-dossier-description cc-consulting-closing">
            {data.closing.body}
          </p>
        </div>
      </div>
    </div>
  );
}
