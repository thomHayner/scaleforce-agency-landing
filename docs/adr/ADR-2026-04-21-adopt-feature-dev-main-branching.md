---
id: ADR-2026-04-21-adopt-feature-dev-main-branching
title: Adopt feature → dev → main branching strategy
status: accepted
date: 2026-04-21
deciders: [thom]
tags: [workflow, ci, conventions]
supersedes: []
superseded_by: []
related: []
source: retroactive capture of PR #38 (chore/ci-branches)
---

## Context

CI was previously wired to a non-existent `staging` branch, so PR and push triggers fired on nothing and builds never ran. Fixing CI meant deciding what branches it should target, which forced an explicit branching strategy for the repo. Before this, the convention was implicit — some PRs went to `main`, `staging` was referenced in config but never created, and no staging deploy existed.

The site is a small marketing/content property with a single maintainer plus occasional AI-assisted PRs. It needs a visible pre-production surface to verify Contentful content changes and syndicated-blog fetches, but does not justify the ceremony of release branches or feature flag infrastructure.

## Decision

Adopt a three-tier `feature → dev → main` branching strategy:

- **`main`** — production. Deploys to the live site. No direct pushes; merges land only via PR from `dev`.
- **`dev`** — staging. Integration branch that feeds the staging deploy and is verified before release.
- **feature branches** — short-lived, cut from `dev`, named with conventional-commit-style prefixes (`feat/`, `fix/`, `chore/`, `docs/`).

Hotfixes may branch from `main` directly but must be back-merged to `dev` immediately after release to keep the two aligned.

CI (`pull_request` + `push`) triggers on both `main` and `dev`.

## Alternatives considered

- **Trunk-based development (single `main` + feature flags)** — rejected: no feature-flag infrastructure in place, and the marginal benefit for a small marketing site doesn't justify building one. Also removes the staging gate that's useful for verifying Contentful/syndicated content before production.
- **GitHub Flow (`main` + short-lived feature branches, no staging)** — rejected: leaves no pre-production surface for verifying content changes. A marketing site with a CMS and external content sources benefits from a staging deploy that is not the live site.
- **GitFlow (`master` + `develop` + `release/*` + `hotfix/*`)** — rejected: overkill for a continuously deployed marketing site. Release branches don't fit this cadence, and the mental overhead for a solo maintainer is not worth it.

## Consequences

- **Positive:** staging verification before production; a single integration branch; CI reliably runs on every PR; conventional-commit branch prefixes align with commit-message conventions.
- **Negative:** two-step merge overhead (`feature → dev`, then `dev → main`) even for trivial changes; hotfix back-merge requires discipline to avoid drift between `main` and `dev`.
- **Follow-ups:** a separate workstream is setting up branch-protection rules on `main` and `dev` (require PR, require CI pass, disallow direct push to `main`). Deploy configuration for the staging environment is also tracked separately.

## Notes

Recorded retroactively. The decision was made and documented in [PR #38](https://github.com/thomHayner/scaleforce-agency-landing/pull/38), which repointed CI triggers at `dev` and `main` and added a Branching workflow section to `README.md`. That PR also doubled as the first PR under the new flow (branched from `dev`, targets `dev`).
