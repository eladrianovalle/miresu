# Resume Builder — Phase B Scoping

Status: **SHIPPED — historical scoping record.** Phase B (GitHub issue **#21**)
shipped: **this repo IS the free-standing, fork-your-own package** it scoped. The
schema collapsed the entity/client/employment trio into `organization`/
`relationship` + `surfaces` (`metrics`/`resumeHidden` removed), the resume
singletons are editable via the dev-only `/admin` editor, the brand is a config
overlay (`src/theme.config.ts` + `src/app/fonts.ts`), and a JSON Resume export
(`resume.json`) ships alongside the ATS PDF. Remaining: **4b** — a one-command
GitHub Pages deploy for forks (see Roadmap in the README) — and the gated
`fromJsonResume` import. The rest of this doc is the original scoping blueprint,
kept as history.

## The product (clarified)

It is **one package, one content model, two views.**

- A forked user gets the whole thing: **their** site, **their** projects /
  experience / skills / education, and a resume that stays aligned because it is
  literally a second rendering of the same content.
- The site is not a separate thing the resume borrows from — the resume is a
  *view* of the one content store. Edit once, both surfaces update.
- The data-entry surface is the **existing `/admin` editor**, extended so it can
  also manage the resume-specific fields and entries.
- **As much per-entry control as we can, with granularity within reason. One
  simple-to-grok system** — not two parallel schemas, not a separate resume tool.

This answers the earlier open questions: the portfolio is core (not optional), the
projects section is core, and there is **no "resume-only" mode** — everyone has a
site, and the resume falls out of it.

## Guardrails (unchanged from Phase A)

- **No runtime AI.** Bullet drafting stays a local, committed, hand-edited step.
- **Static export only.** No server; pure static files.
- **One pure projection, two dumb renderers.** `ResumeModel` is the contract; the
  HTML view and `ResumePdfDocument` only read it. Protect this.
- **Single-user-first.** No multi-tenant hosting, accounts, or DB. The fork is a
  copy of the repo, not a SaaS. Gate to start: Adriano sends the unmodified PDF to
  a real role.

## What "one tight schema" means here

There is already essentially one content model: **entries** (the project JSONs)
plus a few **singletons** (skills, education, header/identity). The resume is
projected from exactly that via `src/lib/resume/projectResume.ts`. So Phase B is
**not** about adding a second data source — it is about three things:

1. **De-ORC-PUNK the schema** so the one model is generic (no assumptions that only
   make sense for this site).
2. **Make per-entry control first-class and coherent** — especially *where each
   entry surfaces* (site, resume, both) — instead of today's ad-hoc flags.
3. **Extend the editor** to drive all of it, including the resume fields.

`ResumeModel` and the single `projectResume` projection stay as the spine. No
`fromResumeData` fork — there is one source.

### 1. De-brand the schema

Audit `ProjectBaseSchema` + the category schemas for ORC-PUNK-isms and either
generalize or make optional. Known items:

- **`metrics`** — dead (declared, validated, consumed by nothing). Remove now.
- **`accentColor`, store-link platforms, `pillar-toy`-style extras** — confirm
  they're optional and don't leak into the resume path.
- **`entity` vs `client` vs `employment.org`** — three overlapping notions of "who
  this was for" (`orgFor` already reconciles them). **Decision: collapse to one
  `organization` field plus a `relationship` enum: `own / client / employer /
  collaboration`.** (Studio audit: the live content has **5** "who-for" semantics,
  not 3 — `entity:freelance` appears in 2 files and `collaboration` in 1. Resolution:
  **`freelance` maps to `client`** — both freelance entries are client work; and
  **`collaboration`** is a first-class member so collabs keep their distinct display.)
  `orgFor`/`titleFor` reduce to reading those two fields; the site's `category`-keyed
  display (`DossierMeta.tsx`, `metadata.ts`) flips to key off `relationship`. This is
  the de-brand centerpiece — and the one genuinely destructive migration (see step 2).
- **Education `year` vs `dateRange`** — pick one (recommend `year`) to kill the
  two-ways-to-say-timing redundancy.

### 2. Per-entry surface control (the granularity knob)

Today an entry's visibility is governed by ad-hoc, partly-negative flags: `draft`
(dev-only), `resumeHidden` (off the resume), `confidential` (NDA masking),
`featured` (site emphasis). There is **no** way to put an entry on the resume but
*not* on the site (e.g. a job with no showcase piece) — the one real gap for a
generic user.

> **Studio correction:** `resumeHidden` is **not** unused — it's `true` in **6 of
> the 10** project JSONs (the projects deliberately kept off the resume). The
> rename is therefore *not* zero-edit: step 1 must **backfill `surfaces.resume:false`
> on those 6** or the resume floods with broken, date-less entries.

Proposal — one coherent, positive model every entry shares:

```
surfaces: { site: boolean, resume: boolean }   // default both true
draft:    boolean                              // dev-only, overrides both
confidential: boolean                          // NDA treatment (existing rules)
```

This is the whole granularity story in one place: each entry independently chooses
where it appears, the resume can carry experience that the site doesn't, and
"simple to grok" holds (two toggles, not a matrix). `resumeHidden` collapses into
`surfaces.resume = false`; site-only / resume-only / both / neither all fall out.
Keep `featured` as pure site-ordering.

**Decision: `surfaces: {site, resume}` is the MVI-0 model.** It is deliberately the
*floor*, not the ceiling — finer control (per-section resume placement, explicit
ordering overrides, more surfaces) is an expected later iteration. Design the
projection so adding keys to `surfaces` later doesn't require touching the
renderers.

> Open design choice: whether to also rename the entry type from `project` to
> something more neutral (`entry`/`work`) so "a job with no portfolio piece" doesn't
> feel like a misnomer. Cosmetic but affects grok-ability. Recommend deferring until
> extraction (step 4) to avoid a churny rename now.

### 3. The editor (`/admin`)

The dev-only editor already auto-generates forms from Zod schemas
(`z.toJSONSchema()` → recursive `SchemaField`). Extending it to manage the resume
singletons (`experience`-bearing fields, `skills`, `education`, `header`, curated
`projects`) and the new `surfaces` control is **wiring on existing machinery**, not
new infrastructure. This is the "edit resume entries too" half of issue #21, and
it's the same form system the site content already uses — one editor for everything.

### 4. Portability / interchange (JSON Resume + LinkedIn)

**LinkedIn has no usable API** for indie import/export (Profile API returns only
name/photo/headline without partner access; there is no write API). The realistic
interop target is **[JSON Resume](https://jsonresume.org)** — the open standard with
existing **LinkedIn→JSON Resume** converters, and LinkedIn's own data export
(`Positions/Education/Skills/Projects.csv`) maps cleanly onto it. So JSON Resume is
the single bridge for both.

**Decision (hybrid):** keep the **site-first content as the source of truth** and
`ResumeModel` as the hub, but **nudge the resume singleton shapes toward JSON Resume
where it's free** (the editor is schema-driven, so re-shaping costs no editor rework):

- `skills`: `{group, items[]}` → **`{name, keywords[]}`** (exactly JSON Resume's shape).
- `education`: `{institution, credential, year}` → `{institution, studyType, area, endDate}`.
- dates: keep `start/end` (already ≈ JSON Resume `startDate/endDate`); `'present'` → omit endDate.
- Promote **Languages** out of the skills taxonomy into a dedicated section
  (`{language, fluency}`) — optional.

Field map (ours ↔ JSON Resume ↔ LinkedIn CSV):

| Ours | JSON Resume | LinkedIn |
|---|---|---|
| header.name / email / phone / location / links | basics.{name,email,phone,location,profiles} | Profile.csv |
| experience {org, resumeTitle/role, dateRange, bullets} | work {name, position, startDate/endDate, highlights} | Positions.csv |
| projects {title, year, stack, summary, slug} | projects {name, startDate, keywords, description, url} | Projects.csv |
| skills {group, items} | skills {name, keywords} | Skills.csv |
| education {institution, credential, year} | education {institution, studyType+area, endDate} | Education.csv |
| `organization`/`relationship`/`surfaces`/curated/NDA | — (no equivalent) | — |

The site-first concepts (`relationship`, `surfaces`, curated projects, NDA masking)
have **no JSON Resume equivalent** — dropped on export, defaulted on import.

**Adapter** (`src/lib/resume/jsonResume.ts`, mirrors the renderer pattern):
- `toJsonResume(model)` → emit a build-time `public/assets/resume/resume.json` (export — pure projection).
- `fromJsonResume(jr)` → seed content (import — later/gated). **LinkedIn import = LinkedIn CSV → JSON Resume (existing tools) → fromJsonResume.** Export-to-LinkedIn is not possible (no API); JSON Resume IS the portable output.

This is a great forker-onboarding story for #21 ("drop in your JSON Resume / LinkedIn
export to seed your site"). It's independent of Steps 0–3 and needs no schema change
beyond the optional skill/education re-shapes above.

## Sequencing (each step shippable; 0–3 live-site-safe *with the guards below*)

Every migration step (0–3) mutates the already-shipped live site, so each must pass
the existing CI gates (`validate:content`, `build:staging` route-existence check,
the resume PDF build) and cannot merge half-applied.

0. **Cleanup (trivial):** remove dead `metrics`; resolve education `year`/`dateRange`.
1. **Surfaces (NOT zero-edit):** add `surfaces` with `.default({site:true, resume:true})`
   so all 10 JSONs validate unchanged; **backfill `surfaces.resume:false` on the 6
   `resumeHidden` files**; rename `resumeHidden` → `surfaces.resume`; teach the site
   portfolio + `generateStaticParams` to honor `surfaces.site` (source params from the
   site-filtered list — no orphan pages). **Guard: land a golden-output `projectResume`
   unit test over all 10 JSONs first.**
2. **Organization collapse — split 2a / 2b (the one destructive step):**
   - **2a (additive):** add `organization` + `relationship` (`own/client/employer/
     collaboration`); add a temporary `organizationOf()` coalescer mirroring today's
     `orgFor` precedence; golden test stays green.
   - **2b (destructive):** backfill all 10 JSONs (`freelance`→`client`); flip
     `orgFor`/`titleFor` and the `category`-keyed display readers (`DossierMeta`,
     `metadata.ts`) to `relationship`; delete `entity`/`client`/`employment.org`.
3. **Editor (real work, not a footnote):** register the 4 resume singletons in
   `/admin`'s `CONTENT_TYPES` (new routes); `surfaces` renders for free via existing
   `ObjectField`/`CheckboxField`. The MVI is the **edit → build → PDF + site round
   trip**, not "the form renders."
4. **Extract** into the standalone template repo: a **neutral default theme** (none of
   the ORC PUNK identity travels; cyberpunk tokens stay with orcpunk.com), an **MIT
   `LICENSE`** (no license = legally un-forkable), a brand/asset scrub (cut
   pillar-toy/pixi), and fake seed content. Ship as **whole-repo fork lineage, not an
   npm package**. Split **4a** (fork runs locally) → **4b** (fork deploys to the
   forker's GitHub Pages — exercises the base-path/static-export path).

5. **Interchange (JSON Resume):** the optional skill/education re-shapes; a
   `toJsonResume` exporter + build-time `resume.json`; later `fromJsonResume` import
   (LinkedIn CSV → JSON Resume → seed). Independent of 0–4; see section 4.

Steps 0–3 harden and generalize the one schema *inside this repo* and pay for
themselves on the live site regardless of whether anyone forks; only step 4 is the
actual fork.

> **Noted risk (Studio, accepted):** step 4 is *scheduled*, not demand-gated. The
> Studio flagged platform-before-product and a perpetual two-repo maintenance tax for
> n=1. Decision: schedule it anyway — accept the maintenance cost as the price of the
> issue-#21 goal. Default disposition if no forker materializes: freeze the template
> as "how my site is built" documentation rather than maintaining an unused fork.

## Non-goals (for now)

- Multi-tenant hosting, accounts, a database, server runtime.
- Runtime AI / LLM calls in CI or build.
- A second/parallel resume-only data model. There is one content store.

## Decisions (resolved)

1. **Surface model** — `surfaces: {site, resume}` is the MVI-0 granularity. It's the
   floor, not the ceiling: finer control (per-section placement, ordering) is an
   expected later iteration, so keep the projection open to extra `surfaces` keys
   without renderer changes.
2. **Organization model** — collapse `entity`/`client`/`employment.org` into one
   `organization` + optional `relationship` enum (own / client / employer). Display
   and projection rules key off `relationship`.
3. **Theme** — MVI-0 ships a **neutral default theme**; none of the ORC PUNK visual
   identity travels with the template. The forker restyles from neutral.
4. **Relationship enum** — `own / client / employer / collaboration`; `freelance`
   maps to `client`. (Resolves the 5-way "who-for" audit from the Studio run.)
5. **License** — **MIT** for the template.
6. **Step 4 timing** — *scheduled* (split 4a/4b), not demand-gated; maintenance cost
   accepted (see Noted risk in Sequencing).
7. **ICP** — technical forkers who live in GitHub (fork-a-repo model). Non-technical
   job seekers are out of scope (they'd require the SaaS that is a hard non-goal).

## Deferred (post-MVI-0)

- Finer surface granularity (per-section placement, ordering overrides).
- Renaming the entry type `project` → neutral term (`entry`/`work`); defer to
  extraction to avoid a churny rename now.
- Theming system / presets beyond the single neutral default.
