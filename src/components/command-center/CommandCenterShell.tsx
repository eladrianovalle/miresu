import { getIdentity } from '@/lib/projects';
import { SkipLink, Topbar, SplitPanel, CommandFooter, AudioEffects } from '@/components/command-center';
import '@/styles/command-center/variables.css';
import '@/styles/command-center/layout.css';
import '@/styles/command-center/accessibility.css';
import '@/styles/command-center/cursor.css';
import '@/styles/command-center/light.css';

interface CommandCenterShellProps {
  left: React.ReactNode;
  right: React.ReactNode;
  jsonLd?: Record<string, unknown>;
}

export async function CommandCenterShell({ left, right, jsonLd }: CommandCenterShellProps) {
  const identity = await getIdentity();

  return (
    <div className="cc-shell">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <SkipLink />
      <Topbar identity={identity} />
      <SplitPanel left={left} right={right} />
      <CommandFooter identity={identity} />
      <AudioEffects />
    </div>
  );
}
