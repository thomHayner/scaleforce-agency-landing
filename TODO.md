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
