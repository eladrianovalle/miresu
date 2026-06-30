import type { Metadata } from 'next';
import { display, mono, body } from './fonts';

import { buildMetadata } from '@/lib/metadata';
import { siteConfig } from '@/site.config';
import { palettes, themeMode, buildThemeVars } from '@/theme.config';
import './globals.css';

// Inject BOTH palettes as `:root[data-theme="dark|light"]` CSS variables, so the
// command-center stylesheets stay theme-agnostic and a fork recolors via content
// (theme.json) only. The runtime `data-theme` attribute (baked SSR default below,
// rewritten pre-paint by the no-FOUC script) selects which block paints. Each
// color emits both a hex var (consumed by bare skin-CSS var() usages) and an
// `-rgb` channel var (referenced by Tailwind tokens so opacity utilities keep
// working). `color-scheme` per block keeps form controls + scrollbars in sync.
const DARK_VARS = buildThemeVars(palettes.dark).join(';');
const LIGHT_VARS = buildThemeVars(palettes.light).join(';');
const THEME_STYLE =
  `:root[data-theme="dark"]{${DARK_VARS};color-scheme:dark}` +
  `:root[data-theme="light"]{${LIGHT_VARS};color-scheme:light}`;

// Baked SSR default `data-theme` — the resolved `defaultMode` ('system'→'dark').
// LOAD-BEARING: it is the palette no-JS / pre-script paint uses, so it must never
// be dropped or the first paint is unstyled. The no-FOUC script rewrites it
// before body paint, so it does NOT flash for JS users. See plan decision 3.
const SSR_THEME: 'light' | 'dark' =
  themeMode.defaultMode === 'system' ? 'dark' : themeMode.defaultMode;

// No-FOUC inline script — runs in <head> BEFORE paint. Mirrors resolveMode()
// from theme.config with the build-time knobs baked in (kept byte-stable for a
// future CSP hash/nonce). Read-once (no 'change' listener); double try/catch'd
// because localStorage can throw (private mode). `p` is tri-state: undefined
// when matchMedia is absent → 'dark'. Keep in lockstep with resolveMode.
const NO_FOUC_SCRIPT =
  `(function(){try{var d=${JSON.stringify(themeMode.defaultMode)},e=${JSON.stringify(themeMode.enableToggle)},s=null;try{s=localStorage.getItem('theme')}catch(_){}var m=window.matchMedia,p=m?m('(prefers-color-scheme: dark)').matches:undefined,y=p===false?'light':'dark',t;if(!e){t=d==='system'?y:d}else if(s==='light'||s==='dark'){t=s}else{t=d==='system'?y:d}document.documentElement.dataset.theme=t}catch(_){}})();`;

export const metadata: Metadata = {
  ...buildMetadata(),
  icons: {
    icon: siteConfig.favicon,
    apple: siteConfig.favicon,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const htmlClassName = `${display.variable} ${mono.variable} ${body.variable}`;

  return (
    // suppressHydrationWarning: the no-FOUC script mutates data-theme pre-
    // hydration, so the server-baked attr can legitimately differ from the
    // client's choice. Scoped to <html> only.
    <html
      lang="en"
      className={htmlClassName}
      data-theme={SSR_THEME}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FOUC_SCRIPT }} />
        <style dangerouslySetInnerHTML={{ __html: THEME_STYLE }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
