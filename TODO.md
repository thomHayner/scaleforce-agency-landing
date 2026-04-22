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

## Brand identity follow-ups (Phase 7 Wave 4+)

Deferred from Wave 3 ([docs/brand/guidelines.md](docs/brand/guidelines.md)):

- **Per-page OG images.** `scripts/build-og.mjs` only emits the default.
  Extend to per-route (e.g. per blog post) OGs — likely as an Astro
  endpoint that calls the same satori template with dynamic title/excerpt.
- **Apple touch icon regen.** `src/assets/favicons/apple-touch-icon.png`
  is still the original raster; re-render through the satori pipeline
  for consistency with the favicon + OG mark.
- **True vector logo source.** The current chip mark only exists as a
  180×180 PNG (`apple-touch-icon.png`) + a coarse potrace (`favicon.svg`).
  The header logo and OG image both use the PNG, which is fine at small
  sizes but not ideal. Produce a true-vector source (from the original
  design file if one exists, otherwise a high-fidelity retrace) so the
  logo can use `currentColor`, scale indefinitely, and support light/dark
  variants cleanly.
