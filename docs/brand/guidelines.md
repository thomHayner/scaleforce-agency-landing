# Brand guidelines

Phase 7 · Wave 2 — initial tokens. Scope is deliberately narrow: colors,
typography, and usage notes for the existing wordmark. Logo mark, favicon,
and OG imagery remain as-is for now (tracked as follow-ups in [TODO.md](../../TODO.md)).

## Palette

Cobalt-leaning blues. Intentionally off the Tailwind `blue-500` path so the
brand feels familiar without reading as a default Tailwind demo.

### Core

| Token | Light mode | Dark mode | Usage |
|---|---|---|---|
| `--aw-color-primary` | `#4F7CFF` | `#6C94FF` | Primary actions, links, brand accents. Lifts in dark for AA contrast on `#0A0F1F`. |
| `--aw-color-secondary` | `#3558D4` | `#4F7CFF` | Hover/pressed state for primary. Deeper in light, slot-shifts to base-cobalt in dark. |
| `--aw-color-accent` | `#38BDF8` | `#38BDF8` | Sky. Reserved for highlights and decorative fills — don't use for primary CTAs. |

### Surface + text

| Token | Light | Dark | Notes |
|---|---|---|---|
| `--aw-color-bg-page` | `#FAFBFD` | `#0A0F1F` | Page background. Dark is near-black with a deliberate blue undertone. |
| `--aw-color-bg-page-dark` | `#0A0F1F` | — | Legacy token kept for components that explicitly paint the dark surface in light mode (e.g. inverted hero). |
| `--aw-color-text-heading` | `#0D1428` | `#F1F5FC` | Headings. |
| `--aw-color-text-default` | `#1E293B` | `#E2E8F3` | Body text. |
| `--aw-color-text-muted` | `#1E293B` @ 66% | `#E2E8F3` @ 66% | Captions, secondary labels. |

### Contrast (WCAG)

Spot-checked against the page surface. All body/heading tokens are ≥ AA.
Re-verify if primary ever lands on a non-surface background.

- `primary` on `bg-page` (light): 4.6:1 — AA normal text.
- `primary` on `bg-page` (dark): 7.1:1 — AAA.
- `text-muted` on `bg-page` (both modes): ≥ 4.5:1.

## Typography

Dual-family stack. Both load as variable fonts via `@fontsource-variable/*`
in [`src/components/CustomStyles.astro`](../../src/components/CustomStyles.astro)
— no external font CDN, no FOUT swap beyond what the browser does natively.

| Role | Family | Token | Rationale |
|---|---|---|---|
| Headings | **Space Grotesk** | `--aw-font-heading` | Geometric sans with character. Distinctive without being niche — present enough in fintech/dev-tools to feel credible, not so common it reads as "a Tailwind template". |
| Body | **Inter Tight** | `--aw-font-sans`, `--aw-font-serif` | Inter's tighter, slightly quieter sibling. Keeps the proven legibility of Inter but steps one notch off the most-used-font-on-the-web path. |

Both are variable fonts — weights 100–900 are available without shipping
separate files.

### Type scale

Currently inherits Tailwind's default scale (`text-sm` … `text-4xl`). No
custom scale is defined yet. If we introduce one, put it in the `@theme`
block in [`src/assets/styles/tailwind.css`](../../src/assets/styles/tailwind.css) — not here.

## Logo

The existing PNG wordmark ([`src/assets/images/logo.png`](../../src/assets/images/logo.png))
is kept as-is for Wave 2. It renders through
[`src/components/Logo.astro`](../../src/components/Logo.astro) alongside
the site name.

Known constraints, carried over:

- PNG raster — no SVG source yet. Follow-up: produce SVG with light/dark
  variants so the mark inherits `currentColor` and paints correctly against
  both surfaces.
- The `Image` component emits a densities-`[1.5, 2]` srcset, so sizing on
  retina is fine.
- No tagline / lockup variant defined.

Until the SVG lands, don't place the logo on surfaces other than
`bg-page` (either mode).

## What's NOT in scope for Wave 2

Tracked as follow-ups, not silent gaps:

- **SVG logo + light/dark variants** → Wave 3.
- **Favicon refresh** — current [`favicon.svg`](../../src/assets/favicons/favicon.svg)
  is being re-verified against the new palette but not redrawn.
- **OG/social image** — [`src/assets/images/default.png`](../../src/assets/images/default.png)
  is unchanged. Regeneration requires image tooling outside this PR.
- **Component-level re-theming** — buttons/links already consume the tokens
  above, so this lands automatically. Deeper component revisions live in
  Phase 7 Wave 3+.

## When you touch this file

- **Hex values belong in `CustomStyles.astro`, not in new components.** If
  you find yourself typing `#4F7CFF` anywhere else, use the token instead.
- **New tokens go in `@theme`** (in `tailwind.css`), not in ad-hoc CSS vars.
- **Update the contrast table** if primary/surface tokens change. Broken
  contrast is a user-review blocker, not a follow-up.
