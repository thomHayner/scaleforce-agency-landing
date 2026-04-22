# Raw Lighthouse reports — 2026-04-21 baseline

These are the raw Lighthouse 12.8.2 JSON outputs from the pre-Phase-7 baseline run captured on 2026-04-21.
The reports are committed as gzip-compressed copies of the `--output=json` output from `npx lighthouse`
to reduce repository size. After decompression, each `.json.gz` file matches the original JSON output;
note that compressed artifacts may still appear as binary or noisy in Git diffs unless configured separately.

| File | Route | Size (gz) |
| --- | --- | ---: |
| `home.report.json.gz` | https://scaleforce.agency/ | 117 KB |
| `blog.report.json.gz` | https://scaleforce.agency/blog | 209 KB |
| `blogpost.report.json.gz` | https://scaleforce.agency/ai-appointment-setters-for-real-estate-agents | 660 KB |
| `privacy.report.json.gz` | https://scaleforce.agency/privacy | 567 KB |

## Viewing a report

Decompress and open in Lighthouse's HTML viewer, or re-generate the HTML:

```bash
gunzip -c home.report.json.gz > home.report.json
# Then drop home.report.json into https://googlechrome.github.io/lighthouse/viewer/
```

Or extract specific metrics with `jq`:

```bash
gunzip -c home.report.json.gz | jq '.categories | to_entries | map({key, score: .value.score})'
gunzip -c home.report.json.gz | jq '.audits["largest-contentful-paint"] | {displayValue, numericValue}'
```

The headline numbers are summarised in
[`../2026-04-21-lighthouse-baseline.md`](../2026-04-21-lighthouse-baseline.md) — start there.
