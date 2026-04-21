# Lighthouse Baseline — Pre Phase 7

**Date captured:** 2026-04-21
**Production URL:** https://scaleforce.agency
**Production commit (origin/main HEAD at capture time):** `bacbe31a9dfc44abf52d99b4d40c79a264a7dbc3`
**Lighthouse version:** 12.8.2
**Preset:** Mobile (default) — simulated Moto G4, 4x CPU throttle, Slow 4G
**Chrome:** local Chrome, `--headless=new`
**Captured by:** automated run (single shot per route, no averaging)

This report is a **pre-redesign baseline only**. No optimization work was performed. Its purpose is to let us
compare real Core Web Vitals and Lighthouse category scores before and after the Phase 7 redesign + perf pass.

---

## Routes measured

Four representative routes were audited, chosen to cover the main page templates in `src/pages/`:

| Key | URL | Template |
| --- | --- | --- |
| `home` | https://scaleforce.agency/ | `src/pages/index.astro` (landing hero + marketing sections) |
| `blog` | https://scaleforce.agency/blog | `src/pages/[...blog]/index.astro` (post list / pagination) |
| `blogpost` | https://scaleforce.agency/ai-appointment-setters-for-real-estate-agents | `src/pages/[...blog]/[...page].astro` (single post) |
| `privacy` | https://scaleforce.agency/privacy | `src/pages/privacy.md` (long-form markdown) |

Raw Lighthouse outputs (JSON + HTML) for each route are committed under
[`docs/perf/raw/`](./raw/). They contain the full audit detail if you need to drill in.

---

## Category scores

Out of 100. 90+ is Lighthouse's "green" band.

| Route | Performance | Accessibility | Best Practices | SEO |
| --- | ---: | ---: | ---: | ---: |
| `home` | **86** | 100 | 100 | 100 |
| `blog` | **80** | 100 | 100 | 100 |
| `blogpost` | **79** | 100 | 100 | 100 |
| `privacy` | **85** | 100 | 100 | 100 |

Accessibility, Best Practices, and SEO are all green at 100 across every measured route. Performance is the
only category with headroom, scoring between 79 and 86 on mobile.

---

## Core Web Vitals & lab metrics

Lab metrics from a single Lighthouse run — field data (CrUX / RUM) would be more representative but is not
captured here. Lighthouse does not emit INP in lab mode; TBT is reported as the closest proxy.

Good thresholds (for reference): **LCP < 2.5 s**, **CLS < 0.1**, **TBT < 200 ms**, **FCP < 1.8 s**.

| Route | LCP | CLS | TBT | FCP | Speed Index | TTI |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `home` | 4.2 s | 0 | 40 ms | 1.3 s | 2.9 s | 4.6 s |
| `blog` | 4.8 s | 0 | 40 ms | 1.3 s | 4.1 s | 4.9 s |
| `blogpost` | 5.6 s | 0.045 | 40 ms | 1.0 s | 2.6 s | 5.6 s |
| `privacy` | 4.0 s | 0 | 100 ms | 1.3 s | 4.0 s | 4.0 s |

### LCP element per route

| Route | LCP element (truncated) |
| --- | --- |
| `home` | "Automate Your Operations, Liberate Your Time" (hero H1) |
| `blog` | "AI Assistants vs AI Agents" (featured post card) |
| `blogpost` | CTA line: "See how AI can help you schedule more showings and close more deals." |
| `privacy` | First long-form paragraph ("We use Your Personal data to provide and improve the Service…") |

LCP is text in every case — the hero doesn't rely on a large image — so the primary cost isn't image decoding,
it's render-blocking CSS / JS pushing text paint past 4 s on a throttled mobile connection.

---

## Top opportunities Lighthouse flagged (per route)

Estimated ms savings are from the simulated mobile run, not guaranteed real-world gains.

**`home`**
- Reduce unused JavaScript (~520 ms, ~123 KiB)
- Preconnect to required origins (~345 ms)
- Modern image formats: est savings 1,884 KiB
- Properly size images: est savings 783 KiB

**`blog`**
- Reduce unused JavaScript (~600 ms)
- Properly size images (~380 ms, ~268 KiB)
- Preconnect to required origins (~322 ms)
- Eliminate render-blocking resources (~302 ms, ~300 ms savings)
- Unused CSS rules: est savings 10 KiB

**`blogpost`**
- Reduce unused JavaScript (~1,030 ms) — biggest single lever in the baseline
- Preconnect to required origins (~318 ms)

**`privacy`**
- Reduce unused JavaScript (~510 ms)
- Preconnect to required origins (~337 ms)
- Eliminate render-blocking resources (~306 ms)

---

## Interpretation

**What's green and safe to leave alone going into Phase 7:**

- **Accessibility (100 across the board)** — AstroWind's defaults plus our markup are clean. Phase 7 should
  aim to preserve this; any new component library or redesign system needs an a11y regression check.
- **Best Practices (100)** — HTTPS, no console errors, correct image aspect ratios, no deprecated APIs.
- **SEO (100)** — meta tags, canonical URLs, mobile viewport, and crawlability are all in order. The
  redesign shouldn't regress `<title>` / `<meta description>` patterns or robots config.
- **CLS (≤ 0.045 everywhere, 0 on 3/4 routes)** — layout stability is excellent. Images have dimensions,
  fonts aren't causing shift. Protect this when introducing any new async / lazy-loaded components.
- **TBT (40–100 ms)** — main-thread work is well under the 200 ms "good" threshold, consistent with this
  being a mostly-static Astro site with minimal client JS.

**What's red / yellow and worth targeting in the Phase 7 perf pass:**

1. **LCP is the dominant issue on every route** (4.0 – 5.6 s, vs. the 2.5 s "good" target). Since LCP is a
   text element in every case, the root cause is render-blocking resources and third-party JS delaying first
   paint, not image weight.
2. **Unused JavaScript is the single biggest lever** (~123 KiB shared, up to ~1 s of savings on `blogpost`).
   Likely suspects: the react-calendly bundle pulled in globally, any AstroWind helper JS still shipping.
   An audit of what's in `dist/_astro/*.js` after build, plus tighter `client:*` directives, should chip a
   lot of this away.
3. **Render-blocking resources** (~300 ms on `blog` and `privacy`). A `<link rel="preload">` strategy for
   the critical fonts + inlining critical CSS would help. Also: verify `@tailwindcss/vite` isn't emitting a
   larger-than-needed global CSS bundle.
4. **Images not in modern formats / not properly sized** — mostly a homepage concern (est. 1.9 MiB savings
   if converted to AVIF/WebP at correct dimensions). Astro's `<Image />` with `format: ['avif', 'webp']` is
   already available; this is a content-pipeline fix, not a framework migration.
5. **Missing `preconnect` hints** (~320–345 ms on every route). Good candidates: Contentful asset CDN,
   Google Fonts (if still used), Calendly. Low-risk, high-impact one-liner in the base `<Layout>`.
6. **`blogpost` is the worst route** at Perf 79 / LCP 5.6 s. It's the template most users will land on from
   search. Phase 7 should treat single-post perf as a priority, not just the homepage.

**Targets to aim for after Phase 7's perf pass** (not commitments, just where green would land us):

| Metric | Baseline (worst route) | Phase 7 target |
| --- | --- | --- |
| Performance (mobile) | 79 | ≥ 90 on every route |
| LCP | 5.6 s | < 2.5 s |
| Unused JS savings | ~123 KiB | < 30 KiB |
| Render-blocking savings | ~310 ms | < 100 ms |

---

## How to reproduce

```bash
# from a machine with Chrome installed
npx lighthouse https://scaleforce.agency/                                                  --output=json --output=html --chrome-flags="--headless=new --no-sandbox"
npx lighthouse https://scaleforce.agency/blog                                              --output=json --output=html --chrome-flags="--headless=new --no-sandbox"
npx lighthouse https://scaleforce.agency/ai-appointment-setters-for-real-estate-agents     --output=json --output=html --chrome-flags="--headless=new --no-sandbox"
npx lighthouse https://scaleforce.agency/privacy                                           --output=json --output=html --chrome-flags="--headless=new --no-sandbox"
```

Single-run Lighthouse results vary by ±5 points on the Performance score even run-to-run on the same machine.
When measuring post–Phase 7, prefer averaging at least 3 runs per route, or use PageSpeed Insights / CrUX for
a field comparison.
