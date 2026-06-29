# Theme customization — colors, fonts, light/dark (admin-editable)

> Status: **planned** (post-MVI-0), **engineering-reviewed**. Scoping doc for the
> theming system deferred in `docs/RESUME-BUILDER-PHASE-B.md` ("Theming system /
> presets beyond the single neutral default"). No tickets yet — see **Sequencing &
> tickets**.
>
> **Studio eng review (2026-06-28):** APPROVED with conditions (web_engineering,
> web_test_engineer, web_qa). The conditions below are folded into the milestones —
> **dual color vars** (not channels-everywhere), a **CI-enforceable verification
> gate** (the "21 visual baselines" alone is not a real gate), and **runtime-font
> guardrails**. Run: `.studio/output/studio/run_studio_20260628_205202/`.

## Context

miresu is a fork-your-own portfolio engine. Today a fork restyles by hand-editing
**`.ts` config files** — `src/theme.config.ts` (11 color tokens) and
`src/app/fonts.ts` (3 `next/font/google` families). Those flow into
`tailwind.config.ts` + a `:root{--cc-color-*}` injection in `src/app/layout.tsx`,
then into CSS vars consumed everywhere. Two gaps block "alter a few knobs →
meaningfully different views":

1. **Not editable from the product.** The dev-only admin panel (Zod-schema-driven
   `ContentForm`/`SchemaField`, atomic JSON writes) only edits `src/content/**`
   JSON — it cannot write `.ts` config. Colors/fonts require code edits.
2. **No light/dark.** A single fixed dark palette — no `prefers-color-scheme`,
   toggle, or second palette.

Intended outcome: a fork picks palette (light + dark), fonts, and default mode
from an **admin theme editor**, persisted to one JSON file the static build
consumes — and the published site gets a working light/dark toggle.

**Locked decisions:** light/dark = visitor toggle + configured default (default
`system`, no-FOUC); fonts = runtime Google Fonts `<link>` (dynamic, no codegen);
font picker = curated suggestions + free-text "type any family" (no API key).
**orcpunk stays orcpunk** by filling its own `theme.json` (neon palette,
Syne/Space Mono/IBM Plex, dark default, toggle off) — reproducing today's look
exactly is the back-compat gate.

This is an **engine feature**; downstream forks (e.g. orcpunk) inherit it via
`git merge upstream/main` and supply their values. The heavier "cyberpunk vs
neutral" character (neon glows, scanlines) stays in the per-fork **CSS skin
overlay** (`src/styles/command-center/*.css`) — out of scope. This covers
**palette + fonts + mode**.

## Architecture: the source-of-truth shift

Move the theme source of truth from `.ts` config → **`src/content/theme.json`**
(admin-editable, Zod-validated, JSON-import-able at build). Shape (`ThemeSchema`):

```jsonc
{
  "defaultMode": "system",        // "system" | "light" | "dark"
  "enableToggle": true,           // forks with one palette set false
  "palettes": {
    "dark":  { "accent": "...", "accentSecondary": "...", "accentTertiary": "...",
               "primaryDark": "...", "surface1": "...", "surface2": "...",
               "surface3": "...", "border": "...", "ivory": "...",
               "textPrimary": "...", "textSecondary": "...", "textMuted": "..." },
    "light": { "...same 11 tokens..." : "..." }
  },
  "fonts": {
    "host": "google",                       // "google" (runtime <link>) | "self" (build-time)
    "display": { "family": "...", "weights": ["400","700"] },
    "mono":    { "family": "...", "weights": ["400","500"] },
    "body":    { "family": "...", "weights": ["400","600"] }
  }
}
```

Colors are **stored as hex** (the `ColorField` widget emits hex); the RGB channel
form is **derived at injection time**, not stored.

The CSS-var contract (`--cc-color-*`, `--font-*` / `--cc-font-*`) is **unchanged**
— only *where the values come from* changes. The engine/overlay boundary moves
from `theme.config.ts` + `fonts.ts` → **`theme.json` = "ours" (per-fork)**; the
pipeline files stay engine-owned (update `docs/UPSTREAM-SYNC.md` keep-ours table).

Two pipeline changes make values runtime-swappable per mode:

- **`tailwind.config.ts` — DUAL VARS** (per the eng review). Tailwind's `/opacity`
  utilities can't consume a hex CSS var, and the codebase has **118** such usages
  (`bg-accent/20`, `via-accent/20`, …). So layout injects **both** a hex
  `--cc-color-*` (consumed by the **137** bare `var(--cc-color-*)` skin-CSS usages —
  unchanged) **and** a parallel channel `--cc-color-*-rgb` (e.g. `227 23 210`).
  Tailwind tokens reference `rgb(var(--cc-color-x-rgb) / <alpha-value>)`, so every
  opacity utility keeps working with **zero skin-CSS churn**. `next build` no longer
  needs palette values; the build-time resume **PDF** uses its own `@react-pdf`
  styles → unaffected.
- **`src/app/layout.tsx`**: read `theme.json`, inject `:root[data-theme="dark"]{…}`
  and `:root[data-theme="light"]{…}` blocks (each emitting hex + `*-rgb`) +
  `color-scheme`, the Google Fonts `<link>`(s) (when `fonts.host:"google"`), and a
  tiny **no-FOUC inline script** that sets `data-theme` on `<html>` from
  `localStorage → prefers-color-scheme → defaultMode` before paint. `<html>` gets
  `suppressHydrationWarning` (the script mutates `data-theme` pre-hydration).

`theme.config.ts` becomes a thin **typed reader** over `theme.json` (back-compat);
`fonts.ts` is **retired** (next/font → `<link>`), with system-font fallbacks in
`--cc-font-*` for no-network/FOUT.

## Milestones & deliverables

### M0 — Theme model + var-based pipeline + CI gate (foundation, no UI)
- `ThemeSchema` (`src/types/`); ship neutral default `src/content/theme.json`.
- **Dual vars:** `tailwind.config.ts` tokens → `rgb(var(--cc-color-*-rgb) /
  <alpha-value>)`; `layout.tsx` injects both hex + `*-rgb` per palette + `color-scheme`.
  `theme.config.ts` → typed reader. Add `theme.json` to `validate:content`.
- **Stand up the CI verification gate** (replaces the unenforceable visual-only
  gate): computed-style + behavioral Playwright assertions in the existing e2e/a11y
  CI jobs — assert the `--cc-color-*`/`--cc-font-*` token contract on `dist-staging`.
- **Deliverable:** theming flows from JSON; dark default renders identically (all
  118 opacity utilities intact); `build:staging` + the new CI gate pass. *No visible
  change yet.*

### M1 — Light/dark runtime
- No-FOUC inline script + `data-theme` on `<html>`; `enableToggle`/`defaultMode`
  knobs; system-pref default; `prefers-color-scheme` honored first visit.
- A mode **toggle control** in the chrome (topbar right, near Hire) — client
  component, persists to `localStorage`, a11y + reduced-motion respected; hidden
  when `enableToggle:false`.
- **Coverage:** toggle / persistence / no-FOUC asserted by the CI behavioral
  Playwright tests from M0 (not visual baselines).
- **Deliverable:** working, persistent, flash-free light/dark on the static site.

### M2 — Fonts via theme.json + Google `<link>`
- Retire `fonts.ts`; when `fonts.host:"google"` inject Google Fonts `<link>` from
  `theme.json.fonts` (**with `preconnect` + `display=swap`**); set `--font-*` /
  `--cc-font-*` from the families with **tested local fallback stacks**. Honor
  `fonts.host:"self"` as a build-time self-host escape hatch.
- **Guardrails (eng review):** a CI check asserts the chosen font origin in
  `dist-staging` (no surprise external origin); this milestone **owns a deliberate
  visual-baseline rebake** (retiring `next/font` shifts glyph pixels — baselines do
  NOT stay green across M2 by design).
- **Deliverable:** changing families in `theme.json` swaps display/mono/body on
  the live site and in static export.

### M3 — Admin theme editor
- Register `theme` singleton in `src/lib/admin/schemas.ts` `CONTENT_TYPES`; new
  `src/app/(admin)/admin/theme/page.dev.tsx` reusing `ContentForm`; reuse the
  generic singleton API route + `writeContentFile` atomic write.
- Two custom widgets in `src/components/admin/fields/`, dispatched in
  `SchemaField.tsx`: **`ColorField`** (`format:'color'` → `<input type=color>` +
  hex) and **`FontField`** (combobox: ~40 curated Google families + free-text).
  Both palettes editable.
- **Deliverable:** edit colors (light+dark), fonts, mode, toggle in `/admin/theme/`
  → `theme.json` written → dev site reflects on reload.

### M4 — Presets, orcpunk migration, docs
- 2–3 bundled presets (`src/content/theme-presets/*.json`) + one-click "apply
  preset" — realizes "few knobs → very different views."
- **orcpunk migration (back-compat gate):** populate orcpunk `theme.json` (neon +
  Syne/Space Mono/IBM Plex + `defaultMode:"dark"` + `enableToggle:false` +
  **`fonts.host:"self"`** to preserve orcpunk's current self-hosted network/privacy
  profile); drop orcpunk's `theme.config.ts`/`fonts.ts` overrides. **Acceptance:
  the M0 CI token-contract gate passes** + a one-time visual-baseline rebake (fonts
  path changed) reviewed to confirm only intended glyph shifts.
- Rewrite README **§ Theme**, update `CLAUDE.md` + `docs/UPSTREAM-SYNC.md`.
- **Deliverable:** presets + a pixel-identical migrated orcpunk + accurate docs.

## Critical files

- **New:** `src/types/` (ThemeSchema), `src/content/theme.json`,
  `src/app/(admin)/admin/theme/page.dev.tsx`,
  `src/components/admin/fields/ColorField.tsx` + `FontField.tsx`,
  `src/content/theme-presets/*.json`, a curated-fonts list module.
- **Modified (engine):** `src/app/layout.tsx`, `tailwind.config.ts`,
  `src/theme.config.ts` (→ reader), `src/styles/command-center/variables.css`,
  `src/components/admin/SchemaField.tsx`, `src/lib/admin/schemas.ts`,
  `validate:content`.
- **Retired:** `src/app/fonts.ts`.
- **Reused:** `ContentForm`/`SchemaField` + field widgets, `writeContentFile`
  (`src/lib/admin/file-ops.ts`), the generic singleton API route, `assertDevOnly`
  dev-gate, the existing `--cc-color-*` / `--cc-font-*` CSS-var contract.

## Verification

- **Per milestone:** `lint`, `build` + `build:staging` (static export must pass),
  `validate:content`.
- **Primary gate (CI, all milestones):** computed-style + behavioral Playwright
  assertions in the e2e/a11y jobs — token contract (`--cc-color-*`/`--cc-font-*`)
  on `dist-staging`, light/dark toggle, persistence, no-FOUC, font fallback, admin
  atomic write. **This is the mergeable gate** (visual baselines are local-only and
  not a CI gate today).
- **M0 parity:** dark default unchanged; diff `dist-staging` token values; all 118
  opacity utilities render.
- **M1:** toggle flips/persists/no-flash (throttled CPU), system-pref honored,
  keyboard-operable; `test:a11y`.
- **M2:** distinct family → `<link>` + `preconnect` emitted (or self-host when
  `fonts.host:"self"`) + font applied in `dist-staging`; CI origin check; deliberate
  baseline rebake.
- **M3:** edit a color + font + mode in `/admin/theme/` → atomic write + reflected.
- **M4 (orcpunk gate):** the CI token-contract gate passes; reviewed baseline
  rebake; `build` passes.
- **Engine sync:** engine `.tsx`/pipeline files byte-identical miresu↔orcpunk;
  only `theme.json` (+ retired overrides) differ.

## Sequencing & tickets

Per-milestone PRs into `main` (`feat(theme):` scopes, squash/merge). M0→M3 are
miresu-only; **M4 spans both repos** (orcpunk migration PR after the engine merges
+ a downstream `git merge upstream/main`). Recommend one GitHub issue per
milestone (M0–M4) on the miresu board.
