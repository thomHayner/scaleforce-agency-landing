---
id: ADR-2026-04-21-react-18-to-19-upgrade
title: Bump React 18 to 19 alongside the rest of the Phase-5 dependency refresh
status: accepted
date: 2026-04-21
deciders: [thomHayner, claude-opus-4-7]
tags: [react, upgrade, dependencies, calendly]
supersedes: []
superseded_by: []
related: [ADR-2026-04-21-astro-4-to-5-upgrade, ADR-2026-04-21-tailwind-3-to-4-migration, ADR-2026-04-21-node-ts-baseline-bump]
source: claude-code-session-2026-04-21 react-18-to-19-upgrade
---

## Context

Phase 5 of the multi-phase upgrade roadmap. Phases 0–4 have landed on
`dev`: CI hardening, Astro 4 → 5 with the Content Layer, the Node 22+
and TypeScript 5.9.3 baseline, and the Tailwind 3 → 4 migration to
`@tailwindcss/vite` with CSS-first `@theme`. With the platform,
framework, and styling layers refreshed, React 18.3.1 is now the
oldest of the top-level runtimes still in `package.json`. React 19 GA
shipped in December 2024, the 19.x line has been quiet and stable
through 2025 and into 2026 (currently `19.2.5`), and the typings
(`@types/react@19.2.14`, `@types/react-dom@19.2.3`) have long since
caught up.

The practical question was not "is React 19 ready" — it clearly is —
but "what does this repo's React surface actually look like," because
that determines how invasive the upgrade is.

A full inventory of `src/`:

- **Zero `.tsx` or `.jsx` files.** Every component in this template
  is either `.astro` or plain TypeScript utility code.
- **Zero `client:load` / `client:idle` / `client:visible` /
  `client:only="react"` directives.** There are no hydrated React
  islands shipping to the browser.
- **No `@astrojs/react` integration** in `package.json` or
  `astro.config.ts`. The Vite plugin chain has no JSX/React handling
  beyond what Astro's default pipeline provides.
- **One `import { InlineWidget } from "react-calendly"`**, in
  `src/components/widgets/Calendly.astro`. That file is imported by
  **nothing** — a repo-wide grep finds references to the string
  "Calendly" only in the tailwind-migration ADR (as a QA checklist
  item against the prod site) and in the `README.md`. The local
  repo's page routes do not use it.

So the React dependency tree is load-bearing in theory (satisfying
`react-calendly`'s peers) but dead at the call-graph level — nothing
renders React on either the server or the client. The `vite build`
for the client bundle produces 13 modules, none of them React.

`react-calendly`'s 4.4.0 release (May 2025) declares
`"react": ">=16.8.0"` and `"react-dom": ">=16.8.0"` as peer
dependencies, which accepts React 19 without complaint. That removed
the one real risk flagged in the Phase-5 prompt.

## Decision

Bump `react` and `react-dom` from `^18.3.1` to `^19.2.5`, and bump
`react-calendly` from `^4.3.1` to `^4.4.0`. Do **not** add
`@types/react` / `@types/react-dom`, `@astrojs/react`, or any other
React-adjacent dev tooling — this repo authors zero React code, so
there is nothing for the types to service and no JSX for an
integration to compile. `react-calendly` ships its own types,
bundled; the only place they'd be referenced is inside the
`Calendly.astro` frontmatter, and the Astro compiler's TypeScript
layer resolves them transitively.

Leave the dead `src/components/widgets/Calendly.astro` file in place.
It is unused today, but the README and the Tailwind-migration ADR
both treat the Calendly-embedded contact surface as part of the
prod site's QA scope. A separate follow-up should reconcile that —
either by wiring the widget into a real page (and at that point
installing `@astrojs/react` and adding a `client:load` directive, so
it actually hydrates) or by deleting the orphan file. Bundling that
reconciliation into a dependency bump would conflate two decisions.

## Alternatives considered

- **Stay on React 18.3.1.** Rejected. React 18 is on long-term
  maintenance; new work in the ecosystem targets 19. Staying on 18
  compounds migration cost the same way staying on Tailwind 3 did.
  There is no concrete blocker — `react-calendly` already accepts 19.
- **Swap React for Preact via `@astrojs/preact`.** Rejected. The
  repo has no React code to benefit from Preact's smaller runtime,
  and `react-calendly` would need the `preact/compat` alias layer to
  work at all. That's more moving parts than the problem warrants.
- **Install `@astrojs/react` as part of this upgrade even though no
  island uses it yet.** Rejected. The integration exists to compile
  JSX and register a client runtime for `client:*` directives. With
  zero JSX files and zero client directives, installing it would add
  a dependency and a Vite plugin that does nothing. If the Calendly
  widget (or anything else) is reactivated as a real island later,
  the integration can be added at the same PR that wires it up — the
  two changes belong together.
- **Bump `@types/react` / `@types/react-dom` anyway, for
  futureproofing.** Rejected for the same reason as the integration.
  This repo authors no React. Adding types now is carrying code we
  don't use; if a future PR introduces an island, that PR brings its
  own type deps.
- **Delete `Calendly.astro` as part of this upgrade.** Rejected as
  out of scope. The file is dead but the widget is part of the
  user-facing product surface per the README and the prior ADR's QA
  notes — the right move is to either wire it up correctly or delete
  it deliberately, in a PR that's about that question, not a React
  version bump.

## Consequences

- **Positive:** The repo is current on React. When a future
  contribution introduces an actual React island (most likely: the
  Calendly embed becoming a real `client:load` component on a
  contact page), they start from React 19 and can use ref-as-prop,
  the improved hydration error messages, and the new
  `useActionState` without carrying a React 18 baseline forward.
  Dependabot won't nag about a 19.x upgrade. `npm install` stays
  peer-conflict-free (no `--force`, no `--legacy-peer-deps`).
- **Negative:** The `Calendly.astro` file has a latent correctness
  issue that this upgrade does not fix: it imports a React component
  but has no `client:*` directive and no React integration wired up.
  If the file is ever imported by a page, the React runtime won't
  hydrate it, and the widget will render as inert server markup.
  That's a pre-existing problem — the upgrade neither creates nor
  masks it — but it is now the most obvious loose thread in the
  React layer, and the next person to touch Calendly should treat
  it as the first thing to fix.
- **Contributor onboarding:** The 19.x patterns worth knowing if a
  future island lands here are ref-as-prop on function components
  (no more `forwardRef` boilerplate), `useActionState` replacing
  `useFormState`, and the legacy-context / string-refs / class
  `defaultProps`-on-function-components removals. None of those
  apply to the current codebase — flagged here so future PRs don't
  regress into 18-era patterns.
- **Follow-ups:**
  - Decide the fate of `src/components/widgets/Calendly.astro` —
    either wire it into a real contact page (adding `@astrojs/react`,
    `@types/react`, `@types/react-dom`, and a `client:load`
    directive in the same PR) or delete it.
  - Phase 6 on the roadmap: rename the package away from
    `@onwidget/astrowind`.
  - If any React island lands later, revisit whether
    `@astrojs/preact` is worth considering at that point — the
    decision is less clear-cut for islands than for a zero-React
    codebase.

## Notes

- **Breaking-change sweep:** grepped `src/` for `forwardRef`,
  `propTypes`, `defaultProps`, `contextTypes`, `getChildContext`,
  `ReactDOM.render`, and `useFormState`. Zero matches. No code
  changes were required for React 19 semantic differences, because
  no first-party code exercises any of those APIs.
- **Dependency versions landed on:**
  - `react` `^19.2.5` (from `^18.3.1`)
  - `react-dom` `^19.2.5` (from `^18.3.1`)
  - `react-calendly` `^4.4.0` (from `^4.3.1`)
- **`react-calendly` compatibility verdict:** 4.4.0 (May 2025
  release) declares `"react": ">=16.8.0"` and
  `"react-dom": ">=16.8.0"` as peer deps. React 19.2.5 installs
  cleanly against that range with no `--force` or
  `--legacy-peer-deps`. No known runtime issues in the release notes
  touching 19-specific behavior (hydration, `useId`, etc.).
- **Not bumped:** `@types/react`, `@types/react-dom`, and
  `@astrojs/react` were considered and deliberately not added — see
  Alternatives. If any of them show up in a future PR, that PR
  should also add JSX code that exercises them.
- **CI:** `npm install` (no flags) succeeded. `npm run check:astro`
  passed (0 errors / 0 warnings / 0 hints across 95 files).
  `npm run check:eslint` passed. `npm run build` proceeded past the
  React/Vite stages cleanly and failed at the same Contentful
  `accessToken` secret gate documented in the Astro 5 and Tailwind
  ADRs — CI and Vercel have the real `CONTENTFUL_*` secrets.
  `npm run dev` booted in ~400 ms with no React or hydration
  warnings in the console. The client bundle built by the Vite
  stage contains 13 modules, none of them React — confirming that
  Calendly.astro's `react-calendly` import is tree-shaken out.
- **Manual QA scope for the merge gate (HS-6):** the user should
  walk any page that currently embeds the Calendly widget on the
  deployed site and confirm it still loads, but given that this
  repo's `Calendly.astro` is an orphan, the practical QA here is a
  general island smoke test (there are none), plus a console check
  during production navigation after Vercel redeploys with the real
  secrets. No React 19-specific UI regressions are expected because
  no React runs in the browser on this site today.
- No env vars, secrets, or external-service touchpoints were added
  or changed as part of this upgrade.
