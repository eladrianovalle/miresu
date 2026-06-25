import type { Identity } from '@/types/project-content';
import { siteConfig } from '@/site.config';
import { chrome } from '@/lib/site-labels';

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
        {chrome.operator && (
          <>
            <span className="cc-topbar-divider" />
            <span className="cc-topbar-operator">
              operator: {operatorHandle}
            </span>
          </>
        )}
      </div>

      <div className="cc-topbar-right">
        <div className="cc-topbar-status">
          <span className="cc-topbar-status-label">{availabilityStatus}</span>
          <span
            className="cc-status-dot"
            data-status={availabilityStatus}
            title={identity.availability.message ?? availabilityStatus}
          />
        </div>
      </div>
    </header>
  );
}
