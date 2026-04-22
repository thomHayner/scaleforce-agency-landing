---
id: ADR-2026-04-22-author-attribution-model
title: Unify author attribution across blog sources via Contentful `author` content type
status: accepted
date: 2026-04-22
deciders: [thomHayner]
tags: [contentful, blog, content-model]
supersedes: []
superseded_by: []
related: [ADR-2026-04-21-multi-source-blog-architecture]
source: claude-code-session-2026-04-22
---

## Context

The blog aggregates posts from three sources: local markdown
(`src/content/post/`), Contentful case studies (a future `useCasePost`
content type — not yet defined; the code path is dead today), and
syndicated posts from [thomhayner.com](https://thomhayner.com) pulled
over the GitHub API.

All three normalize to a common `Post` shape in `src/utils/blog.ts`,
but `Post.author` was a plain string. That forced two bad compromises:

1. Local posts had `author: ScaleForce` — a brand name used as an
   identifier, which reads fine on the byline but can't carry a bio,
   avatar, or link.
2. The `thomhayner` loader hard-coded `author: 'Thom Hayner'` with a
   TODO explaining the same limitation.

We needed a single place to store author metadata that every source
could reference by slug, without duplicating per-source author fields
or inventing a static YAML map that would diverge from Contentful.

## Decision

Introduce a Contentful `author` content type and treat `Post.author`
as a **slug reference** (e.g. `scaleforce`, `thom-hayner`) across all
three sources. A new resolver in `src/lib/authors/authors.ts` fetches
and caches all author entries, exposing `getAuthorBySlug(slug)`.
`src/utils/blog.ts` calls the resolver in each of the three normalize
functions and attaches the result as `Post.authorRef`.

`SinglePost.astro` renders a rich byline block (rounded avatar +
name + bio + optional `personalSite` link when `type === 'person'`)
when `authorRef` is present, and falls back to the plain string slug
otherwise. The compact date-row byline prefers `authorRef.name` and
falls back to the slug.

The initial Contentful seed:

- `scaleforce` (organization) — published with the repo logo as avatar.
- `thom-hayner` (person) — **deferred follow-up in this PR.** The
  selfie intended as the avatar wasn't persisted to disk during the
  authoring session, so the asset upload + entry creation couldn't
  complete. Until that entry exists, syndicated thomhayner.com posts
  byline as the literal slug `thom-hayner` (the resolver returns
  `undefined` for an unknown slug and the UI falls back to the plain
  string). Target entry shape: name="Thom Hayner", type="person",
  avatar=selfie, bio="AI Solution Engineer",
  personalSite="https://thomhayner.com".

## Alternatives considered

- **Static `src/config.yaml` author map.** Simpler, no extra fetch,
  no extra Contentful content type to maintain. Rejected because
  authors (especially the ScaleForce brand voice and avatar) change
  more like content than like configuration, and because the
  multi-source blog already depends on Contentful for the case-study
  track — adding a second system of record for author metadata would
  fragment the content model.
- **Per-source author fields** (richer frontmatter on local posts,
  a nested author object on the Contentful `useCasePost` type, a
  separate loader-level map for syndicated posts). Rejected — that's
  three places to update whenever an author's bio, avatar, or site
  changes. The whole point of unifying the three sources is to avoid
  that.
- **Render `socialLinks` in the byline now.** Rejected for this PR
  per design input: `personalSite` already covers attribution for
  Thom, and the one author who has a `personalSite` doesn't have
  separate social links to render. The `socialLinks` field is defined
  on the content type so a future UI change can use it without a
  schema migration, but no byline UI reads it yet.

## Consequences

- **Positive:** Single source of truth for author metadata. All three
  blog sources render consistent bylines. Changing Thom's bio or
  avatar is a Contentful edit, not a code change or a frontmatter
  sweep.
- **Positive:** Adding a new author (e.g. a guest contributor) is an
  entry creation + slug reference on the post — no schema change.
- **Negative:** Build-time dependency on Contentful for author
  resolution. The resolver degrades gracefully (logs and returns
  `undefined`), so an outage shows the string slug, not an error.
- **Negative:** Author entries and asset uploads live in Contentful,
  not git. Changes are outside the PR flow — treat the Contentful
  entries and the code references as coupled, and remember to update
  Contentful when introducing a new slug.
- **Follow-ups:**
  - Wire `Post.authorRef` into author-archive routes (list a specific
    author's posts) if/when we start producing multi-author content.
  - Render `socialLinks` once a second non-personal-site link (X,
    GitHub, etc.) is worth surfacing.
  - When the `useCasePost` content type is eventually defined in
    Contentful, wire its `author` field to the same slug convention
    (the `UseCasePost` TS declaration in `src/lib/contentful/contentful.ts`
    already types `author` as a text slug).

## Notes

- The rounded-avatar decision was explicit user input; the byline
  block renders both `person` and `organization` types with the
  same rounded avatar shape for visual consistency.
- The resolver caches authors for the lifetime of the Astro build
  (`_cache` in `authors.ts`) — one Contentful fetch per build, not
  per post.
- The `thomhayner.ts` loader no longer carries a TODO block; the
  `TODO.md` "Author attribution (syndicated posts)" section is
  removed in this PR.
