import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { withBasePath } from '@/lib/paths';
import { buildMetadata } from '@/lib/metadata';
import { siteConfig } from '@/site.config';

// Neutral privacy-policy template. A static portfolio site collects nothing by
// default — fill in or replace this copy if your fork adds analytics, forms, or
// third-party embeds. Contact and brand strings come from src/site.config.ts.

export const metadata: Metadata = buildMetadata({
  title: 'Privacy Policy',
  description: `How ${siteConfig.brandName} handles information on this site.`,
});

export default function PrivacyPage() {
  return (
    <main>
      <div className="container tablet">
        <Link
          href="/"
          className="logo-block glow-drop-shadow--yellow privacy-policy w-inline-block"
          aria-label="Back to homepage"
        >
          <Image
            src={withBasePath(siteConfig.logo)}
            alt={`${siteConfig.brandName} logo`}
            className="image-for-glow"
            width={200}
            height={60}
            style={{ height: 'auto' }}
          />
        </Link>
        <div className="flex-container w-container">
          <div className="body-paragraph tablet">
            <strong>Privacy Policy</strong>
            <br />
            <br />
            This website is a personal portfolio operated by {siteConfig.brandName}.
            It is a static site and does not, by default, collect personal
            information from visitors, set tracking cookies, or run advertising.
            <br />
            <br />
            <strong>Information Collection and Use</strong>
            <br />
            We do not ask you for personal information to browse this site. If you
            choose to contact us by email or a linked service, you share whatever
            information you include in that message; it is used only to respond to
            you.
            <br />
            <br />
            <strong>Hosting &amp; Server Logs</strong>
            <br />
            Like most websites, our hosting provider may automatically record
            standard server log data (such as IP address, browser type, and the
            pages requested) for security and operational purposes. Review your
            host&apos;s privacy policy for details on how that data is handled.
            <br />
            <br />
            <strong>Third-Party Links</strong>
            <br />
            This site may link to external sites (for example, social profiles or
            project pages) that we do not operate. We are not responsible for the
            content or privacy practices of those sites; review their policies
            before sharing information with them.
            <br />
            <br />
            <strong>Cookies</strong>
            <br />
            This site does not set tracking cookies. A small amount of data may be
            stored in your browser for preferences (such as muting interface
            sounds); this stays on your device and is not transmitted to us.
            <br />
            <br />
            <strong>Children&apos;s Privacy</strong>
            <br />
            This site is not directed at children under 13 and does not knowingly
            collect personal information from them.
            <br />
            <br />
            <strong>Changes to This Privacy Policy</strong>
            <br />
            We may update this policy from time to time. Changes are posted on this
            page and are effective when posted.
            <br />
            <br />
            <strong>Contact</strong>
            <br />
            Questions about this policy? Reach out via the contact details on the{' '}
            <Link href="/">home page</Link>.
          </div>
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: '2rem', opacity: 0.6, fontSize: '0.85rem' }}>
        &copy; {siteConfig.brandName} {new Date().getFullYear()} &middot;{' '}
        <Link href="/">Back to site</Link>
      </footer>
    </main>
  );
}
