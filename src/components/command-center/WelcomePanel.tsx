import { chrome } from '@/lib/site-labels';

export function WelcomePanel() {
  return (
    <div className="cc-welcome">
      {/* Stylized terminal-prompt glyph — opt-in chrome (same flag as the
          operator eyebrow/handle); the neutral base omits it. */}
      {chrome.operator && (
        <span className="cc-welcome-cursor" aria-hidden="true">&lt;</span>
      )}
      <p className="cc-welcome-primary">Select a project from the directory</p>
      <p className="cc-welcome-secondary">or explore the command center</p>
    </div>
  );
}
