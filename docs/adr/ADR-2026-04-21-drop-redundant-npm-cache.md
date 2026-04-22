---
id: ADR-2026-04-21-drop-redundant-npm-cache
title: Drop the explicit actions/cache step from CI (setup-node already caches npm)
status: accepted
date: 2026-04-21
deciders: [thomHayner, claude-opus-4-7]
tags: [ci, github-actions, caching]
supersedes: []
superseded_by: []
related: [ADR-2026-04-21-ci-hardening-split-and-eslint-env-override, ADR-2026-04-21-node-ts-baseline-bump]
source: claude-code-session-2026-04-21 ci-dedupe-npm-cache
---

## Context

`.github/workflows/actions.yaml` runs three jobs — `build`,
`typecheck`, `lint` — and each one follows the same pattern:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: ...
    cache: npm
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
- run: npm ci
```

The `cache: npm` input on `actions/setup-node@v4` already wires up
`actions/cache` under the hood against the same `~/.npm` directory,
keyed on the lockfile. The explicit `actions/cache@v4` step that
follows is caching the same path with a functionally identical key,
so on every run we get two cache restores and — more annoyingly —
two cache saves to the same key. When saves race, the second write
loses and emits a noisy warning, but nothing downstream notices
because the hit from either save is equivalent.

GitHub Copilot flagged this on [PR #45 (Dependabot `actions/cache`
bump 4 → 5)](https://github.com/thomHayner/scaleforce-agency-landing/pull/45):
bumping the version of a step that shouldn't exist at all is wasted
motion, and the double-save warnings are already showing up in the
`build` matrix logs.

## Decision

Delete the explicit `actions/cache@v4` block from all three jobs
(`build`, `typecheck`, `lint`). `setup-node`'s built-in
`cache: npm` is the single source of truth for npm caching in this
workflow going forward.

## Alternatives considered

- **Keep the explicit cache, drop `cache: npm` from setup-node.**
  Rejected. `setup-node`'s built-in caching is the path the GitHub
  Actions docs and the `setup-node` README recommend; it stays in
  sync with the action's own versioning (no separate
  `actions/cache` bump to track) and requires zero configuration.
  Hand-rolling the cache step only makes sense when you need a
  non-default path or key, which we don't.
- **Leave both in place and ignore the warning.** Rejected. The
  double-save is cheap but not free, the noise in the logs makes
  real cache problems harder to spot, and leaving duplicated
  config invites drift — the next person editing one copy will
  not know to update the other.
- **Move caching out of each job into a composite action or
  reusable workflow.** Rejected for this PR. Three jobs sharing
  one inline line (`cache: npm`) is not enough duplication to
  justify the indirection; revisit if the workflow grows past
  ~5 jobs.

## Consequences

- **Positive:** One way to cache npm, not two. No more duplicate
  cache-save warnings in CI logs. Future `actions/*` Dependabot
  bumps have one fewer redundant step to churn through. The
  workflow drops 18 lines (6 per job × 3 jobs).
- **Negative:** None observed. Cache hit behaviour is unchanged
  because `setup-node`'s internal cache uses the same path
  (`~/.npm`) and a lockfile-hashed key, which is what the explicit
  step was doing.
- **Follow-ups:** None required. If we ever need a non-default
  cache path (e.g. caching a framework-specific build cache), add
  a single `actions/cache` step targeted at that path — do not
  re-introduce the `~/.npm` duplication.

## Notes

- The three Dependabot PRs that motivated this cleanup landed on
  2026-04-21: [PR #45](https://github.com/thomHayner/scaleforce-agency-landing/pull/45)
  (`actions/cache` 4 → 5), [PR #46](https://github.com/thomHayner/scaleforce-agency-landing/pull/46)
  (`actions/setup-node` 4 → 6), [PR #47](https://github.com/thomHayner/scaleforce-agency-landing/pull/47)
  (`actions/checkout` 4 → 6). Copilot's review on #45 is what
  surfaced the redundancy.
- The explicit block was introduced deliberately during the
  original CI hardening pass (see
  ADR-2026-04-21-ci-hardening-split-and-eslint-env-override,
  Decision #3), which added it as a belt-and-suspenders
  supplement to `setup-node`'s built-in cache on the theory that
  `setup-node`'s cache was "sometimes invalidated unexpectedly".
  In practice that redundancy has not paid off — both layers
  cache the same `~/.npm` path with functionally identical
  lockfile-hashed keys, so a miss in one is effectively a miss
  in the other, and the double-save warnings cost more reader
  attention than the extra layer ever saved in install time.
  This ADR therefore supersedes that part of the earlier
  decision; the rest of the CI hardening ADR (job split, ESLint
  env.d.ts override, Dependabot for `github-actions`, prettier
  removal) still stands.
- The Context block's YAML snippet pins `actions/setup-node@v4`
  and `actions/cache@v4` because that's the state of the
  workflow *when this ADR was written*, which is what the ADR
  is reasoning about. The current workflow reflects this
  decision: `actions/setup-node@v6` with `cache: npm` and no
  explicit `actions/cache` step for `~/.npm`. Don't take the
  snapshot as a mandate to pin those versions — it's history,
  not instruction.
