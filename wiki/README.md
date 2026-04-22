# wiki/

An LLM-maintained knowledge base for this repo, following the Karpathy LLM-Wiki pattern.

## What this is

`wiki/` is a structured, interlinked collection of markdown files that an LLM assistant (e.g., Claude Code) builds and maintains incrementally. Unlike RAG — which retrieves from raw sources on every question and rediscovers structure every time — this wiki is a **persistent, compounding artifact**. Cross-references are already there. Contradictions have already been flagged. The synthesis already reflects everything that's been ingested.

**Humans read this folder; the LLM writes it.** You're in charge of sourcing, exploration, and asking the right questions. The LLM does the bookkeeping — summarizing, cross-referencing, filing, and keeping the wiki consistent as it grows.

## Three layers

1. **Raw sources** — immutable. Live *outside* this folder. For this repo they typically include:
   - `docs/` — project documentation and specs.
   - `docs/adr/` — architectural decision records.
   - Git history and merged PRs (`gh pr list --state merged`, `gh pr view <n>`).
   - `README.md`, `CONTRIBUTING.md`, and other top-level project guides.
2. **The wiki** — *this folder*. LLM-authored synthesis pages, a content catalog, and a chronological log. Owned by the LLM.
3. **The schema** — the "LLM-Wiki" section of the repo's `CLAUDE.md`. Tells the LLM how to operate on the wiki: page conventions, ingest workflow, query workflow, lint workflow. Without it, the wiki is just empty folders.

## Layout

```
wiki/
├── README.md       # this file — human orientation
├── index.md        # content-oriented catalog of every page
├── log.md          # chronological, append-only record of ingests/queries/lint passes
└── pages/          # flat directory of synthesized pages
    └── *.md
```

`pages/` is flat on purpose. If the wiki grows past the point where `index.md` can comfortably list every page, subcategories (e.g., `pages/entities/`, `pages/features/`) can be introduced later. Don't pre-create them — let structure emerge from content.

## Operations at a glance

See `CLAUDE.md` → "LLM-Wiki" for the authoritative workflow. In brief:

- **Ingest** — the LLM reads a source, summarizes it, creates or updates relevant pages, updates `index.md`, and appends to `log.md`.
- **Query** — the LLM reads `index.md` first, drills into relevant pages, synthesizes an answer with citations. Useful answers can be filed back as new pages so knowledge compounds.
- **Lint** — periodic health check for contradictions, stale claims, orphan pages, and missing cross-references. Output is a triage list for the user, not autonomous edits.

## What not to do

- **Don't hand-edit wiki pages** without adding a `manual-edit` entry to `log.md`. The LLM relies on the log to understand the wiki's state; silent edits break that contract.
- **Don't treat wiki pages as the source of truth.** The wiki is synthesis; the raw sources are ground truth. If a wiki page conflicts with a source, the source wins.
- **Don't let the wiki drift from the sources.** Run an occasional lint pass — it's cheap, and a stale wiki is worse than no wiki.

## Further reading

- The LLM-Wiki pattern as described by Andrej Karpathy — search "Karpathy LLM-Wiki" for the gist.
- Vannevar Bush, *As We May Think* (1945) — the ancestor idea. A personal, curated knowledge store with associative trails. The part he couldn't solve was who does the maintenance. LLMs handle that.
