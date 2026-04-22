# TODO

## Author attribution (syndicated posts)

The `thomhayner` loader (`src/lib/thomhayner/thomhayner.ts`) currently hardcodes
`author: "Thom Hayner"` because `Post.author` is a plain string. Next step is a
richer author model:

- Introduce an `author` content type in Contentful — or a static map in
  `src/config.yaml` — with `name`, `avatarUrl`, `bio`, `personalSite`.
- Resolve `post.author` to that entry in `src/utils/blog.ts`.
- Update `src/components/blog/SinglePost.astro` to render an author block
  (avatar + bio + link to personal site) when the author resolves.

Until then, every syndicated post's byline simply reads "Thom Hayner".

## Brand identity follow-ups (Phase 7 Wave 3+)

Deferred from Wave 2 ([docs/brand/guidelines.md](docs/brand/guidelines.md)):

- **SVG logo with light/dark variants.** Replace `src/assets/images/logo.png`
  with a vector source that inherits `currentColor`, then update
  `src/components/Logo.astro` to use it. Removes the raster-density hack
  and lets the mark sit on any surface.
- **Regenerate `src/assets/images/default.png`** (1200×628 OG image) using
  the new palette + current wordmark. Requires image tooling.
- **Re-verify `src/assets/favicons/favicon.svg`** against the new cobalt
  palette — currently untouched from the AstroWind default.
