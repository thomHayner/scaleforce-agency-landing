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

**Prettier is gone.** It was removed from the repo. Do not reintroduce it, do not add a `.prettierrc`, do not run `prettier`. ESLint owns formatting-adjacent concerns.

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

## What NOT to touch without asking

- **`LICENSE.md`** — contains dual copyright (original AstroWind © onWidget, plus current work). Do not modify the copyright lines.
- **`src/pages/terms.md` and `src/pages/privacy.md`** — still contain template demo legal copy (AstroWind LLC address, `astrowind.vercel.app` URLs). **Do not fabricate replacement legal text.** This is deferred until the site goes public and real legal copy is written. Leave it.
- **`astrowind:config` virtual module** and its import sites — rename is a known deferred follow-up (see detach ADR). Don't rename ad-hoc; bundle it when the rename is intentionally scoped.
- **`vendor/integration/`** — the template-inherited Astro integration. Touch only when the change is explicitly about that integration.
