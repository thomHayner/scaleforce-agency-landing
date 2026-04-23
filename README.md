# Scaleforce Agency Landing

Marketing and lead-generation site for [ScaleForce.agency](https://ScaleForce.agency), an AI / automations / operations agency. Built with Astro 5 and Tailwind 4, with blog content aggregated from local markdown, Contentful, and the author's personal blog at `thomhayner.com`.

## Quick start

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to ./dist/
npm run preview  # preview the production build locally
```

Dev server defaults to `http://localhost:4321`.

## Required environment variables

Set these in the Vercel project (Production + Preview + Development) or in a local `.env` for development. See [`.env.example`](.env.example) for a template.

### Build-time (content sources)

The build pulls content from external sources and will fail without these set:

| Variable | Purpose |
| --- | --- |
| `CONTENTFUL_SPACE_ID` | Contentful space for CMS-authored blog posts and case studies. |
| `CONTENTFUL_DELIVERY_TOKEN` | Contentful Content Delivery API token (published content). |
| `CONTENTFUL_PREVIEW_TOKEN` | Contentful Preview API token (draft content in preview mode). |
| `AIRTABLE_API_KEY` | Airtable API key (legacy integration; see `src/lib/astro-airtable/`). |
| `AIRTABLE_BASE_ID` | Airtable base id used by the legacy integration. |

The Airtable integration is not currently wired into the default build but the env vars are still referenced by the legacy code in the repo.

### Runtime (contact-form serverless function)

These are consumed only by the `api/contact.ts` Vercel Function at request time. The static build does not depend on them.

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend API key used by the contact-form serverless function (`api/contact.ts`). |
| `CONTACT_TO_EMAIL` | Destination inbox for contact-form submissions. |
| `CONTACT_FROM_EMAIL` | Verified Resend sender used as the `From:` address on contact-form mail. |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Astro dev server. |
| `npm run build` | Produce a production build in `./dist/`. |
| `npm run preview` | Serve the built `./dist/` locally. |
| `npm run check` | Run `check:astro` then `check:eslint`. |
| `npm run check:astro` | Astro type/diagnostic check (`astro check`). |
| `npm run check:eslint` | ESLint across the repo. |
| `npm run fix` | `eslint --fix` across the repo. |
| `npm run astro ...` | Pass-through to the Astro CLI. |

## Tech stack

- [Astro 5](https://astro.build/) — static-site generation, content collections, image pipeline.
- [Tailwind CSS 4](https://tailwindcss.com/) — CSS-first theme via `@tailwindcss/vite`.
- [TypeScript 5.9](https://www.typescriptlang.org/) — strict mode.
- [React 19](https://react.dev/) — used for Calendly embeds and isolated interactive components.
- [Node 22+](https://nodejs.org/) — required runtime for local dev and CI.
- [Contentful](https://www.contentful.com/) — CMS for blog / case-study content.
- [Vercel](https://vercel.com/) — production hosting.

## Branching workflow

`feature → dev → main`:

- **`main`** — production. Deploys to the live site. PRs only, from `dev`.
- **`dev`** — staging. Integration branch.
- **feature branches** — short-lived (`feat/...`, `fix/...`, `chore/...`) cut from `dev`.

Standard flow:

1. `git checkout dev && git pull && git checkout -b feat/my-change`
2. Open a PR targeting `dev`. CI must pass.
3. Once merged to `dev`, verify on the staging deploy.
4. When a release is ready, open a PR from `dev` → `main`. Merging triggers the production deploy.

Hotfixes may branch from `main` directly, but must be back-merged to `dev` immediately after release.

## Architectural decisions

Non-trivial design choices are recorded as ADRs under [`docs/adr/`](docs/adr/README.md). Start there for the *why* behind the phased Astro / Tailwind / React upgrades, the multi-source blog architecture, the CI layout, and the detach from the AstroWind template.

## Credits

This codebase started from the [AstroWind](https://github.com/onwidget/astrowind) template (MIT-licensed, © onWidget) and has since diverged substantially — it now runs Astro 5, Tailwind 4, React 19, and Node 22+, with a bespoke multi-source blog pipeline, custom CI, and an ADR-based decision log. Upstream AstroWind is no longer tracked; future upgrades are owned directly here. See [`docs/adr/ADR-2026-04-21-detach-from-astrowind-template.md`](docs/adr/ADR-2026-04-21-detach-from-astrowind-template.md) for the decision record.

## License

MIT — see [`LICENSE.md`](./LICENSE.md).
