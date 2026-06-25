import type { Identity } from '@/types/project-content';
import { siteConfig } from '@/site.config';

interface CommandFooterProps {
  identity: Identity;
}

export function CommandFooter({ identity }: CommandFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="cc-footer">
      <span>&copy; {siteConfig.brandName} {identity.established}&mdash;{currentYear}</span>
      {identity.location && <span>{identity.location}</span>}
      <a href={`mailto:${identity.email}`}>{identity.email}</a>
    </footer>
  );
}
