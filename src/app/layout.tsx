import type { Metadata } from 'next';

import { buildMetadata } from '@/lib/metadata';
import { siteConfig } from '@/site.config';
import {
  palettes,
  themeMode,
  resolvedDefaultMode,
  buildThemeVars,
  fontsHost,
  themeFonts,
  buildFontVars,
  googleFontsHref,
} from '@/theme.config';
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

// Baked SSR default `data-theme` (= resolvedDefaultMode, 'system'→'dark').
// LOAD-BEARING: it is the palette no-JS / pre-script paint uses, so it must never
// be dropped or the first paint is unstyled. The no-FOUC script rewrites it
// before body paint, so it does NOT flash for JS users. See plan decision 3.
const SSR_THEME: 'light' | 'dark' = resolvedDefaultMode;

// M2 fonts. On the `google` host we inject a runtime Google Fonts <link> and set
// `--font-*` straight from theme.json — a fork swaps typefaces by editing content
// alone. On the `self` host next/font supplies those vars via the <html>
// className below (byte-identical to pre-M2; zero external request). `family` is
// the source of truth for both — self-host still uses it for the fallback vars.
const IS_GOOGLE_FONTS = fontsHost === 'google';
const GOOGLE_FONTS_HREF = googleFontsHref(themeFonts);
const FONT_VARS_STYLE = `:root{${buildFontVars(themeFonts).join(';')}}`;

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Self-host: next/font's generated var-classes on <html>. Google-host: no
  // next/font classes (the vars come from FONT_VARS_STYLE + the <link> below).
  // The import is gated on the BUILD-TIME NEXT_PUBLIC_FONTS_HOST literal (mirrored
  // from theme.json in next.config.js): Next inlines it and eliminates this whole
  // branch on `google` builds, so next/font never runs and no self-hosted woff2
  // <link rel=preload> ships for a Google-fonts site. A plain runtime check
  // (fontsHost) would NOT be eliminated, so the preloads would leak.
  let htmlClassName: string | undefined;
  if (process.env.NEXT_PUBLIC_FONTS_HOST === 'self') {
    const { display, mono, body } = await import('./fonts');
    htmlClassName = `${display.variable} ${mono.variable} ${body.variable}`;
  }

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
        {IS_GOOGLE_FONTS && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="stylesheet" href={GOOGLE_FONTS_HREF} />
            <style dangerouslySetInnerHTML={{ __html: FONT_VARS_STYLE }} />
          </>
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
