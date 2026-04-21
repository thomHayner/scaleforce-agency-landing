Vendored Astro integration originally derived from the AstroWind template.

Provides the `astrowind:config` virtual module (resolved by the Vite plugin
in `./integration/index.ts`) that exposes parsed `src/config.yaml` values —
`SITE`, `I18N`, `METADATA`, `APP_BLOG`, `UI`, `ANALYTICS` — to components
via typed imports.

The virtual-module name is retained for now to avoid churning ~50 import
sites across the codebase; renaming it is tracked as a follow-up in
`docs/adr/ADR-2026-04-21-detach-from-astrowind-template.md`.
