import Link from 'next/link';
import type { Identity } from '@/types/project-content';
import { siteConfig } from '@/site.config';

interface MobileFooterProps {
  identity: Identity;
}

export function MobileFooter({ identity }: MobileFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="cc-mobile-footer">
      <div className="cc-mobile-footer-brand">
        {siteConfig.brandName} &middot; {identity.established}&ndash;{currentYear}
      </div>
      <div className="cc-mobile-footer-links">
        {identity.socialLinks.map((link) => (
          <a key={link.url} href={link.url} target="_blank" rel="noopener">
            {link.label ?? link.platform}
          </a>
        ))}
      </div>
      <a className="cc-mobile-footer-email" href={`mailto:${identity.email}`}>
        {identity.email}
      </a>
      <Link className="cc-mobile-footer-cta" href="/consulting/">
        Hire →
      </Link>
    </footer>
  );
}
