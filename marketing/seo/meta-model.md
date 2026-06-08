# Per-Page `<head>` Meta Model — the build contract

> The exact `<head>` model every Oraclous marketing page renders: title-tag pattern, meta description rules, canonical, Open Graph + Twitter Card, hreflang/lang, robots meta, and a table mapping each page's existing front-matter (in `marketing/pages/*`) to head tags. This is the **contract the build implements** — the SSG reads the page front-matter and emits exactly the tags specified here, server-side, into the raw HTML (AI crawlers don't run JS — `technical-spec.md`).
>
> Rubric ties: **market-seo Step 2** (title tag, meta description, canonical), **geo-technical §2.1** (self-referencing canonical), **§2.4** (hreflang), **§1.5** (robots meta / noindex), **§7** (meta + OG in raw HTML), **geo-crawlers Step 2** (no erroneous `noindex`/`noai`).

---

## 1. Source: page front-matter → head tags

Every file in `marketing/pages/` already carries YAML front-matter the build maps to head tags. The existing keys (confirmed across `home.md`, `platform/byom.md`, `security.md`, etc.):

```yaml
title: Oraclous — the open-source second mind for your org
meta_description: Oraclous is an open-source agentic AI platform where your people and AI Agents work as one governed fabric — ReBAC governance, BYOM, portable via OHM.
url: /
page_type: pillar
primary_persona: ...
primary_query: ...
secondary_queries: [...]
schema: [Organization, SoftwareApplication, FAQPage, WebSite, BreadcrumbList]
primary_cta: ...
secondary_cta: ...
```

The mapping (which front-matter key drives which tag) is the table in §10. Two keys are **added** to the model for OG/social control (see §5): an optional `og_image` and an optional `robots` override. Where absent, the build derives sensible defaults specified below — no page needs them in the common case.

---

## 2. Title tag (`<title>`)

**Pattern (the contract):**

```
{title}
```

The `title` front-matter value **is** the full, finished title tag — it already includes the brand where appropriate (e.g. `Security & data sovereignty | Oraclous`, `Oraclous — the open-source second mind for your org`). The build emits `<title>{front-matter.title}</title>` verbatim. It does **not** append a second brand suffix (would double-brand `... | Oraclous | Oraclous`).

**Rules (market-seo Step 2 title checklist):**
- **Unique per page** — enforced at build (duplicate `title` across pages fails the build).
- **Length 50–60 characters** so it isn't truncated in SERPs/AI cards. Soft-warn 30–65; hard-fail empty.
- **Primary keyword near the front** — the front-matter `primary_query` should be reflected in the title's leading words (copywriter-owned; the model enforces presence, not wording).
- **Brand placement:** brand at the end after a pipe/dash for sub-pages (`… | Oraclous`); the Home title may lead with the brand. Exact casing **Oraclous** always (never "OraclousAI" in public titles — `brand-mention-plan.md` §5).
- **No keyword stuffing, no generic titles** ("Home", "Page").

**Default fallback** (if a page somehow lacks `title`): `{H1} | Oraclous` — but every current page has an explicit `title`, so the fallback should never fire.

---

## 3. Meta description (`<meta name="description">`)

```html
<meta name="description" content="{meta_description}" />
```

**Rules (market-seo Step 2 description checklist):**
- **≤ 155 characters** (hard cap; the brief's number). Targets the ~155-char SERP render width with margin. Build **warns at 150, fails > 160**.
- **Unique per page** (build-enforced).
- **Includes the primary keyword naturally** and reads as ad copy (a reason to click), not a keyword list.
- **Exact terminology** — ReBAC (never RBAC), OHM, BYOM, Agent (never "bot"), per the global terminology rule. A wrong term here is an entity-resolution error.
- The current front-matter `meta_description` values are already authored to this rule (e.g. BYOM's is 158 chars-area, Security's leads with the differentiator) — the build trims/validates, copy owns the words.

> Meta description is **not** a ranking factor but **is** the click-through copy and is frequently lifted into AI answer cards — treat it as load-bearing.

---

## 4. Canonical (`<link rel="canonical">`)

```html
<link rel="canonical" href="https://oraclous.com{url}" />
```

**Rules (geo-technical §2.1; url-taxonomy §5):**
- **Every indexable page self-canonicalises** to its clean absolute URL: `https://oraclous.com` + `url` front-matter, **lowercase, no trailing slash, no query string**.
- The canonical href must be **byte-identical** to the page's entry in `sitemap.xml` (`sitemap-plan.md` §2). A mismatch is a contradiction.
- **Tracking params never change the canonical** — `?utm_*`, `?ref=` resolve to the same self-canonical.
- **Platform vs Glossary near-duplicates do NOT cross-canonicalise.** `/platform/byom` and `/glossary/byom` cover the same entity but have distinct intent (commercial vs definitional) — **each self-canonicalises** (`url-taxonomy.md` §5). The glossary page is positioned as the definition source via internal links, not via canonical.
- **Blog pagination:** `/blog` page-2+ self-canonicalises (no canonical-to-page-1) so deep articles stay discoverable; articles self-canonicalise (`url-taxonomy.md` §5, `technical-spec.md` §7).
- Emit in HTML `<head>` server-side (not via JS, not via `X-Robots`/header for canonical).

---

## 5. Open Graph + Twitter Card

Every page emits a full OG block and a Twitter summary-large-image card, server-rendered. These drive social/share previews and are read by some AI surfaces for title/description/image.

```html
<!-- Open Graph -->
<meta property="og:type"        content="{og_type}" />          <!-- "website" default; "article" for /blog/* -->
<meta property="og:site_name"   content="Oraclous" />
<meta property="og:title"       content="{title}" />
<meta property="og:description" content="{meta_description}" />
<meta property="og:url"         content="https://oraclous.com{url}" />
<meta property="og:image"       content="https://oraclous.com{og_image}" />
<meta property="og:image:alt"   content="{og_image_alt}" />
<meta property="og:locale"      content="en_GB" />

<!-- Twitter / X -->
<meta name="twitter:card"        content="summary_large_image" />
<meta name="twitter:site"        content="@oraclous" />
<meta name="twitter:title"       content="{title}" />
<meta name="twitter:description" content="{meta_description}" />
<meta name="twitter:image"       content="https://oraclous.com{og_image}" />
<meta name="twitter:image:alt"   content="{og_image_alt}" />
```

- `og:title` / `og:description` reuse the `title` / `meta_description` front-matter (single source of truth — no separate social copy unless a page sets it).
- `og:type` defaults to `website`; **`/blog/{slug}` sets `article`** and additionally emits `article:published_time` / `article:modified_time` / `article:author` (mirroring the `Article` JSON-LD `datePublished`/`dateModified`/`author`).
- `og:image` is `1200×630` PNG/WebP, **served from `oraclous.com` (absolute URL)**, with `og:image:alt` describing it (a11y + AI parse). The handle `@oraclous` must match the canonical reserved handle (`brand-mention-plan.md` §5) — confirm before launch.

### OG image plan per page type

A small, branded, **build-generated** OG image set — not a hand-designed image per page (60+ pages). Use design-system tokens so they match the site (frontend invariant §1.4).

| Page type | OG image source | Content |
|---|---|---|
| Home | Dedicated hand-crafted | Brand mark + "Form your organisation's second mind" + the one-shared-task-board motif |
| Pillars (`/platform`, `/security`, `/solutions`, `/why-oraclous`, `/open-source`, `/developers`, `/how-it-works`, `/pricing`) | Per-pillar template | Pillar name + one-line value prop on brand background |
| Platform capability / Solutions / Why clusters | Templated, auto-generated from `title` | Page `title` rendered on a typed template, capability/persona/problem accent colour |
| Glossary terms | Templated "definition card" | The term + its one-line definition (the citable lead) on a glossary-accent template — reinforces the entity card |
| Blog articles | Templated article card | Article title + topic tag + author on a blog template; optional per-article hero override |
| Default fallback | Generic brand OG | Brand mark + canonical one-liner |

- Build generates templated cards at build time from `title` (+ definition for glossary, + topic/author for blog). A page may override with an explicit `og_image` front-matter key for a bespoke image (Home uses this).
- Each image has matching `og_image_alt` (default: the page `title`).

---

## 6. Language & hreflang

The site is **English-only at launch** — but the model declares language correctly and reserves the hreflang shape for future localisation.

```html
<!-- on <html> -->
<html lang="en">
```

- `lang="en"` on `<html>` is **mandatory on every page** (a11y / frontend invariant §1.3 + SEO). `og:locale` is `en_GB`.
- **hreflang: not emitted at launch** (single language → reciprocal hreflang would be self-referential noise; geo-technical §2.4 only applies to multi-locale). 
- **Reserved future shape** (documented now so it's added correctly when localisation lands): each localised page emits reciprocal `<link rel="alternate" hreflang="xx" href="…">` for every locale **plus** an `hreflang="x-default"`, with reciprocity (A↔B) and valid ISO 639-1/3166-1 codes. Do **not** add hreflang until a second locale actually exists.

---

## 7. Robots meta

```html
<meta name="robots" content="{robots}" />
```

- **Default for all marketing pages: `index, follow`.** The build emits this unless a page sets a `robots` front-matter override.
- **`noindex, follow`** only for thin utility/legal pages with no search value (e.g. a cookie policy), per `url-taxonomy.md` §5. All pillars, clusters, glossary terms, blog articles, About, and Pricing are **indexed**.
- **Never** emit `noai` / `noimageai` on the marketing site — Oraclous *wants* AI crawlers (geo-crawlers Step 2; robots.txt allows them explicitly).
- **Console contrast:** `app.oraclous.com` does the opposite — every authenticated route serves `noindex, nofollow` via meta **and** an `X-Robots-Tag: noindex, nofollow` HTTP header (robots.txt alone doesn't de-index). That belongs to the console origin, not this model.
- Additionally emit the max-preview hints so AI/search surfaces may show full snippets: `max-snippet:-1, max-image-preview:large, max-video-preview:-1` (append to the default `content`). Full default string: `index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1`.

---

## 8. Other mandatory `<head>` elements (every page)

```html
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />   <!-- mobile, geo-technical §5.1 -->
<link rel="icon" href="/favicon.svg" />
<!-- JSON-LD: the schema set from front-matter `schema:` — one <script type="application/ld+json"> block per type, server-rendered (geo-technical §7) -->
```

- **JSON-LD** is rendered server-side from the front-matter `schema:` array (e.g. Home → `Organization`, `SoftwareApplication`, `FAQPage`, `WebSite`, `BreadcrumbList`). Schema content/shape is owned by the schema spec; this model only guarantees the blocks land in raw HTML, in `<head>` or early `<body>`. `BreadcrumbList` is mandatory on every page (`ia/sitemap.md` §5).
- The `Organization` JSON-LD (Home + Security) carries the `sameAs` array (Wikidata, GitHub, LinkedIn, Crunchbase, …) per `brand-mention-plan.md` §5.
- **Preconnect/preload** for the LCP hero image and the web font live here too (performance — `technical-spec.md` §2).

---

## 9. Worked example — `/platform/byom` (from its real front-matter)

Given the existing `pages/platform/byom.md` front-matter, the build emits:

```html
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>BYOM — bring any model, never get locked in</title>
  <meta name="description" content="BYOM in Oraclous runs the model provider you choose — Anthropic-native, OpenAI-compatible, or Gemini-compatible. Switch by config, never rewrite the Harness." />
  <link rel="canonical" href="https://oraclous.com/platform/byom" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Oraclous" />
  <meta property="og:title" content="BYOM — bring any model, never get locked in" />
  <meta property="og:description" content="BYOM in Oraclous runs the model provider you choose — Anthropic-native, OpenAI-compatible, or Gemini-compatible. Switch by config, never rewrite the Harness." />
  <meta property="og:url" content="https://oraclous.com/platform/byom" />
  <meta property="og:image" content="https://oraclous.com/og/platform/byom.png" />
  <meta property="og:image:alt" content="BYOM — bring any model, never get locked in" />
  <meta property="og:locale" content="en_GB" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@oraclous" />
  <meta name="twitter:title" content="BYOM — bring any model, never get locked in" />
  <meta name="twitter:description" content="BYOM in Oraclous runs the model provider you choose — Anthropic-native, OpenAI-compatible, or Gemini-compatible. Switch by config, never rewrite the Harness." />
  <meta name="twitter:image" content="https://oraclous.com/og/platform/byom.png" />
  <meta name="twitter:image:alt" content="BYOM — bring any model, never get locked in" />

  <link rel="icon" href="/favicon.svg" />
  <!-- JSON-LD: BreadcrumbList, FAQPage, TechArticle (from front-matter schema:) -->
</head>
```

---

## 10. Front-matter → head-tag mapping table

| Head tag | Source (front-matter key) | Rule |
|---|---|---|
| `<title>` | `title` | Verbatim; unique; 50–60 chars; brand in value already; no double-brand. §2 |
| `<meta name="description">` | `meta_description` | Verbatim; unique; **≤ 155 chars**; exact terminology. §3 |
| `<link rel="canonical">` | `url` | `https://oraclous.com` + `url`; self-canonical; no trailing slash/query; == sitemap. §4 |
| `<meta name="robots">` | `robots` (optional) | Default `index, follow, max-snippet:-1, …`; `noindex, follow` only for thin legal. §7 |
| `og:title` / `twitter:title` | `title` | Reuse title. §5 |
| `og:description` / `twitter:description` | `meta_description` | Reuse description. §5 |
| `og:url` | `url` | Canonical absolute. §5 |
| `og:type` | `page_type` / path | `website` default; `article` for `/blog/*` (+ `article:*` tags). §5 |
| `og:image` / `twitter:image` | `og_image` (optional) → templated default | Absolute `oraclous.com` URL; 1200×630; per-type template. §5 |
| `og:image:alt` / `twitter:image:alt` | `og_image_alt` (optional) → `title` | Describe the image. §5 |
| `og:site_name` / `twitter:site` | constant | `Oraclous` / `@oraclous`. §5 |
| `og:locale` | constant | `en_GB`. §6 |
| `<html lang>` | constant | `en`. §6 |
| JSON-LD blocks | `schema` | One block per listed type; server-rendered; `BreadcrumbList` always present. §8 |
| hreflang | — | Not emitted at launch (English-only); reserved shape in §6. |

---

## 11. Build-gate validation (head model)

- [ ] Every page has a non-empty, **unique** `title` (≤ 60 chars; warn 30–65) and `meta_description` (**≤ 155**; warn 150, fail > 160).
- [ ] `canonical` is `https://`, self-referential, no trailing slash/query, and equals the page's `sitemap.xml` entry.
- [ ] `robots` defaults to `index, follow…`; any `noindex` page is intentional and absent from the sitemap.
- [ ] Full OG + Twitter card present; `og:image` resolves to an absolute, existing `200` image with non-empty `alt`.
- [ ] `<html lang="en">` on every page; no hreflang while single-locale.
- [ ] All tags in **raw server-rendered HTML** (verify with `curl`, no JS — geo-technical §7); JSON-LD blocks present with at least `BreadcrumbList`.
- [ ] No `noai`/`noimageai` anywhere on the marketing origin.
- [ ] Exact terminology in every `title`/`meta_description` (ReBAC, OHM, BYOM, Agent — never RBAC/bot).
