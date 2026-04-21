# ScaleForce.agency Landing and Lead Generation Site
Built on top of the AstroWind template from [onWidget](https://onwidget.com).  **AstroWind** is a free and open-source template to make your website using **[Astro 4.0](https://astro.build/) + [Tailwind CSS](https://tailwindcss.com/)**.

[![Netlify Status](https://api.netlify.com/api/v1/badges/6827720e-01b1-4d10-a380-6e58995a83d3/deploy-status)](https://app.netlify.com/sites/scaleforce/deploys)

<br>

<details open>
<summary>Table of Contents</summary>

- [Customizations, Packages, Integrations and Extensions](#customizations-packages-integrations-and-extensions)
- [DevOps](#devops)
- [AstroWind Template Docs](#astrowind-template-docs)
  - [Getting started](#getting-started)
    - [Project structure](#project-structure)
    - [Commands](#commands)
    - [Configuration](#configuration)
    - [Customize Design](#customize-design)
  - [Acknowledgements](#acknowledgements)
  - [License](#license)

</details>

<br>

## Customizations, Packages, Integrations and Extensions

Astro is a great base to start building static websites from and AstroWind is even better.  It has a library of prebuilt components to use when designing your site and it can be customized as much as needed.

- [Google Tags Manager](https://tagmanager.google.com/): This site uses GTM for advanced analytics and conversion tracking.  AstroWind has support for basic [Google Analytics (GA4)](https://analytics.google.com/) but not for GTM.  I build a simple custom integration for GTM that matches the pattern used by AstroWind for GA4.

- [Contentful & Astro Integration](https://docs.astro.build/en/guides/cms/contentful/): This site uses the [Contentful SDK](https://github.com/contentful/contentful.js) integration from [Contentful](https://www.contentful.com) to provides image hosting and blog posts.

- [npm react-calendly](https://www.npmjs.com/package/react-calendly): This site uses an integration with Calendly to embed their platform's calendar and scheduling components.

- [airtable](https://www.npmjs.com/package/airtable): Originally I had planned to use [Airtable](https://www.airtable.com/) as a custom CMS.  There is no Airtable & Astro integration avaialble so I built a custom integration with a REST API (the file is still in this repo, located [here](https://github.com/ScaleForceAgency/scaleforce-agency-landing/blob/main/src/integrations/astro-airtable/astro-airtable.ts)) to connect to Airtable, as well as a [Make.com](https://www.Make.com) webhook automation to trigger a Netlify "Build & Deploy" sequence (it used a button in one of the Airtable columns that would trigger the webhook and tell Netlify to build and deploy to production).  Airtable uses dynamic links for imagesthat change every 1-2 days, so it does not suport image hosting for static sites.  That meant I would need to use Contentful for images, and I decided to remove Airtable altogether from this project.  I left the legacy code there as an example of how to integrate Aitable into Astro as a custom CMS.

<br>

## DevOps

### Branching workflow

This repo uses a `feature → dev → main` flow:

- **`main`** — production. Deploys to the live site. Never push directly; merges land only via PR from `dev`.
- **`dev`** — staging. Integration branch used to verify changes on the staging deploy before release.
- **feature branches** — short-lived branches (e.g. `feat/...`, `fix/...`, `chore/...`) cut from `dev`.

Standard flow:

1. Branch from `dev`: `git checkout dev && git pull && git checkout -b feat/my-change`
2. Open a PR targeting `dev`. CI must pass.
3. Once merged to `dev`, verify on the staging deploy.
4. When a release is ready, open a PR from `dev` → `main`. Merging triggers the production deploy.

Hotfixes may branch from `main` directly, but must be back-merged to `dev` immediately after release.

### Netlify

There are currently two Netlify "Build & Deploy" triggers.  

The first trigger is a code push to the ```main``` branch of the [GitHub repository](https://github.com/scaleforce-agency/scaleforce-agency-landing) for this website (which is probably where you are reading this README file right now).  This trigger handles any approved pull requests and code updates.

The second trigger is the change in status to ```published``` for blog posts within my Contentful CMS.  That trigger handles content changes and blog updates.

### GitHub

To update this repo with upstream changes made to the original AstroWind Template, use the following commands:

``` git remote add template https://github.com/onwidget/astrowind.git```

``` git fetch --all ```

``` git merge template/main --allow-unrelated-histories ```

More info here [https://docs.github.com/en/get-started/getting-started-with-git/managing-remote-repositories](https://docs.github.com/en/get-started/getting-started-with-git/managing-remote-repositories).

<br>

## AstroWind Template Docs

The rest of this document contains the original AstroWind template README, credit to the original template developer [onWidget](https://onwidget.com), and the original template [LICENSE](./LICENSE.md).

<br>

### Getting started

**AstroWind** tries to give you quick access to creating a website using [Astro 4.0](https://astro.build/) + [Tailwind CSS](https://tailwindcss.com/). It's a free theme which focuses on simplicity, good practices and high performance.

Very little vanilla javascript is used only to provide basic functionality so that each developer decides which framework (React, Vue, Svelte, Solid JS...) to use and how to approach their goals.

In this version the template supports all the options in the `output` configuration, `static`, `hybrid` and `server`, but the blog only works with `prerender = true`. We are working on the next version and aim to make it fully compatible with SSR.

#### Project structure

Inside **AstroWind** template, you'll see the following folders and files:

```
/
├── public/
│   ├── _headers
│   └── robots.txt
├── src/
│   ├── assets/
│   │   ├── favicons/
│   │   ├── images/
│   │   └── styles/
│   │       └── tailwind.css
│   ├── components/
│   │   ├── blog/
│   │   ├── common/
│   │   ├── ui/
│   │   ├── widgets/
│   │   │   ├── Header.astro
│   │   │   └── ...
│   │   ├── CustomStyles.astro
│   │   ├── Favicons.astro
│   │   └── Logo.astro
│   ├── content/
│   │   ├── post/
│   │   │   ├── post-slug-1.md
│   │   │   ├── post-slug-2.mdx
│   │   │   └── ...
│   │   └-- config.ts
│   ├── layouts/
│   │   ├── Layout.astro
│   │   ├── MarkdownLayout.astro
│   │   └── PageLayout.astro
│   ├── pages/
│   │   ├── [...blog]/
│   │   │   ├── [category]/
│   │   │   ├── [tag]/
│   │   │   ├── [...page].astro
│   │   │   └── index.astro
│   │   ├── index.astro
│   │   ├── 404.astro
│   │   ├-- rss.xml.ts
│   │   └── ...
│   ├── utils/
│   ├── config.yaml
│   └── navigation.js
├── package.json
├── astro.config.mjs
└── ...
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory if they do not require any transformation or in the `assets/` directory if they are imported directly.

[![Edit AstroWind on CodeSandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://githubbox.com/onwidget/astrowind/tree/main) [![Open in Gitpod](https://svgshare.com/i/xdi.svg)](https://gitpod.io/?on=gitpod#https://github.com/onwidget/astrowind) [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/onwidget/astrowind)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file `README.md`. Update `src/config.yaml` and contents. Have fun!

<br>

#### Commands

All commands are run from the root of the project, from a terminal:

| Command             | Action                                             |
| :------------------ | :------------------------------------------------- |
| `npm install`       | Installs dependencies                              |
| `npm run dev`       | Starts local dev server at `localhost:3000`        |
| `npm run build`     | Build your production site to `./dist/`            |
| `npm run preview`   | Preview your build locally, before deploying       |
| `npm run check`     | Check your project for errors                      |
| `npm run fix`       | Run Eslint and format codes with Prettier          |
| `npm run astro ...` | Run CLI commands like `astro add`, `astro preview` |

<br>

#### Configuration

Basic configuration file: `./src/config.yaml`

```yaml
site:
  name: 'Example'
  site: 'https://example.com'
  base: '/' # Change this if you need to deploy to Github Pages, for example
  trailingSlash: false # Generate permalinks with or without "/" at the end

  googleSiteVerificationId: false # Or some value,

# Default SEO metadata
metadata:
  title:
    default: 'Example'
    template: '%s — Example'
  description: 'This is the default meta description of Example website'
  robots:
    index: true
    follow: true
  openGraph:
    site_name: 'Example'
    images:
      - url: '~/assets/images/default.png'
        width: 1200
        height: 628
    type: website
  twitter:
    handle: '@twitter_user'
    site: '@twitter_user'
    cardType: summary_large_image

i18n:
  language: en
  textDirection: ltr

apps:
  blog:
    isEnabled: true # If the blog will be enabled
    postsPerPage: 6 # Number of posts per page

    post:
      isEnabled: true
      permalink: '/blog/%slug%' # Variables: %slug%, %year%, %month%, %day%, %hour%, %minute%, %second%, %category%
      robots:
        index: true

    list:
      isEnabled: true
      pathname: 'blog' # Blog main path, you can change this to "articles" (/articles)
      robots:
        index: true

    category:
      isEnabled: true
      pathname: 'category' # Category main path /category/some-category, you can change this to "group" (/group/some-category)
      robots:
        index: true

    tag:
      isEnabled: true
      pathname: 'tag' # Tag main path /tag/some-tag, you can change this to "topics" (/topics/some-category)
      robots:
        index: false

    isRelatedPostsEnabled: true # If a widget with related posts is to be displayed below each post
    relatedPostsCount: 4 # Number of related posts to display

analytics:
  vendors:
    googleAnalytics:
      id: null # or "G-XXXXXXXXXX"
    googleTags Manager:
      id: null # or "GTM-XXXXXXXX"

ui:
  theme: 'system' # Values: "system" | "light" | "dark" | "light:only" | "dark:only"
```

<br>

#### Customize Design

To customize Font families, Colors or more Elements refer to the following files:

- `src/components/CustomStyles.astro`
- `src/assets/styles/tailwind.css`

<br>

### Acknowledgements

Initially created by [onWidget](https://onwidget.com) and maintained by a community of [contributors](https://github.com/onwidget/astrowind/graphs/contributors).

<br>

### License

**AstroWind** is licensed under the MIT license — see the [LICENSE](./LICENSE.md) file for details.
