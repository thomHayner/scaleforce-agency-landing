---
id: ADR-2026-04-21-node-ts-baseline-bump
title: Bump Node engines baseline to 22+ and TypeScript to the 5.9 line
status: accepted
date: 2026-04-21
deciders: [thomHayner, claude-opus-4-7]
tags: [node, typescript, tooling, upgrade]
supersedes: []
superseded_by: []
related: [ADR-2026-04-21-astro-4-to-5-upgrade]
source: claude-code-session-2026-04-21 node-ts-baseline-bump
---

## Context

Phase 3 of the multi-phase upgrade roadmap, following the Astro 5
migration in Phase 2 (see ADR-2026-04-21-astro-4-to-5-upgrade). Two
pieces of stale baseline are left over from the pre-upgrade world:

- **`engines.node` in `package.json`** still reads
  `"^18.17.1 || ^20.3.0 || >= 21.0.0"`. Node 18 reached end-of-life
  in April 2025, and as of this week (2026-04-21) Node 20 has also
  exited active LTS. The current CI matrix advertises 20 and 22,
  which is already stale on the lower bound.
- **TypeScript at `^5.6.2`**, three minors behind the current
  stable (5.9.3). `@astrojs/check`'s language server follows TS
  patches, and holding back on an old TS means we don't get the
  newer diagnostics or the speed improvements shipped across
  5.7/5.8/5.9.

There is no `.nvmrc` in the repo, so new contributors have no
signal about which Node version to use locally, and Vercel's
default Node version is configured in the dashboard (not in the
repo), so the dashboard value will drift from the engines field
unless we deliberately align them.

Node release cadence as of 2026-04-21:

- Node 18: EOL April 2025.
- Node 20 (Iron): active LTS ended April 2026 — now in maintenance.
- Node 22 (Jod): active LTS.
- Node 24: current LTS; Vercel's default since late 2025.
- Odd-numbered releases (21, 23) are short-lived non-LTS and are
  not a target.

## Decision

1. Set `engines.node` to `">=22.0.0"`. Drop Node 20 entirely. The
   two Node versions real production environments will be running
   are 22 and 24; testing and advertising support for a
   just-out-of-LTS line buys nothing and masks bugs that only
   surface on the newer runtimes.
2. Add `.nvmrc` pinning Node 24 — current LTS and Vercel's
   default, which is what most contributors' dev machines will
   converge on.
3. Update the CI matrix in `.github/workflows/actions.yaml` from
   `[20, 22]` to `[22, 24]`.
4. Bump `typescript` from `^5.6.2` to `^5.9.3`, the latest 5.x
   stable. Stay on the 5.x line deliberately; TS 6.0 exists but
   is out of scope for this phase.
5. Review the `@types/*` packages in devDependencies for
   minor/patch bumps. Only `@types/eslint__js` has a newer line
   (9.x), which is a cross-major jump and therefore deferred. The
   other three (`@types/js-yaml`, `@types/lodash.merge`,
   `@types/mdx`) are already on their latest published versions.

Leave React, Tailwind, and every other framework version
untouched — those are their own later phases.

## Alternatives considered

- **Keep Node 20 in the matrix.** Rejected. Node 20 exited active
  LTS this month (April 2026). Testing against a maintenance-mode
  version while neither Vercel nor any realistic user environment
  will be running it means paying a CI job to guard a surface no
  one is actually on.
- **Go Node-22-only, drop 24 from the matrix.** Rejected. Vercel's
  default runtime is 24 as of late 2025; if we don't test on 24 we
  learn about 24-only regressions from production deploys rather
  than from CI. The cost of a second matrix job is trivial.
- **Include Node 21 or 23 in the matrix.** Rejected. Odd-numbered
  Node releases are non-LTS — 21 EOL'd April 2024, 23 is a
  short-lived dev preview. Nothing in production will run on
  either.
- **Stay on the current `engines` range.** Rejected. Advertising
  Node 18 and Node 20 support is now actively misleading. A
  contributor on Node 18 or 20 would see an inconsistent signal
  between `engines` (accepted) and CI (only 22/24), and Astro 5's
  own runtime check still gates Node 18 regardless.
- **Jump TypeScript to 6.0.** Rejected. TS 6 is brand new and
  `@astrojs/check@0.9.x` doesn't yet advertise 6.x support in its
  peer range. Holding on the final 5.x stable keeps the type-check
  path boring while still pulling in three minors of diagnostics
  work. A TS 6 move belongs in a later phase once the Astro-check
  line catches up.
- **Bump `@types/eslint__js` across its 8→9 major.** Rejected for
  this PR. Major bumps on `@types/*` packages are scoped-out per
  the phase brief; this one can ride with the ESLint-ecosystem
  refresh in a later pass.

## Consequences

- **Positive:** The `engines` field, the CI matrix, `.nvmrc`, and
  production runtimes (Vercel's 24 default) all agree. New
  contributors get a clear Node major-line signal from `.nvmrc`
  — it contains the bare major (`24`), which `nvm` and `fnm`
  resolve to the installer's latest 24.x. (Volta doesn't read
  `.nvmrc` by default — contributors on Volta should use
  `volta pin node@24` or set a `volta.node` field if we later
  want to emit one.) That is intentional: we want contributors
  tracking the LTS line, not an exact patch that would need an
  ADR bump every time 24.x gets a security release. If future reproducibility
  needs require byte-exact Node across machines, pin to a full
  `24.x.y` then (and accept the maintenance cost of chasing
  patch releases). TS diagnostics are current and we're set up
  for a clean TS 6 move when that phase comes.
- **Negative:** Contributors on a dev machine with Node older than
  22 will see an `EBADENGINE` warning from npm. That's the
  intended signal — Nodes 18 and 20 are past active LTS — but it
  is a small friction point for anyone who hasn't upgraded locally
  yet.
- **Follow-ups / manual actions required:**
  - **HS-4a (Vercel):** Update Vercel Project Settings → General
    → Node.js Version to 24.x (or 22.x if the team prefers the
    lower end of the supported range). The Vercel dashboard is
    the source of truth for the deploy runtime; without this,
    preview deploys may continue to use an older Node despite
    what the repo advertises.
  - **HS-4b (Branch protection):** The required-status-checks
    list on `dev` and `main` currently includes `build (20)` and
    `build (22)`. Swap `build (20)` for `build (24)` in GitHub
    Settings → Branches → Branch protection rules, otherwise
    merges will stall on a check that no longer runs.
  - Bump `@types/eslint__js` to 9.x alongside a broader ESLint
    ecosystem refresh.
  - Move to TypeScript 6.x once `@astrojs/check` publishes a
    release with 6.x in its peer range.

## Notes

- `npm install` resolved cleanly (no peer conflicts). `npm ci`
  reproduced that install. `npm run check:astro` and
  `npm run check:eslint` both pass. `npm run build` fails only at
  the Contentful SDK's missing `accessToken` check — consistent
  with prior phases, the real secrets live in CI and Vercel.
- No source-code changes were required. The TS bump is a pure
  devDependency move; `astro check` is green at TS 5.9.3 against
  the existing codebase.
