# miresu

**Fork your own portfolio site + an aligned resume from one content store.**

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
- **Static export** — deploys as pure static files (no server). GitHub Pages
  deploy support is forthcoming (template step 4b).

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

## Theme

The default theme is currently the placeholder visual identity carried over while
this template is generalized — restyle it to make it yours. Design tokens live in
`tailwind.config.ts` and the custom CSS under `src/styles/`.

## Roadmap

- **4b — GitHub Pages deploy:** a one-command path to publish your fork to your
  own GitHub Pages (exercises the base-path / static-export config). Coming next.

## License

[MIT](./LICENSE).
