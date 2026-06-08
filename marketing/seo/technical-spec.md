# Technical SEO Spec — the engineering requirements

> The build-ready technical SEO requirements for the Oraclous marketing site (`oraclous.com`). Every item is a requirement engineers implement and CI/launch verifies, tied to its **geo-technical** rubric category. Companions: `robots.txt`, `sitemap-plan.md`, `meta-model.md`.
>
> **The cross-domain split is the frame for everything here:** marketing at `oraclous.com` is a **new SSR/SSG app** built to be crawlable; the existing console at `app.oraclous.com` stays a client-rendered SPA, auth-walled and `noindex`. This document specifies the marketing app's technical floor.

---

## 0. THE core requirement — SSR/SSG is mandatory *(geo-technical §7 — Server-Side Rendering)*

**This is the single most important technical requirement on the project, and the reason the marketing site is a new app rather than another route in the console SPA.**

- **AI crawlers do not execute JavaScript.** GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, and friends fetch raw HTML and parse it. They do **not** run a JS bundle, hydrate React, or wait for a client-side fetch. If the content is rendered client-side, **the AI crawler sees an empty page** — and Oraclous's entire GEO strategy (being cited by AI answer engines for governed/sovereign/open-source agentic AI) collapses at step one (geo-crawlers Step 5).
- **The console SPA is the wrong model for marketing.** `apps/console` is a client-rendered React SPA — correct for an auth-walled product behind a login, wrong for an indexable corpus. Reusing it (or its rendering approach) for marketing would ship an empty body to crawlers. Hence a **separate SSR/SSG marketing app**.
- **Requirement:** every marketing page is rendered to **complete HTML on the server / at build time** (SSG preferred for these mostly-static pages; SSR acceptable). The raw HTML response (verified by `curl`, no JS) must contain:
  - the full **main content text** (every H1/H2/H3, every paragraph, every citable-answer block, every FAQ answer);
  - all **`<head>` meta** (title, description, canonical, OG/Twitter — `meta-model.md`);
  - all **JSON-LD** schema blocks (not injected by JS — geo-technical §7 / geo-crawlers Step 5);
  - all **internal links** as real `<a href>` in the markup (so crawlers can follow the topical graph — §6).
- **Acceptable stacks (geo-technical §7 SSR solutions):** for this React/Vite repo, an SSG/SSR React framework (e.g. Next.js SSG/SSR, Remix, or Astro with React islands). The content is largely static (`marketing/pages/*` markdown → pages), so **static generation is the natural fit**; hydration is progressive enhancement only — the page must be complete and readable with JS disabled.
- **Verification (launch gate):** `curl -s https://oraclous.com/platform/byom | grep` finds the H1, the citable-answer text, the canonical tag, the FAQ answers, and the JSON-LD — with no browser involved. If any key content is missing from the curl output, the page fails.

> Scoring intent (geo-technical §7): "all key content server-rendered" = full marks; "critical content requires JS" = near-zero. The target is **all key content in raw HTML**.

---

## 1. Crawlability & indexability *(geo-technical §1, §2)*

- **robots.txt** (`seo/robots.txt`): explicitly allows the AI crawler allowlist + classic crawlers, blocks Bytespider, references the sitemap. (§1.1, §1.2)
- **sitemap.xml** (`seo/sitemap-plan.md`): static, every indexable URL, real `lastmod`, referenced from robots.txt, submitted to GSC + Bing. (§1.3)
- **Canonical** on every page, self-referential, == sitemap (`meta-model.md` §4). (§2.1)
- **Duplicate-content control** (§2.2): one host (`www` → apex or apex → `www`, pick one, 301 the other); HTTP → HTTPS 301; **no trailing slash** (trailing → non-trailing 301); tracking params never create indexable duplicates (canonical + robots param-block). (also §4)
- **No erroneous `noindex`** on pages that should rank; `noindex` only on thin legal pages (`meta-model.md` §7). (§1.5, §2.5)
- **Index-bloat guard:** sitemap count ≈ indexable page count; no parameter/preview/draft pages in the index. (§2.5)

---

## 2. Core Web Vitals & performance budget *(geo-technical §6 + §8)*

Field data (75th percentile) is the target. Budgets:

| Metric | Budget (Good) | Notes |
|---|---|---|
| **LCP** (Largest Contentful Paint) | **< 2.5s** | Hero text/image; preload the LCP image, no lazy-load above the fold. (§6) |
| **INP** (Interaction to Next Paint) | **< 200ms** | Replaced FID. Keep JS minimal — a static marketing site should have very little. Break up any long task > 50ms; defer non-critical scripts. (§6) |
| **CLS** (Cumulative Layout Shift) | **< 0.1** | Explicit `width`/`height` (or `aspect-ratio`) on every image; `font-display: swap` with size-matched fallback; reserve space for any embed. (§6) |
| **TTFB** | **< 800ms** (aim < 200ms) | Static HTML from CDN edge makes this trivial. (§8.1) |
| **Page weight** | **< 1MB** for key pages (< 2MB hard ceiling) | (§8.2) |
| **JS per entrypoint** | **≤ 500 KB gzipped** (repo CI Gate 4); aim ≪ that | A static marketing page should ship near-zero JS. (§8.4 + frontend invariant §1.8) |

- **Render path** (§8): gzip/brotli compression on; CSS/JS minified; no render-blocking resources in `<head>` beyond critical CSS; third-party scripts `async`/`defer` (and kept to the minimum — every tag costs INP).
- **Caching** (§8.5): content-hashed static assets `Cache-Control: max-age=31536000, immutable`; HTML short-cache with `ETag`/revalidation.
- **CDN** (§8.6): serve the whole static site from a CDN edge (global B2B audience) — also the cheapest path to the TTFB/LCP budgets.

---

## 3. Mobile *(geo-technical §5)*

Google crawls **mobile-only** since July 2024 — mobile *is* the site.

- `<meta name="viewport" content="width=device-width, initial-scale=1">` on every page (`meta-model.md` §8). (§5.1)
- Responsive layout, **no horizontal scroll**, no fixed-width-wider-than-viewport. (§5.1)
- Tap targets ≥ 48×48px with ≥ 8px spacing; the mobile nav drawer keeps its existing focus-trap/scroll-lock/focus-restore a11y. (§5.2 + frontend invariant §1.3)
- Base font ≥ 16px; contrast ≥ 4.5:1 body / 3:1 large+UI (WCAG AA — frontend invariant §1.3). (§5.3)
- **Full content parity** desktop ↔ mobile — no content hidden from crawlers. (§5.4)

---

## 4. Structured-data hygiene *(geo-technical §7 + market-seo Step 8)*

- **JSON-LD only**, server-rendered into raw HTML (§7) — never injected by JS.
- Each page emits the types in its front-matter `schema:` array; **`BreadcrumbList` on every page** (`ia/sitemap.md` §5).
- **Only mark up content visible on the page** (no phantom FAQ/review markup) — keep JSON-LD consistent with on-page copy or risk a structured-data penalty.
- Page-type sets (from front-matter): Home → `Organization` + `SoftwareApplication` + `FAQPage` + `WebSite` + `BreadcrumbList`; `/how-it-works` → `HowTo`; glossary index → `DefinedTermSet`; glossary term → `DefinedTerm`; blog article → `Article` + `Person` + `FAQPage`; `/pricing` → `Product`/`Offer`. `Organization` carries the `sameAs` array (`brand-mention-plan.md` §5).
- **Validate** with Google Rich Results Test + Schema.org validator pre-launch; no errors.

---

## 5. Internal linking & crawl depth *(geo-technical §1.4)*

- **Every indexable page reachable within ≤ 3 clicks** from Home (geo-technical §1.4 "3 clicks"). The IA already guarantees this: Home → pillar (1) → cluster (2); the **footer is the flat completeness net** reaching all 11 capability pages + all 6 problem pages + glossary/blog within two clicks (`internal-linking.md` §4). No page is deeper than depth 3.
- **All nav + content links are real `<a href>`** in server-rendered HTML (not JS-router-only) so crawlers follow them (§7 + §1.4).
- **Hub-and-spoke** reciprocal linking per `internal-linking.md` §2 (pillar↔cluster, problem→solution→capability→glossary). **No orphan pages** — every page has inbound internal links (market-seo Step 9).
- **Breadcrumbs** as semantic `<nav aria-label="Breadcrumb">` with clickable up-links + `BreadcrumbList` JSON-LD on every sub-depth-1 page (`internal-linking.md` §5).
- **Descriptive, exact-term anchor text** ("ReBAC governance", "the Compile flow") — never "click here" (`internal-linking.md` §6; a11y + entity signal).

---

## 6. URL structure, pagination & canonical for /blog *(geo-technical §2.3, §4; url-taxonomy)*

- **Clean URLs** (§4.1): lowercase, hyphenated, ASCII, no extensions, no query strings for content, ≤ 2 segments (`url-taxonomy.md` §1).
- **Logical hierarchy** (§4.2): pillar at depth 1, cluster at depth 2; `/platform/{cap}`, `/solutions/{persona}`, `/why-oraclous/{problem}`, `/glossary/{term}`, `/blog/{slug}` — no depth 3.
- **Blog pagination** (§2.3, `url-taxonomy.md` §5): paginated index uses crawlable `<a>` `rel="next"/"prev"` links; **page-2+ self-canonicalises** (NOT canonical-to-page-1) so deep articles stay discoverable; articles self-canonicalise. No `noindex` on pagination (would strand articles).
- **No `/category/` or date segment** in blog paths; categories are metadata, not URL segments (`url-taxonomy.md` §4).
- **Platform vs glossary**: distinct intent, each self-canonical, no cross-canonical (`meta-model.md` §4).

---

## 7. Redirects & 404 handling *(geo-technical §4.3, §2.2)*

- **All redirects 301 (permanent)**, **max 1 hop** — no redirect chains, no loops (§4.3). Enforce: trailing-slash → non-trailing, uppercase → lowercase, HTTP → HTTPS, `www`↔apex, any legacy/renamed slug → canonical (`url-taxonomy.md` §5).
- **Slug renames always 301** — never delete a published URL without a 301; never let a renamed page 404 (`url-taxonomy.md` §5).
- **Annual blog refresh**: `...-2025` 301 → `...-2026` (preserve authority).
- **404 page**: returns a real **HTTP 404** status (not a 200 "soft 404"), is server-rendered, and links back into the site (Home, Platform, Glossary, Blog) so a crawler/user that lands on a dead URL recovers — and so crawl budget isn't wasted on soft-404s.

---

## 8. Security *(geo-technical §3)*

A trust signal for both ranking and the security-buyer persona (the site sells data sovereignty — it must model it).

- **HTTPS enforced**, valid cert, HTTP → HTTPS 301, **no mixed content** (§3.1).
- **Security headers** (§3.2): `Strict-Transport-Security: max-age=31536000; includeSubDomains`; `Content-Security-Policy` (locked-down, no `unsafe-inline` where avoidable); `X-Content-Type-Options: nosniff`; `X-Frame-Options: DENY` (or CSP `frame-ancestors`); `Referrer-Policy: strict-origin-when-cross-origin`; `Permissions-Policy` minimal.
- **Cross-origin cookie boundary:** marketing analytics/consent cookies are scoped to `oraclous.com` and never readable by `app.*`; **no auth tokens on the marketing origin** (it never handles them — frontend invariant §1.5; `url-taxonomy.md` §7).
- `security.txt` at `/.well-known/security.txt` (footer references it).

---

## 9. Image optimization *(geo-technical §8.3 + market-seo Step 2 images)*

- **Formats:** WebP/AVIF preferred over JPEG/PNG; SVG for icons/diagrams.
- **Sized correctly**, never larger than display; `srcset`/`<picture>` for responsive sizes.
- **`loading="lazy"` below the fold**; **never lazy-load the LCP/above-fold hero** (harms LCP — §8.3 / §6).
- **Explicit `width`/`height` (or `aspect-ratio`)** on every image (prevents CLS — §6).
- **Descriptive `alt`** on every meaningful image (a11y + image SEO); empty `alt=""` for purely decorative; descriptive filenames (not `IMG_001.jpg`).
- Preload the hero image for the LCP budget (§2).

---

## 10. AI-crawler & GEO extras *(geo-crawlers; geo-technical IndexNow)*

- **`llms.txt` at the root** — the GEO map for answer engines (footer links to it; separate GEO deliverable, referenced in `url-taxonomy.md` §5 and `internal-linking.md` §4).
- **No `noai`/`noimageai`** meta or `X-Robots-Tag` anywhere on the marketing origin — Oraclous wants AI crawlers (geo-crawlers Step 2/3).
- **IndexNow** (geo-technical IndexNow): publish the key file + ping Bing/Yandex on publish/update. ChatGPT and Copilot ride Bing's index, so faster Bing indexing = faster AI visibility on two major surfaces. Implement on the build/publish pipeline.
- **Console contrast (must verify):** `app.oraclous.com` ships its own `Disallow: /` robots.txt **and** `noindex, nofollow` (meta + `X-Robots-Tag` header) on authenticated routes — robots.txt alone does not de-index (geo-technical §1.5; `url-taxonomy.md` §7).

---

## 11. Pre-launch technical SEO checklist

Grouped by rubric category; each must pass before `oraclous.com` goes live.

### Crawlability / Indexability *(§1, §2)*
- [ ] `robots.txt` live: AI allowlist + classic crawlers Allow, Bytespider Disallow, `Sitemap:` line present, valid syntax.
- [ ] `sitemap.xml` live: every indexable URL, real `lastmod`, no `noindex`/redirect/`app.*` URLs, count == inventory; submitted to GSC + Bing.
- [ ] Self-referential canonical on every page == its sitemap entry; platform/glossary each self-canonical.
- [ ] No erroneous `noindex`; thin legal pages `noindex` + out of sitemap.
- [ ] `www`/apex, HTTP/HTTPS, trailing-slash all resolve to one canonical via single-hop 301.

### SSR / Rendering *(§7) — THE gate*
- [ ] `curl` (no JS) on Home + a pillar + a cluster + a glossary term + a blog article shows full content, `<head>` meta, JSON-LD, and `<a href>` internal links.
- [ ] Page is readable and navigable with JavaScript disabled.

### Core Web Vitals / Performance *(§6, §8)*
- [ ] LCP < 2.5s, INP < 200ms, CLS < 0.1 (lab + field where available) on key templates.
- [ ] TTFB < 800ms from CDN; gzip/brotli on; JS entrypoint ≤ 500 KB gz (aim ≪); page weight < 1MB key pages.
- [ ] Static assets immutably cached; HTML revalidated.

### Mobile *(§5)*
- [ ] Viewport tag everywhere; no horizontal scroll; tap targets ≥ 48px; body ≥ 16px; AA contrast; full content parity.

### Structured data *(§7)*
- [ ] JSON-LD server-rendered, `BreadcrumbList` on every page, page-type sets present, `Organization` `sameAs` set; Rich Results Test clean.

### Head model *(meta-model.md)*
- [ ] Unique titles (≤ 60) + descriptions (≤ 155) per page; full OG/Twitter + valid `og:image`; `lang="en"`; robots default `index, follow…`; no `noai`.

### Internal linking / depth *(§1.4)*
- [ ] Every page ≤ 3 clicks from Home; footer reaches all clusters; no orphans; breadcrumbs + exact-term anchors.

### URLs / Redirects / 404 *(§4, §2.3)*
- [ ] Clean lowercase hyphenated URLs ≤ 2 segments; blog pagination crawlable + self-canonical; real 404 status with recovery links; no redirect chains.

### Security *(§3)*
- [ ] HTTPS enforced, valid cert, no mixed content; HSTS + CSP + nosniff + frame + referrer + permissions headers; `security.txt`; no auth tokens on marketing origin.

### Images *(§8.3)*
- [ ] WebP/AVIF, sized, lazy below fold (hero eager), explicit dimensions, descriptive `alt`/filenames.

### GEO extras *(geo-crawlers; IndexNow)*
- [ ] `llms.txt` live; IndexNow wired; **console verified `noindex` + Disallow** (cross-domain split intact).
