# Oraclous Marketing — content & AEO/GEO/SEO foundation

This directory is the **content-complete initial state** of Oraclous marketing: strategy, brand, information architecture, finished page copy, blog seeds, the AI-search (AEO/GEO) asset set, technical-SEO specs, and the build blueprint for a static marketing site. It is **content + specs, not application code** — the marketing site itself is a gated follow-up build (see [`build-spec/`](./build-spec/marketing-app-architecture.md)).

Everything here is grounded in the canonical system design in `oraclous-knowledge` (architecture v1.1, ADRs, services-reference) and authored **AEO/GEO-first, then SEO**.

## How it was built

A team of specialists produced this in phases: **research → positioning/brand → IA → page copy → GEO/SEO pass → blog**. The full plan is at `~/.claude/plans/i-need-to-work-precious-petal.md`.

## Directory map

| Path | What it holds |
| --- | --- |
| [`strategy/`](./strategy/) | `positioning.md`, `messaging-matrix.md`, `personas.md` — the messaging spine (the "second mind" thesis, the problem→solution→differentiator matrix, 5 personas) |
| [`brand/`](./brand/) | `voice-and-tone.md` (the copywriter's voice guide) · `glossary.md` (31 definition-first entries — the most citable AEO asset, becomes `DefinedTermSet`) |
| [`research/`](./research/) | `competitive-landscape.md`, `keyword-entity-map.md`, `brand-mention-plan.md` — competitor + keyword + off-site authority research (cited) |
| [`ia/`](./ia/) | `sitemap.md`, `url-taxonomy.md`, `internal-linking.md`, and `page-structures/` blueprints — the site IA (51 pages, hub-and-spoke topical authority) |
| [`pages/`](./pages/) | **29 finished pages**: 8 core (`home`, `platform`, `how-it-works`, `security`, `open-source`, `developers`, `pricing`, `about`) · 11 capability deep pages (`platform/*`) · 4 `solutions/*` · 6 `why-oraclous/*` |
| [`blog/`](./blog/) | **7 seed articles** (second-mind, ReBAC-vs-RBAC, data-sovereignty, BYOM, platform-as-code, OHM, HITL) |
| [`content-calendar.md`](./content-calendar.md) | 30-day launch editorial calendar: 5 pillars, week-by-week schedule, 1-to-many repurposing, off-page sequencing, KPIs |
| [`geo/`](./geo/) | `llms.txt`, `llms-full.txt`, `schema/` (10 JSON-LD templates/examples), `faq-blocks.md`, `citability-notes.md` (verdict: **STRONG ~88/100**) |
| [`seo/`](./seo/) | `robots.txt` (15 AI crawlers allowlisted), `sitemap-plan.md`, `meta-model.md` (the `<head>` contract), `technical-spec.md` |
| [`build-spec/`](./build-spec/marketing-app-architecture.md) | The Astro SSG marketing-app architecture (the gated build blueprint) |

## Page file convention

Every page in `pages/` and `blog/` carries YAML front-matter (`title`, `meta_description`, `url`, `schema[]`, `primary_query`, CTAs…) followed by the finished copy. Each page has: a `> **Citable answer**` block, question-shaped H2/H3s, an FAQ section, and an assigned JSON-LD schema set — the AEO/GEO hooks. These map directly to Astro content collections at build (see the build spec).

## Status & key decisions

- **Scope:** content-complete; **not** built. The marketing site is a separate, gated `feat(marketing-app):` effort.
- **Audience:** balanced / multi-persona — Home leads with the "second mind" thesis; Solutions go per-persona.
- **Build target:** a new `apps/marketing` Astro SSG app reusing `@oraclous/design-system`, hosted at `oraclous.com` (the console stays the SPA at `app.oraclous.com`, `noindex`). **Crawlable HTML is mandatory** — AI crawlers don't run JS, which is why this can't live in the console SPA.
- **Honesty rule:** no invented metrics, customers, certifications, prices, or team bios. ISO 27001 / SOC 2 Type II are **target** certifications (in-programme, not certified) and framed as roadmap everywhere.

## Open items for maintainer sign-off (search `[TBD]`)

- **GitHub org/repo URL** and **license** (used as placeholders in CTAs across open-source/developers pages).
- **Pricing numbers** on `pages/pricing.md` (model is written; figures need a pricing decision).
- **Author bylines + publish dates** for blog E-E-A-T.
- **`sameAs` handles** in `geo/schema/organization.json` (GitHub/LinkedIn/Crunchbase/X/Wikidata).
- **Off-page brand presence** — the citability ceiling is now off-page, not the copy: execute `research/brand-mention-plan.md` (Wikidata/GitHub/LinkedIn/Crunchbase first).
- A handful of **glossary slug routes** to confirm at build (e.g. `/glossary/provenance-audit`, `/glossary/credential-broker`).

## Governance

Authored on branch `docs/marketing-foundation`; lands via `docs(marketing):` PR(s) under the repo's GitHub Issues + PR workflow (non-author review, no self-merge, no attribution trailers — see the repo `CLAUDE.md`). Nothing is committed yet.
