# CLAUDE.md

Guide for AI coding assistants (and humans) working in this repo. Terse by design — skim it, follow it, link to ADRs for the long-form reasoning.

## Project snapshot

- **What:** Marketing + lead-gen site for [ScaleForce.agency](https://ScaleForce.agency) — AI / automations / operations agency.
- **Package:** `scaleforce-agency-landing` (private, unpublishable).
- **Stack:** Astro 5, Tailwind 4 (CSS-first `@theme`), TypeScript 5.9 (strict), React 19 dependencies present but not currently integrated/rendered, Node 22+. Content: local markdown + Contentful + thomhayner.com RSS. Hosted on Vercel.
- **Branching:** `feature → dev → main`. Feature branches (`feat/...`, `fix/...`, `chore/...`, `docs/...`) cut from `dev`. PRs target `dev`; release PRs go `dev → main`. See `README.md` for the full flow.
- **CI:** GitHub Actions, Node 22/24 matrix, runs `check:astro`, `check:eslint`, and `build`. See `.github/workflows/`.

## ADR convention

Architectural decisions live in [`docs/adr/`](docs/adr/). Filename format: `ADR-YYYY-MM-DD-kebab-title.md`. Use `docs/adr/TEMPLATE.md` as the starting point.

**Write an ADR when** you:

- Swap or upgrade a framework / major dependency (Astro, Tailwind, React, Node).
- Change the branching model, CI layout, or release process.
- Introduce a new content source, integration, or architectural seam.
- Make a reversible-but-load-bearing decision future-you will want the "why" for.

**Don't write an ADR for** bug fixes, copy edits, dependency bumps within a major, or visual tweaks.

Examples to model new entries on:

- `ADR-2026-04-21-detach-from-astrowind-template.md` — project identity, dependency/metadata decisions.
- `ADR-2026-04-21-tailwind-3-to-4-migration.md` — framework upgrade with migration notes.
- `ADR-2026-04-21-multi-source-blog-architecture.md` — architectural seam.
- `ADR-2026-04-21-adopt-feature-dev-main-branching.md` — process decision.

## Phased work history

Recent phased rework is all captured as ADRs dated `2026-04-21`. One-liners:

- **Phase 1 — Node / TS baseline bump.** Raised minimum Node to 22, TS to 5.9. [`ADR-2026-04-21-node-ts-baseline-bump.md`](docs/adr/ADR-2026-04-21-node-ts-baseline-bump.md).
- **Phase 2 — Astro 4 → 5 upgrade.** [`ADR-2026-04-21-astro-4-to-5-upgrade.md`](docs/adr/ADR-2026-04-21-astro-4-to-5-upgrade.md).
- **Phase 3 — Tailwind 3 → 4 migration.** CSS-first `@theme` in `src/assets/styles/tailwind.css`. [`ADR-2026-04-21-tailwind-3-to-4-migration.md`](docs/adr/ADR-2026-04-21-tailwind-3-to-4-migration.md).
- **Phase 4 — React 18 → 19 upgrade.** [`ADR-2026-04-21-react-18-to-19-upgrade.md`](docs/adr/ADR-2026-04-21-react-18-to-19-upgrade.md).
- **Phase 5 — CI hardening + multi-source blog.** Split CI, ESLint env override, third content source (`thomhayner.com`). [`ADR-2026-04-21-ci-hardening-split-and-eslint-env-override.md`](docs/adr/ADR-2026-04-21-ci-hardening-split-and-eslint-env-override.md), [`ADR-2026-04-21-multi-source-blog-architecture.md`](docs/adr/ADR-2026-04-21-multi-source-blog-architecture.md).
- **Phase 6 — Detach from AstroWind template.** Renamed package, rewrote README, adopted ADR structure. [`ADR-2026-04-21-detach-from-astrowind-template.md`](docs/adr/ADR-2026-04-21-detach-from-astrowind-template.md).
- **Phase 7 — Design evolution (in progress).** Visual rebrand: favicon, logo, OG image, typography, color tokens. Scope is intentionally open; decisions land as ADRs as they solidify.

## Common commands

```bash
npm run dev      # Astro dev server (http://localhost:4321)
npm run build    # Production build → ./dist/
npm run preview  # Serve ./dist/ locally
npm run check    # astro check + eslint (CI parity)
npm run fix      # eslint --fix
```

**Prettier is not part of this project's toolchain.** No `prettier` script, no `.prettierrc*`, no CI step. Do not add one, do not run `prettier`, do not commit config. (It may still appear transitively in `package-lock.json` via `@astrojs/check` — that's expected and fine; don't try to purge it.) ESLint owns formatting-adjacent concerns.

## Styling conventions

Tailwind 4, CSS-first. Theme tokens live in `src/assets/styles/tailwind.css` inside `@theme { … }` and read `--aw-*` CSS variables set by `src/components/CustomStyles.astro`.

- **Text colors** (`text-default`, `text-muted`, `text-primary`, `text-secondary`, `text-accent`) are **auto-generated** from `@theme`. Don't add `@utility text-*` blocks — they'd shadow the generated ones.
- **Surface backgrounds** (`bg-page`, `bg-dark`, `bg-light`) are explicit `@utility` blocks because they're surface primitives, not color scale entries. Use these for page/section backgrounds.
- **Don't mix naming conventions.** `bg-page` is the surface utility; `bg-primary` would be a color-scale utility. Pick the one that matches the role.
- Dark mode is class-based (`.dark` on `<html>`), overridden via `@custom-variant` in `tailwind.css` (v4 defaults to `prefers-color-scheme`).
- `v3 → v4` border-color default was restored in `@layer base`; don't remove it without understanding what it does.

## Agent-specific guidance

The maintainer works with Claude agents and chip-spawned sub-tasks heavily. Some expectations:

- **Merge strategy is `feature → dev → main`.** Default your PR base to `dev` unless told otherwise.
- **The maintainer bypass-merges when branch protection blocks.** If CI is green and review is done, don't redesign to work around a protection rule — just surface it.
- **Never redesign to work around a bug.** Fix the bug or flag it. If a test is "flaky", investigate root cause before suppressing it.
- **Never use Prettier.** (Restating from above — it's intentional.)
- **Chip out follow-ups** instead of scope-creeping the current PR. If you notice something worth fixing that isn't on the critical path, flag it as a separate task.
- **Prefer ADRs over inline commentary** for load-bearing decisions. If a PR description is turning into a design document, it probably wants an ADR instead.

## LLM-Wiki (`wiki/`)

This repo uses the Karpathy LLM-Wiki pattern as a persistent, LLM-maintained knowledge base. `wiki/` is an LLM-owned synthesis layer that sits between you and the raw sources: instead of re-deriving knowledge via ad-hoc RAG on every question, the LLM compiles it into interlinked markdown pages that compound over time. **Humans read `wiki/`; the LLM writes it.** See [`wiki/README.md`](wiki/README.md) for human-facing orientation. The rules below are the operating schema — follow them when ingesting, querying, or linting the wiki.

### Source layers

The wiki synthesizes from, but does **not** modify, these sources:

- `docs/` — project documentation, technical specifications, operational guides.
- `docs/adr/` — architectural decision records. Treat each ADR as the authoritative record of a past decision; the wiki summarizes and cross-references, but the ADR itself is canon.
- Git history — commit messages and merged PRs. Use `gh pr list --state merged --limit N`, `gh pr view <n>`, and `git log --oneline` for PR and commit context.
- `README.md`, `CONTRIBUTING.md`, and other top-level project guides.
- Any additional sources the user adds over time (meeting transcripts, external articles, design notes) — treat them the same way.

### Wiki structure

- `wiki/pages/*.md` — synthesized pages. Flat layout; introduce subcategories only when the flat layout genuinely stops scaling (typically past ~100 pages).
- `wiki/index.md` — content-oriented catalog. Update on every ingest. Start here when answering a query — it's faster than scanning `pages/` directly.
- `wiki/log.md` — chronological, append-only record of ingests, queries, lint passes, and manual edits. Each entry prefixed with `## [YYYY-MM-DD] <op> | <subject>` so the log is grep-able.
- `wiki/README.md` — human-facing entry point. Don't rewrite during routine operations.

### Page conventions

Every page under `wiki/pages/` has YAML frontmatter:

```yaml
---
title: <human-readable title>
type: <source | entity | concept | feature | decision | analysis>
sources: [<paths, PR numbers, ADR ids, URLs>]
updated: YYYY-MM-DD
---
```

- **title** — set explicitly; not derived from the filename.
- **type** — one of the categories in `index.md`. Adding a new type is fine — just add a matching section to the index.
- **sources** — every substantive claim on the page must trace back to at least one item in this list. If a claim has no source, either drop it or mark it clearly as synthesis/inference in the prose.
- **updated** — the date of the most recent substantive revision. Bump it whenever the page changes.

**Filenames** are kebab-case, short, and describe the subject: `overpass-caching.md`, `i18n-namespaces.md`, `pr-142-lazy-route-loading.md`. Not `notes.md` or `stuff-about-auth.md`.

**Internal links** use markdown relative links from the linking page: `[the Overpass cache](./overpass-caching.md)`. Keep them bidirectional where it aids navigation — if A references B, mention A somewhere on B.

**Splitting.** When a page passes ~400 lines, consider splitting by subtopic. One focused page is more maintainable than one sprawling one.

### Operations

#### Ingest

When the user asks to ingest a source:

1. **Read the source completely.** Skimming produces shallow summaries that pollute the wiki. If the source is long, read it in full — that's the point.
2. **Discuss key takeaways briefly with the user** before writing. Confirm what matters; this is cheaper than rewriting a page after filing.
3. **Create a source summary page** under `wiki/pages/` if one doesn't exist. Filename based on the source: `adr-2026-04-01-switch-to-vitest.md`, `pr-142-lazy-route-loading.md`, `spec-checkout-v2.md`.
4. **Identify every existing page the source affects.** Update each in place — add new cross-references, revise claims, flag contradictions with existing content instead of silently overwriting. A single ingest routinely touches 5–15 pages; that's normal, not excessive.
5. **Create new entity/concept pages** for anything the source mentions that deserves its own page but doesn't have one yet.
6. **Update `wiki/index.md`** — add the new pages, update titles if they changed, verify the category sections still make sense.
7. **Append to `wiki/log.md`:**

```
## [YYYY-MM-DD] ingest | <source subject>

- Source: <path / PR number / ADR id / URL>
- Pages created: <list>
- Pages updated: <list>
- Notes: <one or two sentences on anything notable — contradictions found, questions raised, topics to revisit>
```

#### Query

When the user asks a question the wiki should help answer:

1. **Read `wiki/index.md` first.** Use it as a map to find relevant pages. This is much faster than reading `pages/` indiscriminately.
2. **Read the relevant pages.** Cite them in the answer (e.g., "per `wiki/pages/overpass-caching.md`…") so the user can verify.
3. **If the answer is novel synthesis** — a comparison, an explanation, an analysis the wiki didn't already contain — ask whether to file it as a new page. Good answers shouldn't disappear into chat history; filing them is how the wiki compounds from questions as well as ingests.
4. **If a page was created**, append to `log.md`:

```
## [YYYY-MM-DD] query | <question topic>

- Question: <one-line summary>
- Pages referenced: <list>
- Pages created: <list, if any>
```

If nothing was filed, a log entry is optional — judgment call.

#### Lint

When the user asks for a lint / health check:

- **Contradictions** — pages with conflicting claims. Flag them; don't silently resolve. The user decides which is correct.
- **Stale claims** — statements superseded by newer sources. Flag with the superseding source.
- **Orphan pages** — pages with no inbound links. Either link them from somewhere relevant or propose deletion.
- **Missing pages** — concepts or entities mentioned on multiple pages but lacking their own. Propose creation.
- **Source drift** — pages whose `sources:` frontmatter references files that have been deleted or heavily rewritten. Flag for re-ingestion.

Produce a triage list, not autonomous edits. The user approves before anything changes. Append to `log.md`:

```
## [YYYY-MM-DD] lint | <what was checked>

- Issues found: <count>
- Resolved inline: <list, if any>
- Flagged for user: <list>
```

### Scope discipline

- **The wiki is LLM-owned.** A human hand-editing a wiki page must log it as `manual-edit` in `log.md` so the next ingest doesn't quietly re-diverge.
- **Sources are read-only during wiki operations.** Ingesting an ADR doesn't modify the ADR. Editing an ADR is a separate task.
- **No fabrication.** Every claim traces back to `sources:` frontmatter. If no source supports a claim, drop it or mark it as explicit synthesis.
- **When uncertain where a fact belongs**, surface the question to the user instead of forcing a bad filing. An incorrectly filed page is harder to fix than a deferred one.
- **Scaffolding is not ingestion.** Setting up `wiki/` (via the `repo-wiki-scaffold` skill) creates the structure. Populating it is a separate operation the user initiates explicitly.

## What NOT to touch without asking

- **`LICENSE.md`** — contains dual copyright (original AstroWind © onWidget, plus current work). Do not modify the copyright lines.
- **`src/pages/terms.md` and `src/pages/privacy.md`** — still contain template demo legal copy (AstroWind LLC address, `astrowind.vercel.app` URLs). **Do not fabricate replacement legal text.** This is deferred until the site goes public and real legal copy is written. Leave it.
- **`astrowind:config` virtual module** and its import sites — rename is a known deferred follow-up (see detach ADR). Don't rename ad-hoc; bundle it when the rename is intentionally scoped.
- **`vendor/integration/`** — the template-inherited Astro integration. Touch only when the change is explicitly about that integration.
