import Link from 'next/link';
import type { Identity } from '@/types/project-content';
import { siteConfig } from '@/site.config';
import { chrome } from '@/lib/site-labels';
import { ThemeToggle } from './ThemeToggle';

interface TopbarProps {
  identity: Identity;
}

export function Topbar({ identity }: TopbarProps) {
  const operatorHandle = identity.name.toLowerCase().replace(/\s+/g, '_');
  const availabilityStatus = identity.availability.status;

  return (
    <header className="cc-topbar">
      <div className="cc-topbar-left">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={siteConfig.logo}
          alt={siteConfig.brandName}
          className="cc-topbar-logo"
        />
        {/* Brand wordmark sits with the mark; alt="" — the icon already
            announces the brand, so this avoids a duplicate announcement. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={siteConfig.logotype}
          alt=""
          className="cc-topbar-logotype"
        />
      </div>

      {/* Center readout: operator handle (optional chrome) + live availability
          LED. The availability word + light always show; the "operator: //"
          prefix is gated by chrome.operator and drops on mobile. */}
      <div className="cc-topbar-center">
        {chrome.operator && (
          <span className="cc-topbar-operator">
            {`operator: ${operatorHandle} //`}
          </span>
        )}
        <span className="cc-topbar-availability">{availabilityStatus}</span>
        <span
          className="cc-status-dot"
          data-status={availabilityStatus}
          title={identity.availability.message ?? availabilityStatus}
        />
      </div>

      <div className="cc-topbar-right">
        {/* Theme toggle sits before Hire; renders null when the fork disables
            the toggle (ORC PUNK is dark-locked). Visible on mobile. */}
        <ThemeToggle />
        {/* Brand CTA (Hire) anchors the far right of the global chrome. */}
        <Link
          href="/consulting/"
          prefetch={true}
          className="cc-identity-cta cc-topbar-cta"
        >
          Hire
        </Link>
      </div>
    </header>
  );
}
