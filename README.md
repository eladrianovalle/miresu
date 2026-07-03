# miresu

**Fork your own portfolio site + an aligned resume from one content store.**

**Live demo:** <https://eladrianovalle.github.io/miresu/> (the fictional "Sam Rivera" seed content, deployed by the included Pages workflow).

miresu is a Next.js template for people who live in GitHub. You get a portfolio
site *and* a resume that never drifts out of sync — because the resume is just a
second rendering of the same content you already edit for the site. Edit once,
both surfaces update.

## What you get

- **A portfolio site** — a split-panel "command center" layout with a filterable
  project index and per-project detail pages.
- **An on-site resume** at `/resume/` — a clean HTML view projected from your
  content.
- **A build-time ATS-friendly PDF** — generated into `public/assets/resume/resume.pdf`
  during the build (single column, real text, no images — parses cleanly in
  applicant-tracking systems).
- **A JSON Resume export** — `public/assets/resume/resume.json` in the
  [JSON Resume](https://jsonresume.org) open format, for interop with other tools.
- **A dev-only `/admin` editor** — edit all of your content (projects, identity,
  consulting, and the resume sections) through forms auto-generated from the
  content schemas. Disabled in production.
- **Static export** — deploys as pure static files (no server). A one-command
  [GitHub Pages deploy](#deploy-to-github-pages) is included.

It is **one content model, two views.** A project can surface on the site, on the
resume, on both, or neither (via each entry's `surfaces` toggle), so the resume
can carry experience that has no showcase piece — and vice versa.

## Quick start

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>. The site, the resume (`/resume/`), and the
editor (`/admin/`) are all live in dev.

## Configure your site

Edit **`src/site.config.ts`** once: your name, brand name, canonical URL,
tagline, social handles, and logo/favicon paths. Everything that needs your
identity (page titles, social cards, the resume PDF/JSON links, the chrome)
reads from there.

The same file also holds two optional knobs: **`labels`** renames the project
taxonomy for display (the `Projects` / `Clients` / `Personal` filter tabs and the
dossier relationship labels — the underlying category keys stay the same), and
**`chrome`** toggles the stylized identity flourishes (`operator` — the topbar
`operator: <handle> //` readout prefix; `showId` — the `ID:` line in the
identity card), both off in the neutral default. Omit either to keep the
defaults.

Replace the placeholder brand assets in `public/assets/icons/` (`logo.svg`,
`logotype.svg`) and `public/assets/images/` (`favicon.png`, `og-default.svg`)
with your own.

## Edit your content

All site content lives in `src/content/` as JSON, validated by Zod schemas
(`src/types/project-content.ts`). Two ways to edit it:

- **Via the editor:** run `npm run dev` and go to `/admin/`. Forms are generated
  from the schemas; saves write the JSON files atomically.
- **Directly:** edit the JSON files. To add a project, duplicate an existing file
  in the relevant category (`src/content/projects/{games,client,personal}/`),
  update the fields, and run `npm run validate:content`.

Content pieces:

- `src/content/identity.json` — your name, role, bio, social links, availability.
- `src/content/consulting.json` — the "work with me" / hire page.
- `src/content/projects/**` — your projects, by category.
- `src/content/resume/header.json` — resume-only contact details (e.g. phone).
- `src/content/resume/skills.json` — your skills taxonomy.
- `src/content/resume/education.json` — your education history.
- `src/content/resume/projects.json` — curated resume highlights (each references
  a real project `slug`).

The seed content ships as a fictional person ("Sam Rivera") so you can see every
surface working before you replace it with your own.

**Categories are a fixed three** — `games` / `client` / `personal`, one per accent
colour. Rename their display labels in `src/site.config.ts` (see `labels` above);
the keys themselves are structural and stay. Each category's Zod schema in
`src/types/project-content.ts` `.extend()`s a shared base with its own fields
(`games` adds `platforms`/`storeLinks`, `client` adds `scope`/`clientLogo`, …).
Those extras are an example of the pattern — a non-game fork keeps the base fields
and swaps the extension for whatever its work needs.

## Useful commands

```bash
npm run dev               # dev server (site + /resume + /admin)
npm run validate:content  # validate all content JSON against the schemas
npm run lint              # ESLint (zero warnings)
npm run test              # unit tests (Vitest)
npm run test:e2e          # Playwright functional e2e (auto-starts the dev server)
npm run test:a11y         # Playwright accessibility (axe / WCAG AA)
npm run test:visual       # Playwright visual regression — local only (see note)
npm run build             # build the resume PDF + JSON, then build the site
```

The Playwright suites auto-start a dev server (reusing one you already have
running). `test:e2e` and `test:a11y` run in CI; `test:visual` does **not** — its
snapshots are per-OS and tied to specific content, so regenerate them locally
after content or theme changes with `npm run test:visual -- --update-snapshots`.

`npm run build` runs the resume PDF/JSON generators first (`build:resume`), then
`next build`, so the resume artifacts are present in `public/` for the site.

## Theme & customization

The default theme is a restrained neutral — a clean starting point you make yours.
Customization is a **two-tier** feature: easy knobs for the common axes, and a
full CSS overlay when you outgrow them.

### Tier 1 — knobs in `src/content/theme.json` (no code)

One JSON file drives the whole look:

- **Palette** — a light **and** dark set of 12 semantic tokens each, including the
  three accents (`accent`, `accent-secondary`, `accent-tertiary`; equal in the
  neutral default — give each a distinct value to differentiate, e.g. per category).
- **Fonts** — `fonts.host: "google"` loads any family via a runtime `<link>`, or
  `"self"` self-hosts (zero external requests). Families live in `theme.json` too.
- **Mode** — `defaultMode` + a light/dark `enableToggle`.
- **Skin knobs** — `skin.glow` (`neon`/`warm`/`none`), `skin.radius` (`0`/`sm`/`md`),
  `skin.labelTreatment` (`plain`/`impressed`/`block`).

Edit it by hand, through the dev-only **`/admin/theme/`** editor (colour + font
pickers), or apply a **bundled preset** — `npm run apply-preset kiln|werkstatt|nocturne`,
three looks that share this one layout. No engine files are touched;
`src/theme.config.ts` is just the typed reader over `theme.json`.

### Tier 2 — the skin overlay in `src/styles/command-center/*.css` (total reskin)

For a look richer than the knobs express, the command-center CSS is a per-fork
overlay you own outright. Restyle as hard as you like against the `--cc-color-*`
and `--cc-skin-*` CSS variables the pipeline injects — two forks can look like they
came from different studios while sharing the same layout.

Reach for tier 1 for the common axes; drop to tier 2 when your skin outgrows a knob.

## Deploy to GitHub Pages

Your fork ships with a Pages deploy workflow (`.github/workflows/deploy.yml`).

**One-time setup:** in your fork, go to **Settings → Pages → Build and deployment**
and set **Source** to **"GitHub Actions"**. That's it.

After that, every push to `main` publishes your site (you can also run the
**Deploy to GitHub Pages** workflow manually from the Actions tab). Your site
goes live at `https://<your-username>.github.io/<repo-name>/`.

**The base path is handled for you.** GitHub Pages serves a project site under a
`/<repo-name>/` subpath, so the build needs `NEXT_PUBLIC_BASE_PATH=/<repo-name>`
to make asset and link URLs resolve. The workflow derives this automatically:

- a normal fork (e.g. `your-name/my-portfolio`) builds with `/<repo-name>`;
- a **user/org site** (the repo named `<your-username>.github.io`) serves at the
  root, so the base path is left empty;
- a **custom domain** (see below) also serves at the root, so the base path is
  left empty.

**Custom domain.** Commit a `public/CNAME` file containing your domain (one line,
e.g. `portfolio.example.com`), then set the same domain under Settings → Pages.
Next.js copies `public/` into the export, so the `CNAME` lands at the site root,
and the workflow detects it and builds with an empty base path automatically.

## Roadmap

The template milestones are complete, including **4b — GitHub Pages deploy**
(see [Deploy to GitHub Pages](#deploy-to-github-pages)).

## License

[0BSD](./LICENSE) — the BSD Zero-Clause License. Public-domain-equivalent: use,
copy, modify, and distribute (including in a proprietary fork) with **no
conditions** — no attribution or notice retention required.
