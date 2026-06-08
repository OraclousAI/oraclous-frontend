# Oraclous Marketing Site — URL Taxonomy

> URL conventions, rationale, redirect/canonical rules, blog pattern, and how capability deep pages nest under `/platform`. The marketing site is `oraclous.com`; the product console is `app.oraclous.com` — a hard cross-domain boundary (see §7). Companion to `sitemap.md` and `internal-linking.md`.

---

## 1. Conventions (the rules)

1. **Lowercase, hyphenated, ASCII.** Words separated by single hyphens; no underscores, camelCase, spaces, or `%20`. `/why-oraclous/closed-saas-lock-in` — never `/why-oraclous/closedSaaSLockIn` or `/why_oraclous/closed_saas`.
2. **Shallow — two segments max for evergreen pages.** Section hub at depth 1 (`/platform`), its children at depth 2 (`/platform/byom`). Do **not** go to depth 3 for evergreen marketing pages (no `/platform/governance/rebac`). Blog and glossary are the only `/{collection}/{slug}` patterns, and they stay at depth 2.
3. **No trailing slash** on content pages. `/platform/byom` is canonical; `/platform/byom/` 301-redirects to it. Pick one form and enforce it server-side.
4. **No file extensions, no query strings for content.** Clean paths only. Query strings are reserved for tracking (`?utm_*`) and never alter canonical content.
5. **Nouns and problems, not verbs or marketing adjectives in the slug.** `/security`, `/pricing`, `/why-oraclous/data-sovereignty` — not `/get-secure` or `/best-platform`. The slug describes the entity/topic so it reads as a stable identifier to humans and answer engines.
6. **Stable slugs = stable entities.** A slug is a permanent identifier once published; renaming requires a 301 (see §5). Keyword-map target queries inform the slug at creation, then the slug is frozen.
7. **Singular section nouns where the page is one topic; plural where it is a collection.** `/security`, `/pricing`, `/about` (single topics) vs `/solutions/...`, `/blog/...`, `/glossary/...` (collections). `/developers` and `/platform` are pluralised/conventional per established SaaS patterns and the keyword map.
8. **Terminology in slugs is exact.** `rebac-governance`, `byom`, `harness-model`, `ohm` — never `rbac`, `bring-your-own-llm`, `bot`. Slugs reinforce the brand-owned vocabulary; a wrong term in a URL is an entity-resolution error.

---

## 2. Rationale (why these rules)

- **Shallow + hyphenated + lowercase** is the long-standing SEO baseline (readable, no case-sensitivity bugs across servers, clean in SERPs and citations). It also matters for **AEO**: answer engines cite URLs, and a clean, descriptive path is a stronger entity signal than a deep or encoded one.
- **Slug = entity identifier.** Oraclous's strategy depends on engines resolving proprietary terms (Harness, OHM, ReBAC-for-agents) to one canonical place. The URL is part of that signal — `/glossary/rebac` and `/glossary/ohm` are the entity's address; keeping them stable and exactly-termed compounds authority over time.
- **Two-segment ceiling** keeps the topical hierarchy legible to crawlers (pillar at depth 1, cluster at depth 2 = textbook hub-and-spoke) and avoids diluting link equity through deep nesting.
- **Problem-named Why-Oraclous slugs** (`bespoke-code-is-brittle`, `vendor-lock-in`) double as the exact-match target for the pain/comparison queries in `keyword-entity-map.md` §Pillar-G, which is the highest-commercial-intent cluster.

---

## 3. How capability deep pages nest under `/platform`

- The **Platform hub** is `/platform` (pillar). Each capability is a **direct child** at depth 2: `/platform/{capability-slug}`. There is **no intermediate category segment** — capabilities are siblings, not grouped under `/platform/governance/…` etc. This keeps every capability one hop from the hub and from each other (strong internal-link mesh; see `internal-linking.md`).
- Capability slugs are the capability's canonical short name, exact-termed:

  | Capability (messaging matrix §2) | Slug |
  |---|---|
  | Harness model (+ OHM) | `/platform/harness-model` |
  | Actors (humans + Agents) | `/platform/actors` |
  | Compile flow | `/platform/compile` |
  | ReBAC governance | `/platform/rebac-governance` |
  | BYOM | `/platform/byom` |
  | Knowledge graph + retrieval | `/platform/knowledge-graph` |
  | HITL | `/platform/human-in-the-loop` |
  | Execution / scheduling | `/platform/execution-scheduling` |
  | Widgets + MCP | `/platform/mcp-widgets` |
  | Portability | `/platform/portability` |
  | Metering | `/platform/metering` |

- **Why not `/features/...`?** "Platform" is the category term Oraclous targets (`AI agent orchestration platform`); nesting capabilities under it concentrates topical authority on the word that matters. A `/features` tree would split that authority.
- A capability that is *also* an entity in the Glossary (Harness, OHM, ReBAC, BYOM, Portability, MCP) keeps **two pages with distinct intent**: the `/platform/...` page is the product/benefit page (commercial); the `/glossary/...` page is the definition (informational). They cross-link, and the **glossary page is the canonical definition** — the platform page links to it for the entity definition rather than restating it. (See §5 canonical rules and `internal-linking.md`.)

---

## 4. Blog URL pattern

- **Pattern:** `/blog/{post-slug}` — flat, no date segment, no category segment in the path.
  - Example: `/blog/rebac-vs-rbac-for-ai-agents`, `/blog/best-open-source-ai-agent-platforms-2026`.
- **No dates in the URL.** Dates age a URL and discourage updates; evergreen comparison/listicle posts (the keyword map's "best X 2026" format) get refreshed in place. Publish/modified dates live in the page metadata and `Article` schema (`datePublished` / `dateModified`), not the path.
- **No `/category/` in the path.** Categories/tags are navigation and `BlogPosting` metadata, not URL segments — they would create thin duplicate hub pages and deepen the path. If category landing pages are ever needed, they use a separate, indexable hub (`/blog/topic/{topic}`) decided later, not a path prefix on every article.
- **Slug from the title, trimmed to the head query.** Keep slugs short and query-led; drop stop-words. `best-open-source-ai-agent-platforms-2026` not `the-10-best-open-source-ai-agent-orchestration-platforms-of-2026`.
- **Year suffix only for explicitly annual content** (`...-2026`) that competes in dated SERPs; on the yearly refresh, mint a new slug and 301 the prior year (see §5).

---

## 5. Redirect & canonical rules

**Canonical tag — every indexable page self-canonicalises** to its clean, no-trailing-slash, no-query URL. Tracking parameters (`utm_*`, `ref`, etc.) never change the canonical.

**301 redirects (permanent):**
- Trailing slash → no trailing slash; uppercase → lowercase; any legacy/alternate path → the canonical path.
- Slug rename: old slug 301 → new slug. Never delete a published URL without a 301; never let a renamed page 404.
- Annual blog refresh: `...-2025` 301 → `...-2026` when the post is rolled forward (preserves accrued authority).
- Consolidation: if two pages compete for the same query, merge content into one and 301 the loser (the keyword map warns against fighting head terms — consolidate rather than cannibalise).

**Canonical for near-duplicate intent (platform vs glossary):**
- Where a `/platform/{cap}` page and a `/glossary/{term}` page cover the same entity, **each self-canonicalises** (distinct intent: commercial vs definitional) — they are *not* cross-canonicalised. The glossary page is positioned as the **definition source**; the platform page links to it for the definition and focuses on product value. This avoids both duplication and a canonical collision.

**Noindex (excluded from index, still crawlable where useful):**
- Thin utility/legal pages with no search value (e.g. cookie policy) may `noindex`. About, Pricing, all pillars/clusters are **indexed**.

**Pagination (blog index):** use `rel="next"/"prev"` semantics via crawlable `<a>` links; page-2+ of the blog index self-canonicalises (no canonical-to-page-1) so deep articles stay discoverable.

**`sitemap.xml` and `robots.txt`:** a generated `sitemap.xml` lists every indexable URL with `lastmod`; `robots.txt` allows the AI crawlers per the GEO plan and points to the sitemap. An `llms.txt` at the root (GEO deliverable) maps the site for answer engines.

---

## 6. URL summary table (the frozen set)

| Path | Depth | Collection? |
|---|---|---|
| `/` | 0 | — |
| `/platform` | 1 | hub |
| `/platform/{capability}` | 2 | child pages (11) |
| `/how-it-works` | 1 | — |
| `/solutions` | 1 | hub |
| `/solutions/{persona}` | 2 | child pages (4) |
| `/why-oraclous` | 1 | hub |
| `/why-oraclous/{problem}` | 2 | child pages (6) |
| `/security` | 1 | — |
| `/open-source` | 1 | — |
| `/developers` | 1 | — |
| `/pricing` | 1 | — |
| `/blog` | 1 | collection index |
| `/blog/{post-slug}` | 2 | articles |
| `/glossary` | 1 | collection index |
| `/glossary/{term}` | 2 | terms (17) |
| `/about` | 1 | — |

---

## 7. Cross-domain boundary: `oraclous.com` vs `app.oraclous.com`

- **`oraclous.com`** = the marketing site (everything in this taxonomy). Public, indexable, optimised for SEO/AEO, no auth.
- **`app.oraclous.com`** = the product **console** (the existing `apps/console` app). Authenticated; **not** indexed (`robots.txt` disallow + `noindex`); not part of the marketing topical graph.
- **The boundary is one-way and explicit:**
  - Marketing CTAs that mean "use the product" (Start free, Sign in, Open console, Try the Compile flow in the console) link **out** to `app.oraclous.com` (or `app.oraclous.com/signup`). These are **external** links from the marketing site's perspective — they leave the indexed surface.
  - The console **never** links back into marketing content as part of its app chrome beyond a logo→`oraclous.com` and footer links; the console is not a topical-authority contributor.
  - **No marketing content lives on `app.*`** and **no product/auth surface lives on `oraclous.com`**. Sign-in/sign-up flows are on `app.*`; the marketing site only links to them.
- **Why a subdomain (not `/app`):** clean separation of the indexable marketing corpus from the auth-walled product; independent deploys; the console keeps its own session/cookie scope (cookies are scoped to `app.oraclous.com`, never shared into the marketing origin), which aligns with the no-tokens-in-marketing posture.
- **Canonical/sitemap scope:** `oraclous.com/sitemap.xml` lists only marketing URLs. `app.oraclous.com` is excluded from indexing entirely. Each origin owns its own `robots.txt`.
- **Cookie/consent boundary:** marketing analytics/consent live on `oraclous.com`; they do not set cookies readable by `app.*`. Auth tokens are an `app.*` concern only (consistent with the frontend invariant that auth tokens never touch persistent storage on the marketing side because the marketing side never handles them).

> Link-attribute note: outbound CTAs to `app.oraclous.com` are first-party-adjacent (same brand) — do not `nofollow` them, but they are tracked as conversion events. External third-party citations/sources (e.g. Wikipedia for ReBAC/MCP entity association) follow the contextual-link rules in `internal-linking.md`.
