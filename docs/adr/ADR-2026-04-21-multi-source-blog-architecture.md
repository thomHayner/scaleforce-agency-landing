---
id: ADR-2026-04-21-multi-source-blog-architecture
title: Aggregate blog posts from three independent content sources
status: accepted
date: 2026-04-21
deciders: [thom]
tags: [blog, content, architecture]
supersedes: []
superseded_by: []
related: []
source: retroactive capture of commit d50abdb (feat(blog): add thomhayner.com as a third content source)
---

## Context

The blog was originally a single source: local markdown via Astro content collections (`src/content/post/**`). Contentful was then added as a second source for case-study content that non-developers could edit in a CMS UI. A third source — syndicated posts from the author's personal blog at `thomHayner/thomHayner.com` — is now being added, loaded at build time via the public GitHub API and filtered to posts with `crossPostTo: ['scaleforce']` in their frontmatter.

The design question was whether to keep these as three independent sources merged at read time, or to consolidate into one authoring surface. Each source has different authorship constraints: local markdown is developer-authored and lives with the code; Contentful is CMS-authored by non-developers; the personal blog is authored in markdown in a separate repo and its SEO canonical must remain pointed at the original domain.

## Decision

Keep three independent content sources and merge them at read time inside [`src/utils/blog.ts`](src/utils/blog.ts). Each source owns its own fetching and normalization:

- **Local markdown** — Astro content collections in `src/content/post/**`.
- **Contentful** — [`src/lib/contentful/contentful.ts`](src/lib/contentful/contentful.ts) for case studies.
- **thomhayner.com** — [`src/lib/thomhayner/thomhayner.ts`](src/lib/thomhayner/thomhayner.ts) via the public GitHub API, opt-in per post via `crossPostTo` frontmatter.

All three are normalized to a common `Post` shape so templates stay source-agnostic. Syndicated posts render with a canonical URL pointing back to `thomhayner.com` so SEO attribution stays with the original.

## Alternatives considered

- **Mirror all content into local markdown** — rejected: duplicates content, requires a sync pipeline from Contentful and from the personal blog, and creates a canonical-URL headache for syndicated posts. Authors would have to push to two places for every post.
- **Mirror all content into Contentful** — rejected: the personal blog's authoring workflow is markdown-in-a-repo; forcing dual-author into Contentful breaks that workflow and couples the personal blog to this site's CMS choice.
- **Drop content collections, keep only Contentful + thomhayner** — rejected: existing local posts would need migration, and the repo loses the ability to ship developer-authored content alongside code changes without a round-trip through the CMS. Also increases free-tier dependency on Contentful.
- **Build at fetch time / ISR instead of static-at-build** — rejected: Astro's default SSG is sufficient for this volume; the GitHub API is fast enough at build time; no CMS webhook infrastructure exists for the syndicated source, so incremental revalidation has no real trigger.

## Consequences

- **Positive:** each content source evolves independently; the personal blog stays authored in its own repo; SEO attribution stays correct via canonical URLs; templates consume a single normalized shape; developer-authored posts can ship in the same PR as code changes.
- **Negative:** the build now depends on GitHub API availability for the syndicated source; three fetch paths to maintain; no unified author entity — each source carries its own author metadata shape.
- **Follow-ups:**
  - Define a shared "author" content type so syndicated posts carry rich author metadata consistently across sources ([TODO.md](TODO.md)).
  - Add GitHub API caching / ETag handling if build flakiness from the syndicated fetch becomes a problem.
  - Decide how to handle thomhayner.com being unreachable at build time (fail the build vs. skip syndicated posts with a warning).

## Notes

Retroactive capture of the design introduced in commit `d50abdb`. The `crossPostTo: ['scaleforce']` opt-in is important: syndication is pull-based and explicit, so the author controls which personal posts appear here by editing frontmatter in the source repo.
