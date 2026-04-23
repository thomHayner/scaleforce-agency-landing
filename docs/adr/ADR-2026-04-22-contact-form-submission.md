---
id: ADR-2026-04-22-contact-form-submission
title: Wire contact form submission via Vercel Function + Resend
status: accepted
date: 2026-04-22
deciders: [thomHayner]
tags: [contact, vercel, resend, forms, infrastructure]
supersedes: []
superseded_by: []
related: []
source: claude-code-session-2026-04-22
---

## Context

The contact form on the home page (`ContactUs` widget, backed by `src/components/ui/Form.astro`) has been an intentionally non-submitting stub since Phase 7 Wave 2 — `onsubmit="event.preventDefault(); return false;"` plus a disabled button labelled "(form not yet wired)". The previous deploy target was Netlify, which was killed in issue #76, so any prior assumptions about `NETLIFY_EMAILS_*` or Netlify Forms no longer apply. Vercel is now the only deploy target.

DNS for `scaleforce.agency` lives on Vercel with no MX records, so sending mail _as_ `@scaleforce.agency` requires a real email service provider — we can't SMTP directly off the domain.

The site is built with `output: 'static'`. We need a server-side endpoint to validate submissions, keep the API key server-side, and call out to an ESP.

## Decision

Wire the contact form through a **Vercel serverless function at `api/contact.ts`** (project-root convention, deployed automatically alongside the Astro static output) that forwards validated submissions to **Resend**. A honeypot field (`website`) is the spam mitigation baseline. Astro remains in `output: 'static'` — no adapter switch, no need to mark every existing page `prerender = true`.

Client-side, `Form.astro` POSTs JSON to `/api/contact`, mirrors server validation to avoid empty-field network calls, and swaps the form for a `role="status"` success region on 200 (or surfaces an inline `role="alert"` banner on failure).

Required runtime env (Production + Preview + Development in the Vercel project): `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` (a sender on a domain verified with Resend).

## Alternatives considered

- **Astro server output + `@astrojs/vercel` adapter + `src/pages/api/contact.ts`.** Idiomatic Astro, but flips the whole project from static to server mode and requires `export const prerender = true` on every page. `.md` pages (`privacy.md`, `terms.md`) can't export — they'd prerender by default under server mode, but the change widens the blast radius for what is a single endpoint. Rejected as disproportionate.
- **Netlify Forms / `NETLIFY_EMAILS_*`.** Netlify project is deleted (#76). Not available.
- **Direct SMTP from `scaleforce.agency`.** No MX records on the domain, and standing up an SMTP stack to send three emails a week is the wrong shape.
- **Formspree / Getform / other hosted form relays.** Adds a third-party dependency with no benefit over Resend, which we control the domain verification for.
- **Vercel BotID only, no honeypot.** BotID is the stronger option if abuse becomes a problem, but honeypot is zero-config, server-only, and good enough for a low-traffic marketing form. BotID is the follow-up if needed.

## Consequences

- **Positive:**
  - No change to the Astro build or output mode; `npm run build` still produces the same static `dist/`.
  - Secret material (API key, destination inbox) stays server-side.
  - Resend gives us proper domain-verified sending as `@scaleforce.agency` with deliverability telemetry.
  - The `api/` convention is framework-agnostic — the handler is portable off Astro if the stack ever moves.
- **Negative:**
  - Introduces a runtime dependency on Resend and a new class of secrets to rotate.
  - Splits API code out of `src/` into a project-root `api/` folder, which doesn't match the rest of the codebase.
  - Honeypot alone will not stop a targeted attacker; if abuse emerges, upgrade to Vercel BotID or add rate limiting.
- **Follow-ups:**
  - Prune legacy `NETLIFY_EMAILS_*` and `AIRTABLE_*` from any remaining environments (the Netlify project itself is already gone per #76).
  - Evaluate [Vercel BotID](https://vercel.com/docs/botid) if honeypot proves insufficient.
  - Consider moving to `output: 'server'` if more endpoints are needed later — at that point the calculus flips.

## Notes

- File layout: `api/contact.ts` (serverless handler), `src/components/ui/Form.astro` (client-side submit + UX), `.env.example` (documents the three new env vars).
- Error taxonomy: `400 missing_fields`, `400 invalid_email`, `400 invalid_json`, `400 field_too_long`, `405 method_not_allowed`, `502 mailer_unconfigured`, `502 mailer_failed`, `200 ok` (including the honeypot silent-success path).
- The handler uses `replyTo: email` so the destination inbox can reply directly to the submitter.
