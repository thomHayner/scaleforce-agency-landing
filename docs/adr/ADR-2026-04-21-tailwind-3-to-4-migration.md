---
id: ADR-2026-04-21-tailwind-3-to-4-migration
title: Migrate Tailwind CSS 3 to 4 with CSS-first config and the Vite plugin
status: accepted
date: 2026-04-21
deciders: [thomHayner, claude-opus-4-7]
tags: [tailwind, upgrade, css, vite]
supersedes: []
superseded_by: []
related: [ADR-2026-04-21-astro-4-to-5-upgrade, ADR-2026-04-21-node-ts-baseline-bump]
source: claude-code-session-2026-04-21 tailwind-3-to-4-migration
---

## Context

Phase 4 of the multi-phase upgrade roadmap. Phases 0–3 landed on `dev`:
CI hardening, Astro 5 + Content Layer, and the Node 22+ / TypeScript
5.9.3 baseline. The stack is now on Astro 5.18.1 but still Tailwind
3.4.11 via the `@astrojs/tailwind` integration (5.1.5).

Two forces push this phase now:

- **`@astrojs/tailwind` is not the supported path for Tailwind 4.** The
  official Astro guide for Tailwind 4
  (https://tailwindcss.com/docs/installation/framework-guides/astro)
  documents only the `@tailwindcss/vite` Vite-plugin route. The
  `@astrojs/tailwind` integration still peer-resolves `tailwindcss@^3`
  and is effectively unmaintained against v4.
- **Tailwind 4 is a config-paradigm shift, not a drop-in bump.** The
  JS `tailwind.config.js` is replaced by CSS-first `@theme` blocks
  inside the main stylesheet; `@tailwind base/components/utilities`
  collapses to a single `@import "tailwindcss";`; custom utilities
  that used to live under `@layer utilities` now register via the
  `@utility` directive; plugins register via `@plugin "…";` in CSS
  rather than `plugins: [...]` in JS; the default `border-color`
  silently changed from `gray-200` to `currentColor`; a handful of
  utility names were renamed (`flex-shrink-*` → `shrink-*`,
  `outline-none` → `outline-hidden`, the `*-opacity-*` family → the
  `/<value>` slash modifier).

The repo started from the AstroWind template, which leans on several
of these touch points: custom theme tokens mapped onto `--aw-*` CSS
variables, class-based dark mode, and a `.btn` / `.btn-primary` /
`.btn-secondary` / `.btn-tertiary` component stack composed through
`@apply`. A naive bump would break at least the border default and
the composed `@apply btn` chain.

## Decision

Replace `@astrojs/tailwind` with the `@tailwindcss/vite` plugin
(wired through `astro.config.ts`'s `vite.plugins` array), bump
`tailwindcss` to `^4.2.4`, `@tailwindcss/typography` to `^0.5.19`
(still on the 0.5 line — Tailwind 4 support was added in
`0.5.16`+; no `1.x` major exists), and `tailwind-merge` to `^3.5.0`
(the 3.x line is the Tailwind-4-compatible track; 2.x is
Tailwind-3-only). Delete `tailwind.config.js` at the repo root.
Port every `theme.extend` entry into `@theme` inside
`src/assets/styles/tailwind.css`, using the
`--color-<name>` / `--font-<name>` variable naming that v4 derives
utilities from. Register `@tailwindcss/typography` via
`@plugin "@tailwindcss/typography";` in the same file. Preserve
class-based dark mode with `@custom-variant dark (&:where(.dark, .dark *));`
(v4 otherwise defaults to `prefers-color-scheme`). Restore the v3
default border color with an `@layer base` reset so existing borders
don't silently inherit `currentColor`. Convert the custom utility
layer (`.bg-page`, `.bg-dark`, `.bg-light`, `.text-page`,
`.text-muted`) to `@utility` blocks so they remain addressable from
`@apply`. Convert `.btn` and its variants to `@utility` blocks so
`@apply btn …` still composes inside `.btn-primary` / `.btn-secondary`
/ `.btn-tertiary` (v4's `@apply` can only reference utilities, not
arbitrary component classes). Rename the two `flex-shrink-0`
occurrences to `shrink-0` (the v3 name was dropped in v4).

## Alternatives considered

- **Stay on Tailwind 3.4.x with `@astrojs/tailwind`.** Rejected.
  Tailwind 3 stopped receiving feature work at the 4.0 GA and is
  accumulating drift from the ecosystem (typography, tailwind-merge,
  and new Astro template scaffolds all target v4 now). The
  `@astrojs/tailwind` integration is unmaintained against v4, so
  staying on 3 means staying on that integration indefinitely. The
  migration cost compounds the longer we wait.
- **Keep the JS config via the `@config` directive.** Rejected.
  Tailwind 4 supports `@config "../tailwind.config.js";` as a
  backward-compatibility escape hatch, but it drops support for
  `corePlugins`, `safelist`, and `separator`, and defeats the main
  reason the upgrade is worth doing at all — consolidating theme
  tokens next to the CSS that consumes them, and removing the
  `tailwindcss/defaultTheme` JS import that required a separate Node
  module round-trip. The existing `theme.extend` in
  `tailwind.config.js` is small (5 colors, 3 font families); porting
  it to CSS is a one-time ~30-line change.
- **Fork `@astrojs/tailwind` for v4 compatibility.** Rejected. The
  integration is a thin wrapper around PostCSS in v3; in v4 PostCSS
  is no longer the entry point (the Vite plugin is), so "forking"
  would mean rewriting to match what `@tailwindcss/vite` already does.
  No value added.
- **Bump `@tailwindcss/typography` past `0.5.x`.** Not applicable —
  the plugin's current latest is `0.5.19`, and Tailwind 4 support
  was added within the 0.5 line (peer range `>=3.0.0 || >=4.0.0-alpha.20`).
  There is no 1.x or 0.6.x to bump to.

## Consequences

- **Positive:** One CSS file (`src/assets/styles/tailwind.css`) now
  owns the entire design-token surface — colors, fonts, dark-mode
  variant, plugin registration, custom utilities, and button
  components. Future contributors no longer need to reconcile a JS
  config with the CSS that uses it. The Vite plugin route also drops
  one integration from `astro.config.ts` and removes
  `tailwindcss/defaultTheme` from the runtime graph. CSS build time
  dropped to ~600 ms (`vite transforming`) in the local build.
- **Negative:** CSS-first config is a paradigm shift. Contributors
  who know v3 will need to learn `@theme`, `@utility`, `@plugin`,
  `@custom-variant`, and the rule that `@apply` in v4 can only
  reference utilities (not arbitrary component classes). The `.btn`
  composition had to move from `@layer components` to `@utility`
  blocks to preserve the `@apply btn …` chain. The default
  `border-color` change required a compatibility shim in
  `@layer base`; dropping that shim later is a visual-QA gate.
- **Visual QA is the blocking follow-up.** The typecheck, lint, and
  build (past the pre-existing Contentful secret gate) all pass, but
  Tailwind 4 ships several subtle rendering changes — the border
  default, the `outline-none` semantic shift (now renders a
  transparent 2px outline rather than no outline at all), and the
  shadow-scale rename. None of these can be caught by `astro check`.
  The merge to `main` must be gated on a user walkthrough of home,
  pricing, blog index + post, the Calendly-embedded contact page,
  404, dark-mode toggle, and mobile breakpoints against the current
  prod deploy.
- **Follow-ups:**
  - Phase 5: React 19 upgrade.
  - Phase 6: rename the package away from `@onwidget/astrowind`.
  - Post-merge: audit `focus:outline-none` usages and decide whether
    to migrate to `focus:outline-hidden` (v4's renamed equivalent)
    now that the v3 meaning no longer matches the v4 implementation.
  - Post-merge: consider dropping the `border-color` compatibility
    shim once every component has been audited for explicit
    `border-*` color classes.

## Notes

- `@apply` inventory: 10 instances, all in
  `src/assets/styles/tailwind.css`. No `.astro` `<style>` blocks,
  `.tsx`, or `.css` files outside that entry use `@apply`, so the
  `@reference` directive (v4's cross-file `@apply` escape hatch) is
  not needed anywhere in this repo.
- `theme()` function inventory: 0 instances. Nothing to port.
- Deprecated-utility sweep: `flex-shrink-0` → `shrink-0` (2
  occurrences in `src/components/widgets/Features3.astro` and
  `src/components/widgets/FAQs.astro`). No `bg-opacity-*`,
  `text-opacity-*`, `ring-opacity-*`, `decoration-slice`,
  `decoration-clone`, or `overflow-ellipsis` usages. `outline-none`
  appears 4 times in focus-ring recipes; left as-is because the
  surrounding `focus:ring-*` classes compose with either v3 or v4
  semantics, but flagged for post-merge review.
- Peer conflicts on `npm install`: only a transient warning about
  `@astrojs/tailwind@5.1.5` during the install step, which resolved
  cleanly because that package was removed from `package.json` and
  did not survive into `node_modules/` or the final `package-lock.json`.
  `npm install` (without `--force`) succeeded.
- `npm run check:astro` and `npm run check:eslint` both pass.
  `npm run build` progresses past the Tailwind/Vite stage (CSS
  transforms compile cleanly) and fails on the same Contentful
  `accessToken` gate documented in the Astro 5 ADR — CI and Vercel
  have the real `CONTENTFUL_*` secrets. `npm run dev` also starts
  cleanly on `http://localhost:4321/`.
- No env vars, secrets, or external-service touchpoints were added
  or changed as part of this upgrade.
