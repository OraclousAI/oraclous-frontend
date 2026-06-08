# Sitemap Strategy — `oraclous.com/sitemap.xml`

> The XML sitemap strategy for the Oraclous marketing site: the full indexable URL inventory (derived from `ia/sitemap.md` + `ia/url-taxonomy.md`), priority/changefreq guidance, the `lastmod` approach, and how the file is generated **statically at build**. This is a build-ready spec. The console at `app.oraclous.com` is excluded entirely (separate origin, noindex — see `robots.txt`).
>
> Rubric ties: **geo-technical §1.3** (XML sitemaps — validity, `<lastmod>`, URL count, 200s), **§1.1** (sitemap referenced from robots.txt), **§4** (clean URL structure mirrored in the sitemap). All URLs are absolute, `https://`, no trailing slash, lowercase, no query strings (per `url-taxonomy.md` §1).

---

## 1. Scope & principles

- **One origin only.** `oraclous.com/sitemap.xml` lists **only** marketing URLs. `app.oraclous.com` is never listed — it is auth-walled, `noindex`, and owns its own (empty/disallow) `robots.txt` (`url-taxonomy.md` §7).
- **Indexable URLs only.** Every URL in the sitemap is a `200`, self-canonical, indexable page. Never list redirects (301 targets only, never the source), `noindex` pages, or paginated `?page=` variants of a canonical URL.
- **Mirror the canonical form exactly.** No trailing slash, lowercase, hyphenated, no query string — byte-identical to the page's self-referencing `<link rel="canonical">` (`meta-model.md`). A sitemap URL that doesn't match its canonical is a contradiction crawlers penalise.
- **Single flat sitemap (no index needed).** The full inventory is well under the 50,000-URL / 50 MB per-file limit (current total ≈ **60–80 URLs** + blog growth). A `sitemap_index.xml` is only introduced if the blog ever exceeds ~5,000 articles (it won't for years). Until then, one `sitemap.xml`.

---

## 2. Full URL inventory (derived from the IA)

The frozen evergreen set is fixed by `ia/url-taxonomy.md` §6; blog and glossary are collections. Counts below are the indexable totals the build must emit.

### 2.1 Top-level pages (12)

| URL | Page type | priority | changefreq |
|---|---|---|---|
| `/` | Pillar / conversion | 1.0 | weekly |
| `/platform` | Pillar | 0.9 | monthly |
| `/how-it-works` | Pillar | 0.8 | monthly |
| `/solutions` | Pillar | 0.8 | monthly |
| `/why-oraclous` | Pillar | 0.8 | monthly |
| `/security` | Pillar | 0.9 | monthly |
| `/open-source` | Pillar | 0.8 | monthly |
| `/developers` | Pillar | 0.8 | monthly |
| `/pricing` | Conversion | 0.9 | monthly |
| `/blog` | Pillar (collection index) | 0.7 | daily |
| `/glossary` | Pillar (collection index) | 0.7 | weekly |
| `/about` | Utility | 0.5 | yearly |

### 2.2 Platform capability pages — children of `/platform` (11)

`priority` 0.7, `changefreq` monthly for all.

```
/platform/harness-model
/platform/actors
/platform/compile
/platform/rebac-governance
/platform/byom
/platform/knowledge-graph
/platform/human-in-the-loop
/platform/execution-scheduling
/platform/mcp-widgets
/platform/portability
/platform/metering
```

### 2.3 Solutions persona pages — children of `/solutions` (4)

`priority` 0.7, `changefreq` monthly (conversion intent).

```
/solutions/operations
/solutions/developers
/solutions/regulated
/solutions/multi-model
```

### 2.4 Why-Oraclous problem pages — children of `/why-oraclous` (6)

`priority` 0.7, `changefreq` monthly (highest commercial intent cluster — keyword-map §G).

```
/why-oraclous/bespoke-code-is-brittle
/why-oraclous/closed-saas-lock-in
/why-oraclous/framework-wiring-overhead
/why-oraclous/data-sovereignty
/why-oraclous/vendor-lock-in
/why-oraclous/agent-governance-audit
```

### 2.5 Glossary term pages — children of `/glossary` (17)

`priority` 0.6, `changefreq` monthly. These are the AEO entity anchors (`ia/sitemap.md` §3); definitions change rarely but must stay discoverable.

```
/glossary/harness
/glossary/ohm
/glossary/operator
/glossary/actor
/glossary/capability
/glossary/consciousness
/glossary/portability
/glossary/second-mind
/glossary/platform-as-code
/glossary/actors-as-harnesses
/glossary/rebac
/glossary/byom
/glossary/mcp
/glossary/agentic-ai
/glossary/multi-agent-orchestration
/glossary/data-sovereignty
/glossary/agent
```

### 2.6 Blog articles — children of `/blog` (N, grows over time)

`priority` 0.6, `changefreq` monthly (evergreen-refreshed in place — `url-taxonomy.md` §4). Pattern `/blog/{post-slug}`, flat, no date segment. The build enumerates whatever article files exist at build time; seed set (per `ia/page-structures/blog.md`):

```
/blog/best-open-source-ai-agent-platforms-2026
/blog/best-ai-agent-orchestration-platforms-2026
/blog/rebac-vs-rbac-for-ai-agents
/blog/open-source-langchain-alternative
/blog/ai-agent-framework-vs-platform
/blog/how-to-control-what-an-ai-agent-can-access
/blog/what-is-data-sovereignty-for-ai
/blog/byom-run-claude-gpt-gemini-or-local-model
/blog/build-vs-buy-ai-agents
/blog/state-of-governed-sovereign-agents
```

### 2.7 Inventory totals

| Group | Count |
|---|---|
| Top-level | 12 |
| Platform capabilities | 11 |
| Solutions | 4 |
| Why-Oraclous | 6 |
| Glossary terms | 17 |
| Blog index | (in top-level) |
| Blog articles (seed) | ~10, growing |
| **Indexable evergreen total** | **50** |
| **+ blog articles** | **~60 at seed, grows** |

> **NOT in the sitemap (excluded, by design):** `app.oraclous.com/*` (separate origin); any `noindex` legal/cookie page (`url-taxonomy.md` §5); blog index pagination pages `/blog?page=2…` (the deep articles carry their own entries — listing the page-2 facet would be a duplicate-intent URL); `utm`/`ref`-tagged URLs (never canonical).

---

## 3. `priority` & `changefreq` guidance

`priority` and `changefreq` are **hints**, not directives — Google largely ignores them, but Bing and several AI crawlers still read them, and a coherent set costs nothing. Apply them consistently rather than gaming them.

- **`priority`** encodes the page's relative importance within *this* site (it is not cross-site). Scale used: Home `1.0`; high-intent pillars + conversion (`/platform`, `/security`, `/pricing`) `0.9`; other pillars `0.8`; deep cluster/collection pages `0.6–0.7`; utility `0.5`. Do **not** set everything to `1.0` — that flattens the signal to noise.
- **`changefreq`** reflects realistic update cadence: `/` and `/blog` change often (`weekly`/`daily`); evergreen pillars/clusters `monthly`; `/about` `yearly`. Set it to the *truth*, not aspiration — a `daily` claim on a page that never changes erodes trust.
- The authoritative freshness signal is **`<lastmod>`**, not `changefreq` (§4). Crawlers weight `lastmod` far more heavily; treat `priority`/`changefreq` as low-value extras and `lastmod` as the real lever.

---

## 4. `lastmod` approach

`<lastmod>` is the most consulted field in the sitemap — it tells crawlers what to re-fetch and is a primary GEO freshness signal. It must be **accurate**, or it is worse than absent.

- **Source of truth = the page's real last content change**, derived at build time from the underlying content file's git commit timestamp (`git log -1 --format=%cI -- <file>`), NOT the build clock. A site-wide rebuild must not bump every `lastmod` to "today" — that trains crawlers to ignore the field.
- **Format:** W3C Datetime / ISO 8601 with timezone (`2026-06-07T00:00:00+00:00` or date-only `2026-06-07`). Be consistent across the file.
- **Blog articles:** `lastmod` = `dateModified` from the article front-matter / `Article` JSON-LD (they must agree). On an annual refresh (e.g. `...-2025` → `...-2026`), the new slug gets a fresh `lastmod` and the old slug 301s out of the sitemap.
- **Glossary/evergreen:** updates rarely; `lastmod` reflects the last real edit to that term/page, so genuine definition updates re-trigger crawls while untouched pages stay quiet.

---

## 5. Generation: STATIC, at build time

The sitemap is **generated as a static file during the build** and served as a plain `200` `application/xml` resource — never rendered on the fly per request, and never client-side. This matches the core technical mandate (SSG/SSR; AI crawlers don't run JS — see `technical-spec.md`): the sitemap, like every page, must be real bytes in the response.

**Mechanism:**

1. A build step enumerates the page sources (the evergreen route manifest derived from `ia/url-taxonomy.md` §6, plus the file globs for `glossary/*` and `blog/*`).
2. For each, it resolves: canonical absolute URL (`https://oraclous.com` + clean path, no trailing slash), `<lastmod>` (git commit time of the source file, §4), `priority` and `changefreq` (from the §2/§3 tables, keyed by page type).
3. It **excludes** any source marked `noindex` in front-matter, any draft/preview path, and the entire `app.*` surface.
4. It emits `dist/sitemap.xml` and verifies (a) well-formed XML, (b) every URL is `https://` + canonical-form + no duplicates, (c) the count matches the expected inventory (±blog). A mismatch fails the build.
5. `robots.txt` already references `Sitemap: https://oraclous.com/sitemap.xml`.

**Keep it honest automatically:** the sitemap is derived from the same route source as the pages, so a new page (e.g. a new glossary term or blog post) appears in the sitemap by virtue of existing — there is no separate hand-maintained list to drift. A page that is `noindex` or removed drops out the same way.

> The framework's own sitemap plugin (e.g. an SSG sitemap integration) may produce this, **provided** it (a) emits at build time, (b) uses real per-file `lastmod`, and (c) honours the noindex/exclusion rules above. Do not accept a default that stamps build-time on every `lastmod` or includes non-canonical URLs.

---

## 6. Representative `sitemap.xml` snippet

A trimmed, valid example showing the namespace, one of each page type, the canonical no-trailing-slash form, real `lastmod`, and the §2/§3 priority/changefreq tiers. The production file lists every URL from §2.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- Home: highest priority, changes often -->
  <url>
    <loc>https://oraclous.com/</loc>
    <lastmod>2026-06-07</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Pillar (high-intent) -->
  <url>
    <loc>https://oraclous.com/platform</loc>
    <lastmod>2026-06-05</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Conversion -->
  <url>
    <loc>https://oraclous.com/pricing</loc>
    <lastmod>2026-06-03</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Platform capability (cluster, child of /platform) -->
  <url>
    <loc>https://oraclous.com/platform/byom</loc>
    <lastmod>2026-06-02</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Solutions persona page (conversion cluster) -->
  <url>
    <loc>https://oraclous.com/solutions/operations</loc>
    <lastmod>2026-05-28</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Why-Oraclous problem page (highest commercial-intent cluster) -->
  <url>
    <loc>https://oraclous.com/why-oraclous/vendor-lock-in</loc>
    <lastmod>2026-05-28</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Glossary term (AEO entity anchor) -->
  <url>
    <loc>https://oraclous.com/glossary/rebac</loc>
    <lastmod>2026-05-20</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- Blog article (evergreen, refreshed in place) -->
  <url>
    <loc>https://oraclous.com/blog/rebac-vs-rbac-for-ai-agents</loc>
    <lastmod>2026-06-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- Utility -->
  <url>
    <loc>https://oraclous.com/about</loc>
    <lastmod>2026-04-10</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>

</urlset>
```

> No `<image:image>` or `<news:news>` extensions are needed at launch. If OG/hero images later warrant image-sitemap inclusion, add the `image` namespace per page; it is not required for the core crawl.

---

## 7. Validation checklist (build gate)

- [ ] Well-formed XML, correct `urlset` namespace, served as `application/xml` with `200`.
- [ ] Every `<loc>` is `https://oraclous.com` + canonical path (lowercase, hyphenated, **no trailing slash**, no query string) and matches the page's self-canonical exactly.
- [ ] No duplicates; no redirect sources; no `noindex` pages; no `app.*` URLs; no `utm`/`ref` URLs.
- [ ] Every listed URL returns `200` (sample-check in CI; full check pre-launch).
- [ ] `<lastmod>` is the real per-file change time, ISO 8601, not the build clock.
- [ ] URL count == expected inventory (50 evergreen + current blog/glossary), else fail the build.
- [ ] `robots.txt` references the sitemap; sitemap submitted to Google Search Console + Bing Webmaster Tools at launch.
