# Log

Chronological, append-only record of operations performed on this wiki.

Every entry begins with a prefix of the form:

```
## [YYYY-MM-DD] <op> | <subject>
```

where `<op>` is one of:

- `scaffold` — initial setup or structural change to the wiki itself.
- `ingest` — a source was read, summarized, and integrated into the wiki.
- `query` — a question was answered against the wiki (log the ones whose answers were filed back as pages).
- `lint` — a health-check pass was run.
- `manual-edit` — a human edited a wiki page directly. Log it so the LLM knows the state isn't what its last ingest produced.

The consistent prefix makes the log parseable by simple tools — `grep '^## \[' log.md | tail -10` returns the last ten operations cleanly.

**Append new entries to the bottom.** Do not reorder or rewrite past entries. The value of a log is its honesty about what happened and when; edited logs lose that.

---

## [2026-04-21] scaffold | llm-wiki bootstrap

Initialized wiki/ structure via the repo-wiki-scaffold skill. No pages ingested yet.
