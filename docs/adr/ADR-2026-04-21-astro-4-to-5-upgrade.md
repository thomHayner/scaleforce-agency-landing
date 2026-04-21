---
id: ADR-2026-04-21-astro-4-to-5-upgrade
title: Upgrade Astro 4 to 5 and migrate to the Content Layer API
status: accepted
date: 2026-04-21
deciders: [thomHayner, claude-opus-4-7]
tags: [astro, upgrade, content-layer]
supersedes: []
superseded_by: []
related: [ADR-2026-04-21-multi-source-blog-architecture]
source: claude-code-session-2026-04-21 astro-4-to-5-upgrade
---

## Context

Phase 2 of the multi-phase upgrade roadmap. Phases 0 and 1 landed on
`dev` already (CI split into `typecheck` / `lint` / `build (20)` /
`build (22)`, prettier removed, generated `env.d.ts` lint-clean). The
stack is still on Astro 4.15.5, which went end-of-life at the 5.0 GA
in late 2024 and no longer receives patch releases.

Astro 5 brings two changes we want early:

- **Content Layer API** — `loader: glob(...)` from `astro/loaders`
  replaces the legacy `type: 'content'` / `type: 'data'` collections.
  The multi-source blog (local MD + Contentful + thomhayner.com) is
  built around pluggable content sources, so moving onto the Content
  Layer puts us on the supported path for the custom Contentful and
  thomhayner loaders that already live in `src/lib/`.
- **Vite 6 under the hood**, plus the `<ViewTransitions />` →
  `<ClientRouter />` rename.

The immediate tension is that Astro 5 lands alongside two other
upgrades we have deliberately scoped out of this phase: Tailwind 4
(Phase 4) and React 19 (Phase 5). Both touch Vite's transform
pipeline, which means stacking them on top of Astro 5 in a single PR
would make a bad diff to bisect if a regression appeared.

## Decision

Bump `astro` from 4.15.5 to 5.18.1, bump every `@astrojs/*`
integration to its newest Astro-5-compatible release, and migrate the
local `post` content collection from the legacy `type: 'content'`
shape to the new Content Layer `loader: glob(...)` shape. Adjust
`getNormalizedPost` in `src/utils/blog.ts` so it uses `post.id` (the
new slug-shaped identifier) and the `render(post)` helper from
`astro:content`. Rename `<ViewTransitions />` to `<ClientRouter />`
in `src/layouts/Layout.astro`, and replace the removed
`MarkdownAstroData` type export with an inlined type in
`src/utils/frontmatter.ts`. Leave `@astrojs/tailwind` on 5.1.0,
Tailwind on 3.4, React on 18.3, and Node on the 20/22 matrix.

## Alternatives considered

- **Bundle Astro 5 + Tailwind 4 into one PR.** Rejected. Both touch
  the Vite transform pipeline and both have a non-trivial blast
  radius (Tailwind 4 replaces the PostCSS plugin and changes the
  config file format). Stacking them would destroy our ability to
  bisect a regression to a single upgrade. The cost of two sequential
  PRs is one extra CI cycle; the benefit is a clean bisect surface.
- **Stay on Astro 4.** Rejected. Astro 4 is end-of-life with no
  further patches — every security advisory on top of Astro 4 would
  force us to jump to 5 as the minimum fix, except in a panic rather
  than on a planned cadence. The Content Layer API is also where new
  features are landing, so staying on 4 means we eventually pay the
  migration cost anyway, just with more drift accumulated.
- **Bump `@astrojs/mdx` to 5.x to match its published `latest` tag.**
  Rejected. `@astrojs/mdx@5` peer-requires `astro@^6`. Holding at
  `@astrojs/mdx@4.3.14`, the final Astro-5-compatible release, is
  the right call until the Astro 6 phase.

## Consequences

- **Positive:** Content Layer puts the local `post` collection on
  the same abstraction as the custom Contentful and thomhayner
  loaders, so the multi-source blog architecture (see
  ADR-2026-04-21-multi-source-blog-architecture) has a single
  mental model going forward. Vite 6 brings faster cold-start and
  unblocks downstream ecosystem upgrades.
- **Negative:** `post.slug` is gone; `post.id` is now the slug-like
  identifier. Any future code that reaches into a collection entry
  has to use `post.id` (or derive a slug with `cleanSlug`). We now
  carry a small inline type for `file.data.astro.frontmatter`
  because `MarkdownAstroData` was dropped from
  `@astrojs/markdown-remark`'s public surface.
- **Follow-ups:**
  - Phase 3: bump TypeScript to 5.8 (this PR stays on 5.6.2 to keep
    the diff focused).
  - Phase 4: Tailwind 4 + `@astrojs/tailwind` 6.x (or the CSS-first
    path that drops the integration).
  - Phase 5: React 19.
  - Phase 6: rename the package away from `@onwidget/astrowind`.

## Notes

- Integration version matrix captured on the PR body. `@astrojs/mdx`
  is pinned to `^4.3.14` by design — its 5.x line requires Astro 6.
- `npm run check:astro` and `npm run check:eslint` both pass locally
  after the migration. `npm run build` fails in the worktree only
  because the Contentful SDK throws on a missing `accessToken`; CI
  and Vercel have the real `CONTENTFUL_*` and Airtable secrets.
- No env vars, secrets, or external-service touchpoints were added
  or changed as part of this upgrade.
