# Architecture Decision Records (ADRs)

This folder is the canonical place for **architectural decision records** — short, durable notes capturing the *why* behind non-trivial choices about the codebase, architecture, tooling, dependencies, or workflow.

## Why ADRs

- Future contributors (and future-you) get a written explanation for choices that aren't obvious from the code alone.
- Decisions remain queryable long after the conversation, PR, or Slack thread that produced them is gone.
- The frontmatter schema makes ADRs machine-readable for downstream tooling (changelogs, doc synthesis, audit).

## File naming

```
ADR-YYYY-MM-DD-kebab-case-slug.md
```

Date-based slugs (not sequential numbers) so parallel sessions and branches can both add ADRs without collisions.

Good slugs name the decision concisely:

- `ADR-2026-04-16-adopt-tailwind-v4.md`
- `ADR-2026-04-16-switch-from-jest-to-vitest.md`
- `ADR-2026-04-16-cache-geocode-results-lru.md`

Avoid: `ADR-2026-04-16-decision.md`, `ADR-2026-04-16-changes.md`, `ADR-2026-04-16-adr-1.md`.

## Creating a new ADR

1. Copy [`TEMPLATE.md`](TEMPLATE.md) → `ADR-<today>-<slug>.md` in this folder.
2. Fill in the frontmatter and body.
3. Be honest: if a section wasn't discussed, write `Not discussed in this session` instead of inventing rationale. Invented context is worse than no context.

## Status lifecycle

- **proposed** — under discussion, not yet committed to.
- **accepted** — the decision is in force.
- **superseded** — replaced by a later ADR. Set `superseded_by:` to the new ADR's id.
- **deprecated** — no longer in force, but not replaced by a specific successor.
- **rejected** — proposed and explicitly turned down (kept as a record of the discussion).

Do not edit the body of an old ADR to reflect a later reversal — write a new ADR and update the old one's `status` and `superseded_by` fields.

## Frontmatter fields

| Field | Purpose |
|---|---|
| `id` | Matches the filename without `.md`. |
| `title` | Short imperative title. |
| `status` | One of the lifecycle values above. |
| `date` | The date the decision was made (not today's date if you're recording it later). |
| `deciders` | YAML list of handles. |
| `tags` | 2–4 short domain tags, e.g. `[build, tooling]`. |
| `supersedes` | List of ADR ids this one replaces. |
| `superseded_by` | List of ADR ids that replace this one. |
| `related` | Cross-references to other ADRs. |
| `source` | Provenance, e.g. `claude-code-session-YYYY-MM-DD <topic>`. |

## Capturing ADRs from a Claude Code session

If you have the `adrs-write` skill available, invoke it at the end of a working session and it will scan the conversation for qualifying decisions and produce one ADR per decision in this folder, following this template. The skill is conservative — borderline decisions are skipped, and it will refuse to fabricate context that wasn't actually discussed.
