---
id: ADR-2026-04-21-detach-from-astrowind-template
title: Detach from the AstroWind template and own the codebase directly
status: accepted
date: 2026-04-21
deciders: [thom]
tags: [project, governance, branding, tooling]
supersedes: []
superseded_by: []
related:
  - ADR-2026-04-21-astro-4-to-5-upgrade
  - ADR-2026-04-21-tailwind-3-to-4-migration
  - ADR-2026-04-21-react-18-to-19-upgrade
  - ADR-2026-04-21-ci-hardening-split-and-eslint-env-override
  - ADR-2026-04-21-multi-source-blog-architecture
source: claude-code-session-2026-04-21 phase-6-detach-from-astrowind
---

## Context

This repo started life as a fork of the [AstroWind](https://github.com/onwidget/astrowind) template (© onWidget, MIT). Several things have changed since then:

- **Upstream is semi-dormant.** Last meaningful commit to `onwidget/astrowind` was August 2025; last release was December 2024. The original maintainer publicly handed the project off. Tracking upstream is no longer a live option — there's effectively nothing to track.
- **This codebase has diverged substantially.** Over the recent phased upgrade series it moved to Astro 5 (ADR-2026-04-21-astro-4-to-5-upgrade), Tailwind 4 with CSS-first `@theme` (ADR-2026-04-21-tailwind-3-to-4-migration), React 19 (ADR-2026-04-21-react-18-to-19-upgrade), Node 22+ as the required runtime, a bespoke multi-source blog pipeline (ADR-2026-04-21-multi-source-blog-architecture), a custom CI layout (ADR-2026-04-21-ci-hardening-split-and-eslint-env-override), and an ADR-based decision log. The "template" framing no longer describes what the repo is.
- **Template-lock-in is less valuable in an LLM-assisted workflow.** The original benefit of staying close to a template was "easy to take upstream updates." With most work now driven by focused, ADR-tracked edits, that benefit is smaller than the cost of retaining template-flavored metadata, README, and branding that misrepresents the project.
- **Package identity is still template-flavored.** `package.json` still says `@onwidget/astrowind` at version `1.0.0-beta.46` (AstroWind's upstream version string). The README is mostly the upstream AstroWind README with a thin Scaleforce preamble. Both are misleading to anyone (human or LLM) reading the repo.

Phase 6 of the phased upgrade is the point to formalize detaching from the template identity.

## Decision

Detach from the AstroWind template. Specifically:

- **Rename the npm package** `@onwidget/astrowind` → `scaleforce-agency-landing` (matches the GitHub repo name, unscoped).
- **Reset the version** `1.0.0-beta.46` → `0.1.0`. This project owns its versioning from here; the old version string was AstroWind's, not ours.
- **Rewrite the `description`** to "Scaleforce Agency landing site — Astro 5 + Tailwind 4." — accurate and short.
- **Keep `private: true`** — this hard-blocks npm publishing and stays in force. The site is not a reusable package.
- **Rewrite `README.md`** to describe this project on its own terms: quick-start, env vars, scripts, tech stack, branching workflow, pointer to `docs/adr/`, and a short, honest Credits section acknowledging AstroWind as the original template source without advertising the template.
- **Sweep lingering `@onwidget` / `AstroWind` / `astrowind` references** outside of the `astrowind:config` virtual module, and update or remove template-flavored content that no longer describes this project.

Upstream is no longer tracked. Future Astro / Tailwind / dependency upgrades are owned directly by this project's phased upgrade process and recorded as ADRs.

## Alternatives considered

- **Keep the forked relationship and the template identity.** Rejected. Upstream is semi-dormant, divergence is already large, and the template-flavored README/metadata actively misrepresents the project to readers (and LLMs). The cost of staying close to a dormant template is high; the benefit (cheap upstream sync) no longer exists.
- **Rename the `astrowind:config` virtual module and all ~15 import sites in this PR.** Rejected for this phase. The virtual module is set up by `vendor/integration/index.ts` and exported types in `vendor/integration/types.d.ts`; renaming it touches roughly 50 files of churn for zero functional gain. Recorded as a chip-sized follow-up.
- **Publish to npm under the new name.** Rejected. This is a site, not a reusable package. `private: true` stays, which hard-blocks accidental publish.
- **Rebrand visual identity (favicon, logo, OG image) in this PR.** Rejected for this phase. Visual identity is Phase 7 redesign territory. Scope-matching this PR to *package, metadata, docs* keeps the review tight and leaves visual decisions for the redesign.
- **Retain the old README structure and just edit the AstroWind mentions.** Rejected. The existing README is largely template documentation (Getting Started, project-structure tree, CodeSandbox / Gitpod / StackBlitz badges, Seasoned astronaut line, configuration yaml dump). Patching names leaves the project still reading as a template wrapper. Rewriting is the right scope.

## Consequences

- **Positive:**
  - `package.json` identity matches reality. No more confusion about whether this is the AstroWind template or a project built on it.
  - Contributors (and future LLMs reading the repo) have a README that describes what this *is* rather than instructions for using a template to build something else.
  - Versioning is owned: `0.1.0` onward, free to evolve via normal semver when/if this becomes release-tagged, not constrained by the upstream's `1.0.0-beta.*` lineage.
  - Template credit is preserved honestly via the README Credits section and the MIT copyright line in `LICENSE.md` — attribution without advertising.
- **Negative:**
  - No more implicit option of `git merge template/main` to pick up upstream changes. The previous README had instructions for this; they're now removed. Given upstream is dormant, this is effectively a loss of nothing, but it's formally a loss of optionality.
  - Contributors accustomed to AstroWind documentation patterns will no longer find them in this repo's README. Mitigated by the Credits link to the upstream repo.
- **Follow-ups:**
  - **Rename the `astrowind:config` virtual module** to something project-owned (e.g. `scaleforce:config` or `~/config`). Touches `vendor/integration/index.ts`, `vendor/integration/types.d.ts`, and ~15 `astrowind:config` import sites. Chip-sized, non-urgent, deferred.
  - **Rename internal log channel names and Vite plugin names** inside `vendor/integration/index.ts` (`astrowind-integration`, `vite-plugin-astrowind-config`, `logger.fork('astrowind')`). Done in the same pass as the virtual-module rename above.
  - **Rename the `.vscode/astrowind/` folder and its `config-schema.json`** plus the pointer in `.vscode/settings.json`. IDE-local, non-urgent, bundle with the virtual-module rename.
  - **`src/pages/terms.md` and `src/pages/privacy.md`** contain template demo legal text ("AstroWind LLC, 1 Cupertino, CA 95014", `astrowind.vercel.app`). This is content, not code; needs real legal copy from the user. Flagged in the detach PR body but **not fabricated** here.
  - **Visual rebrand** (favicon, logo, OG image, any AstroWind-styled assets under `public/` or `src/assets/`) — scoped to Phase 7 redesign, not this phase.

## Notes

- `astro.config.ts` was checked for template-origin `site:` URL or analytics config. The site URL lives in `src/config.yaml` (`https://ScaleForce.agency`), which is already Scaleforce-branded. `astro.config.ts` itself contains only the `astrowind` integration import (retained per the deferred virtual-module rename) and no template-origin URLs or analytics IDs.
- `LICENSE.md` retains the original "Copyright (c) 2023 onWidget" line. The MIT license permits continued use with the original copyright notice preserved; removing it would be wrong, and adding a dual Scaleforce copyright is a decision for the user rather than this detach pass.
- The name `scaleforce-agency-landing` matches the GitHub repo and is unscoped. Combined with `private: true`, this makes the npm namespace a non-issue: no publishing is possible.

## Update (2026-04-23)

The virtual-module rename deferred above was subsequently implemented in commit `8ec1407` ("chore: rename astrowind:config virtual module → site:config") and shipped in the same `dev → main` release PR (#81). The module is now `site:config`; all import sites have been updated. The "Follow-ups" bullet for that rename is therefore complete, and references to `astrowind:config` in the Decision and Alternatives sections above are preserved as the historical record of the 2026-04-21 decision, not the current module name.
