import Link from 'next/link';
import type { Identity } from '@/types/project-content';
import { siteConfig } from '@/site.config';

interface IdentityCardProps {
  identity: Identity;
}

export function IdentityCard({ identity }: IdentityCardProps) {
  return (
    <div className="cc-identity">
      {/*
        Structural split for the fork-your-own template: the company/brand owns
        the top row — logo + its business CTA (Hire → consulting) — while the
        operator/individual owns a CTA below their bio (Resume → resume). Kept
        generic and config-driven so a fork reuses the brand-vs-operator split.
      */}

      {/* Brand row: company logotype + company CTA (Hire) */}
      <div className="cc-identity-brand-row">
        <div className="cc-identity-logotype">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={siteConfig.logotype}
            alt={siteConfig.brandName}
            className="cc-logotype-img"
          />
        </div>
        <Link
          href="/consulting/"
          prefetch={true}
          className="cc-identity-cta cc-identity-cta--brand"
        >
          Hire <span className="cc-cta-arrow">&rarr;</span>
        </Link>
      </div>

      {/* Operator label */}
      <p className="cc-identity-operator-label">
        operator // <span>{identity.availability.status === 'available' ? 'active' : identity.availability.status}</span>
      </p>

      {/* Name */}
      <h1 className="cc-identity-name">
        {identity.name}
      </h1>

      {/* Role */}
      <p className="cc-identity-role">
        {identity.role}
      </p>

      {/* Operator ID */}
      <p className="cc-identity-id">
        ID: {identity.id}
      </p>

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
