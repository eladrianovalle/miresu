import Link from 'next/link';
import type { Identity } from '@/types/project-content';
import { chrome } from '@/lib/site-labels';

interface IdentityCardProps {
  identity: Identity;
}

export function IdentityCard({ identity }: IdentityCardProps) {
  return (
    <div className="cc-identity">
      {/*
        Structural split for the fork-your-own template: the company/brand chrome
        — logo, wordmark, and the business CTA (Hire → consulting) — lives in the
        global topbar. This card is the operator/individual: name, role, bio, and
        their own CTA below the bio (Resume → resume). Kept generic and
        config-driven so a fork reuses the brand-vs-operator split.
      */}

      {/* Name */}
      <h1 className="cc-identity-name">
        {identity.name}
      </h1>

      {/* Role */}
      <p className="cc-identity-role">
        {identity.role}
      </p>

      {/* Operator ID (optional stylized chrome) */}
      {chrome.showId && identity.id && (
        <p className="cc-identity-id">
          ID: {identity.id}
        </p>
      )}

      {/* Bio */}
      <p className="cc-identity-bio">
        {identity.bio}
      </p>

      {/* Operator CTA: resume sits below the operator's bio */}
      <div className="cc-identity-cta-row">
        <Link href="/resume/" className="cc-identity-cta cc-identity-cta--secondary">
          CV <span className="cc-cta-arrow">&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
