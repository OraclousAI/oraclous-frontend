# Marketing App — Architecture Spec (`apps/marketing`)

> **Status:** Build-ready blueprint. SPEC ONLY — no application code is created by this document; it is the plan the gated build phase follows under the GitHub Issues + PR workflow.
> **Author role:** Build Architect (devops-leaning).
> **Scope:** A new static-site-generated (SSG) marketing app that renders the content the marketing team has produced under `oraclous-frontend/marketing/`, served at `oraclous.com`. The existing authenticated console stays at `app.oraclous.com`.
> **Authority:** This spec is subordinate to `oraclous-frontend/CLAUDE.md` (the repo working contract) and to `oraclous-knowledge` on architecture. Where it disagrees with either, those win — open a `docs:` PR to reconcile.

---

## 0. TL;DR for an implementer

- **Framework: Astro** (SSG, near-zero JS by default), with **React islands** so `@oraclous/design-system` components are reused where interactivity is genuinely needed.
- **New workspace package `apps/marketing`** in the existing pnpm workspace, depending on `@oraclous/design-system` (built first, like the console) and `@oraclous/ui-utils`.
- **Content pipeline: Astro Content Collections** typed with a Zod schema that mirrors the existing YAML front-matter (`title`, `meta_description`, `url`, `page_type`, `primary_persona`, `primary_query`, `secondary_queries`, `schema[]`, `primary_cta`, `secondary_cta`).
- **Three decisions that dominate the design** (read §1.4, §3.2, §3.6 in full before the first PR):
  1. **Styling = `tokens.css` + scoped CSS, NOT Tailwind utility classes.** The design-system's shadcn components emit Tailwind classes (`bg-primary`, `text-sm`, …) via `class-variance-authority`; they only render styled when a Tailwind build with `tailwindPreset` runs. The console deliberately avoids Tailwind (inline styles + `tokens.css`). The marketing app follows the **same token-first, low-JS approach** — it consumes `@oraclous/design-system/tokens.css` and a small set of **Astro-native components** for static content, and pulls in a React island (with its Tailwind dependency satisfied locally) **only** for the few interactive widgets. This avoids shipping Tailwind + React to render a static marketing page.
  2. **Content stays under `marketing/` as the source of truth**; the app reads it via a Content Collections `loader` pointed at `../../marketing/pages/**`. We do not fork the content into the app.
  3. **GEO/SEO machine assets (`llms.txt`, `llms-full.txt`, `robots.txt`, `sitemap.xml`, JSON-LD) are emitted by the build** from front-matter + a small set of source files the GEO/SEO specialists own — they do not exist yet (see §0.1) and are produced as part of the GEO PR.

### 0.1 Reality check — what exists vs. what this spec assumes

The brief referenced `marketing/seo/` and `marketing/geo/`. **Those directories do not exist yet.** What exists today:

| Exists | Path |
|---|---|
| Page content (markdown + front-matter) | `marketing/pages/**.md` (home, platform + 11 capability clusters, solutions + 4, why-oraclous + 6, security, open-source, developers, pricing, about) |
| IA / sitemap / URL taxonomy / linking | `marketing/ia/{sitemap,url-taxonomy,internal-linking}.md`, `marketing/ia/page-structures/*` |
| Glossary **definitions** (not yet per-term pages) | `marketing/brand/glossary.md` |
| Strategy / research | `marketing/strategy/*`, `marketing/research/*` |

**Gaps the build plan must account for** (called out again in §9):
- No `marketing/seo/` or `marketing/geo/` directory — `llms.txt`, JSON-LD templates, robots policy, and the AI-crawler allowlist are **inputs to be produced** (GEO PR), not files to wire up.
- No `marketing/pages/glossary*.md` — the 17 glossary term pages and the glossary index are **derived from `marketing/brand/glossary.md`** + `marketing/ia/page-structures/glossary.md` (see §3.5). Either the content team authors them as `.md` files, or the build generates them from the glossary source. **Recommendation: author them as content-collection entries** so they go through the same schema/SEO pipeline (decision flagged in §9).
- No blog posts authored yet — the `/blog` collection ships empty-but-valid (index renders, zero articles) and fills later.

---

## 1. Framework choice — Astro (with React islands)

### 1.1 The recommendation

Build the marketing site with **Astro** in SSG mode. Author pages and layout in `.astro` components; render the small number of interactive pieces (mobile nav drawer, mega-menu, glossary search/filter, FAQ accordions if not native `<details>`) as **React islands** using `@astrojs/react`, so existing `@oraclous/design-system` React components and `@oraclous/ui-utils` hooks are reusable rather than re-implemented.

### 1.2 Why Astro wins against the CLAUDE.md invariants

| CLAUDE.md invariant | How Astro satisfies it |
|---|---|
| **§1.8 bundle budget ≤ 500 KB gz / entrypoint** | Astro ships **zero JS by default**; only `client:*` islands hydrate. A marketing page can be ~0 KB JS, which is the strongest possible position against the cap and the easiest to keep there. |
| **§1.3 WCAG AA floor + Gate 3 axe-core** | Static HTML with semantic markup is the cleanest substrate for axe-core; fewer hydrated widgets = fewer a11y regressions. Islands that *are* interactive reuse the already-AA design-system primitives. |
| **§1.4 design-system is the contract** | Tokens (`tokens.css`) import unchanged; design-system React components render inside islands; Astro components consume the same CSS variables — no new color/spacing/type invented. |
| **§1.1/§1.2 gateway-only + typed client** | The marketing site is **content-only and makes no backend calls** at build or runtime. There is no `fetch`/`axios` in feature code, so Gates 1 & 2 are satisfied by construction. Product CTAs are plain cross-origin `<a href="https://app.oraclous.com…">` links (see §6). |
| **§1.7 no `dangerouslySetInnerHTML`** | Astro renders markdown to HTML at build time via its own pipeline (no `dangerouslySetInnerHTML`), so Gate 5 stays clean. (See §3.4 for the one nuance: JSON-LD injection uses `set:html` on a `<script type="application/ld+json">` with build-time-controlled, non-user data — documented as the approved mechanism, analogous to the existing `chart.tsx` exception.) |
| **GEO/Core Web Vitals (the whole point of the marketing site)** | Pre-rendered HTML + minimal JS is the best-possible CWV/LCP/CLS profile and the most "citable" surface for answer engines — directly serves the GEO strategy in `marketing/ia/*` and `marketing/research/*`. |

### 1.3 Trade-offs considered

**Astro vs. Next.js static export (`output: 'export'`):**
- Next static export *can* prerender, but its model is React-first: every page is a React tree, the framework runtime ships to the client, and "zero JS" is something you fight toward, not the default. For a content site that's mostly prose, that's backwards.
- Next's strengths (server components, ISR, middleware, image optimization at the edge) are **runtime** features we explicitly don't want on a static marketing surface — they pull toward a server/host we'd rather not run for `oraclous.com`.
- Astro's content collections + island model is purpose-built for exactly this corpus shape (markdown + front-matter + a few interactive bits). **Astro is the better fit; Next would be over-framework.**

**Astro vs. extending the existing Vite + React console app (a second SPA):**
- The console is a client-rendered SPA (good for an auth-walled app, wrong for an indexable marketing site). An SPA marketing site would hurt SEO/GEO (empty initial HTML, JS-dependent content), blow the JS budget, and couple the indexable corpus to the app runtime — directly against `url-taxonomy.md` §7 (the marketing corpus must be cleanly separable and indexable). **Rejected.**

**Astro vs. a pure static-HTML generator (no React at all):**
- Tempting for purity, but it would force re-implementing interactive widgets and would not reuse `@oraclous/design-system`. Islands give us reuse where we need it and zero JS where we don't. **Astro-with-islands is the balance.**

### 1.4 React-island usage — the explicit list

Default everything to static `.astro`. Use a React island (`client:visible` or `client:idle`, never `client:load` unless above-the-fold-interactive) **only** for:

| Interactive piece | Island? | Hydration | Notes |
|---|---|---|---|
| Header mega-menu / primary nav | Island | `client:idle` | Reuse `navigation-menu` from design-system **or** author a token-styled Astro nav; prefer Astro + `<details>`/CSS for the desktop menu, island only if keyboard-menu semantics demand JS. |
| Mobile nav drawer (focus-trap, scroll-lock) | Island | `client:idle` | Reuse the console's `useDrawerA11y` pattern (`apps/console/src/components/shell/useDrawerA11y.ts`) — the focus-trap/scroll-lock/focus-restore work is already solved there; port the hook into `@oraclous/ui-utils` rather than copy-paste (flagged as a small refactor in §9). |
| Glossary index search / A–Z filter | Island | `client:visible` | Client-side filter over a build-time-embedded term list; no network. |
| FAQ accordions | **Prefer native** | — | Use semantic `<details>/<summary>` (AA, zero JS). Use the design-system `accordion` island only if the visual spec strictly requires it. |
| Cookie/consent banner (if analytics ships) | Island | `client:idle` | Marketing-origin-only; see §6 + §9 analytics decision. |

**Rule:** an island is a justified exception, not the default. Every `client:*` directive added in a PR is called out in the PR body (it has bundle + a11y cost).

---

## 2. Workspace shape

### 2.1 Placement in the monorepo

`apps/marketing` is a new app in the existing pnpm workspace (`pnpm-workspace.yaml` already globs `apps/*` — **no workspace config change needed**). It sits beside `apps/console` and consumes `packages/*` exactly as the console does.

```
oraclous-frontend/
├── apps/
│   ├── console/                # existing SPA (app.oraclous.com)
│   └── marketing/              # NEW — Astro SSG site (oraclous.com)
│       ├── astro.config.mjs    # integrations: @astrojs/react, @astrojs/sitemap, @astrojs/mdx (if needed)
│       ├── package.json        # name: @oraclous/marketing
│       ├── tsconfig.json       # extends ../../tsconfig.base.json (+ astro/tsconfigs/strict)
│       ├── src/
│       │   ├── content/
│       │   │   ├── config.ts            # collections + Zod schema (§3.2)
│       │   │   └── (loaders point at ../../../marketing/** — content stays external, §3.6)
│       │   ├── layouts/
│       │   │   └── BaseLayout.astro      # <html>, <BaseHead/>, header, footer, skip-link
│       │   ├── components/
│       │   │   ├── BaseHead.astro        # SEO/OG/Twitter/canonical (§4)
│       │   │   ├── SchemaJsonLd.astro    # JSON-LD emitter (§4)
│       │   │   ├── Prose.astro           # token-styled markdown wrapper
│       │   │   ├── islands/              # the React islands (§1.4)
│       │   │   └── nav/                  # header/footer (Astro)
│       │   ├── pages/                    # file-based routes (§3.3)
│       │   ├── lib/                      # schema builders, persona/query helpers (no network)
│       │   └── styles/                   # global.css (imports tokens.css + a small base sheet)
│       └── public/                       # static passthrough: favicon, og default, robots.txt, llms.txt
```

### 2.2 How it consumes `@oraclous/design-system`

- **Tokens (always):** `apps/marketing/src/styles/global.css` imports `@oraclous/design-system/tokens.css` (the package already exports it via `"./tokens.css"`). This is the **only** required design-system dependency for static pages, and it is exactly how the console wires tokens (`apps/console/src/main.tsx` imports `@oraclous/design-system/tokens.css`).
- **Components as islands (where interactive):** React components from `@oraclous/design-system` are imported inside `.tsx` island files and rendered with a `client:*` directive. **Caveat (the §1.4 / §0 decision):** those components emit Tailwind utility classes; to render them styled, the island bundle must include a Tailwind build with `tailwindPreset`. Two options, pick per island:
  - **(A) Token-first re-skin (preferred for most):** wrap the design-system primitive in a thin Astro/scoped-CSS component styled directly from `tokens.css` variables (the console's inline-style approach), avoiding Tailwind entirely. Cheapest bundle, no Tailwind in the marketing app.
  - **(B) Local Tailwind for islands:** if a complex primitive (e.g. `navigation-menu`, `command`) is worth reusing wholesale, add Tailwind **scoped to the island CSS only** with `presets: [tailwindPreset]` and `content` limited to the island files, so utility classes resolve. This is the documented escape hatch; use sparingly and justify in the PR (bundle impact).
- **Fonts:** reuse the console's self-hosted font approach — `@fontsource/sora` + `@fontsource/jetbrains-mono`, imported in `global.css` (no external CDN), matching `--font-sans`/`--font-mono` in the tokens. (No new font decision; mirrors `apps/console/src/main.tsx`.)

### 2.3 Dependency + build-order notes

- **Build order (same gotcha as the console):** `@oraclous/ui-utils` → `@oraclous/design-system` → `@oraclous/marketing`. The design-system must be built (`dist/`) before the marketing app builds, because the islands import its built output. `pnpm -r build` already topologically orders workspace builds via `workspace:*` deps, so `pnpm build` from root does the right thing; a dev run does `pnpm --filter @oraclous/design-system build` first (document in the app README like the console).
- **`package.json` deps:** `astro`, `@astrojs/react`, `@astrojs/sitemap`, optionally `@astrojs/mdx`; `react` + `react-dom` (peer of design-system, ^18); `@oraclous/design-system` `workspace:*`, `@oraclous/ui-utils` `workspace:*`, `@fontsource/sora`, `@fontsource/jetbrains-mono`. **No `@oraclous/api-client`** (the marketing site never calls the backend — keeping it out makes Gate 1 trivially true and documents intent).
- **Scripts:** `dev` → `astro dev`; `build` → `astro build`; `preview` → `astro preview`; `typecheck` → `astro check` (Astro's typechecker; the root `pnpm -r typecheck` picks it up). Output to `apps/marketing/dist/` (matches the Gate-4 `apps/*/dist/` glob).
- **Node/pnpm:** unchanged — `.nvmrc` 22.14.0, pnpm 11.5.0; Astro 4+ supports Node 18/20/22.

---

## 3. Content pipeline

### 3.1 Goal

Turn the existing `marketing/pages/**.md` (YAML front-matter + markdown body) into typed, validated, SEO-wired pages with **no content rewriting** — the markdown the team authored is the page body; the front-matter drives `<head>`, schema, breadcrumbs, and routing.

### 3.2 The typed content collection schema (Zod)

Define collections in `src/content/config.ts`. The schema mirrors the **actual** front-matter observed in `marketing/pages/home.md` and `marketing/pages/platform/byom.md`:

```
// PSEUDOCODE — illustrative shape, not the implementation (SPEC ONLY)
const pageSchema = z.object({
  title:            z.string(),                         // <title> + og:title
  meta_description: z.string().max(160),                // <meta name=description> + og:description
  url:              z.string().startsWith('/'),         // canonical path; validated unique
  page_type:        z.enum(['pillar','cluster','conversion','utility']),
  primary_persona:  z.string(),                         // free text in source (e.g. "All (...)" )
  primary_query:    z.string(),
  secondary_queries: z.array(z.string()).default([]),
  schema:           z.array(z.enum([                    // which JSON-LD blocks to emit (§4)
                      'Organization','SoftwareApplication','FAQPage','WebSite',
                      'BreadcrumbList','TechArticle','Article','HowTo',
                      'DefinedTerm','DefinedTermSet','ItemList','Offer','Product','Person','Blog',
                    ])).default(['BreadcrumbList']),
  primary_cta:      z.string().optional(),              // "Label → /path" or "Label → app.oraclous.com"
  secondary_cta:    z.string().optional(),
  // blog-only (added on the blog collection variant):
  // datePublished, dateModified, author, topic
});
```

Notes:
- **`schema[]` is the contract between content and the SEO layer.** The front-matter already declares it (`schema: [Organization, SoftwareApplication, FAQPage, WebSite, BreadcrumbList]` on home; `[BreadcrumbList, FAQPage, TechArticle]` on byom). `SchemaJsonLd.astro` reads this array and emits the matching JSON-LD (§4). The Zod `enum` is the allowlist — an unknown schema type fails the build (good: catches typos like `FAQ` vs `FAQPage`).
- **CTA parsing:** the source uses a `"Label → target"` convention (`Start with the architecture → /platform`, `Configure BYOM → app.oraclous.com`). A small `lib/cta.ts` parser splits label/target and classifies internal (`/…`) vs. cross-domain (`app.oraclous.com` → absolute `https://app.oraclous.com`). External app links are followed (not `nofollow`) per `url-taxonomy.md` §7.
- **Schema tolerance:** `primary_persona` is free-form in the source ("All (Operations lead + Platform builder front doors)"), so keep it `z.string()` and derive a normalized persona code in `lib/` if needed for analytics; do not force the content team into an enum mid-stream.

### 3.3 Routing — front-matter `url` is the source of truth

The content's `url` field is the canonical path; routing must honor it exactly (`/platform/byom`, no trailing slash — `url-taxonomy.md` §1.3). Two viable mappings:

- **Recommended:** a small set of **dynamic catch-all routes** that resolve collection entries by their `url` field:
  - `src/pages/[...slug].astro` for top-level + nested evergreen pages (reads the `pages` collection, matches `entry.data.url`).
  - `src/pages/glossary/index.astro` + `src/pages/glossary/[term].astro` for the glossary collection.
  - `src/pages/blog/index.astro` + `src/pages/blog/[slug].astro` for the blog collection.
  This keeps the **frozen URL set** (`url-taxonomy.md` §6) driven by content, not by file layout, so renaming a directory can't silently break a canonical URL.
- Enforce `url` ↔ rendered-path agreement with a **build-time assertion** (a route that throws if `entry.data.url` doesn't match the generated path) and the link-checker (§7). Trailing-slash policy: Astro `trailingSlash: 'never'` + host-level 301 (§6).

### 3.4 Markdown body → page

- Astro renders the collection entry's markdown body to HTML at build time. The rendered body goes inside a token-styled `Prose.astro` wrapper (typography from `tokens.css` type scale: `--t-h1-*`, `--t-body-*`, etc.) — **no Tailwind `prose` plugin**; a small scoped stylesheet maps `h1..h4, p, ul, a, blockquote` to the design-system type/spacing/color tokens.
- **In-content links** (`[Operator](/glossary/operator)`) render as normal `<a>`; the link-checker (§7) validates every internal target resolves to a real route. The "> Citable answer" blockquotes and `**Q:**/A:` FAQ blocks render as-authored; the FAQ parser (§4) also reads them to build `FAQPage` JSON-LD.
- **Build-note blockquotes** (`> *Hero visual (build note): …*`) are authoring instructions, **not** shipped copy. The pipeline must **strip `(build note)` / `Notes for build:` / `Internal links:` trailer blocks** before render (a remark plugin or a front-matter `body` preprocessor). This is a required transform — flagged in the content PR — so internal notes never reach production HTML.

### 3.5 Glossary + FAQ feeding pages

- **Glossary:** the canonical definitions live in `marketing/brand/glossary.md` (one 40–60-word definition-first block per term, already schema-ready per its own header). The 17 term pages + index are specced in `marketing/ia/page-structures/glossary.md`. **Recommendation (see §9 open decision):** author each term as a `glossary` content-collection entry (`marketing/pages/glossary/{term}.md`) with front-matter (`title`, `meta_description`, `url: /glossary/{term}`, `schema: [DefinedTerm, FAQPage, BreadcrumbList]`, `seeAlso`, `productPage`, `establishedEntity`, `sameAs`) and the definition as the body — sourced from `brand/glossary.md` so there's one canonical wording. The glossary **index** emits `DefinedTermSet` + `ItemList` over all entries.
- **FAQ:** every page carries an FAQ section in its body (the `**Q:** / A:` blocks). `SchemaJsonLd.astro` (or a shared `lib/faq.ts`) parses those Q/A pairs into `FAQPage` JSON-LD when `FAQPage` is in the page's `schema[]`. Single source (the body), two outputs (visible FAQ + JSON-LD) — no duplication.

### 3.6 Where content files live — keep `marketing/` as source of truth

**Decision: content stays in `oraclous-frontend/marketing/` (the existing tree); the app reads it in place.** Rationale:
- The marketing team already owns and edits `marketing/**` independently of app code; moving it into `apps/marketing/src/content/` would couple content edits to the app's review surface and break the team's workflow.
- Astro Content Collections support a **`glob()` loader** that can point outside `src/` (e.g. `loader: glob({ pattern: '**/*.md', base: '../../marketing/pages' })`). This keeps `marketing/` canonical while still getting the typed schema + validation.
- The IA/strategy/research docs under `marketing/` are **not** content collections — they're internal. Only `marketing/pages/**` (and the derived `marketing/pages/glossary/**`, `marketing/pages/blog/**` once authored) are loaded.

**Risk to manage:** a loader reaching outside the app dir must be on the watch list for `astro dev` (HMR) and included in the app's `tsconfig`/lint scope decisions (§7). If the out-of-app loader proves fragile, the fallback is a **build-time copy/symlink** of `marketing/pages/**` into `apps/marketing/src/content/` (a prebuild script), keeping `marketing/` authoritative. Decide in the content-collections PR (§8) and record it.

---

## 4. Head / SEO / schema injection

### 4.1 `<BaseHead>` — one component, front-matter-driven

A single `src/components/BaseHead.astro`, used by `BaseLayout.astro`, takes the page's front-matter (+ a few site constants) and emits:

- `<title>` = `title`; `<meta name="description">` = `meta_description`.
- `<link rel="canonical" href="https://oraclous.com{url}">` — self-canonical, no trailing slash, no query (`url-taxonomy.md` §5).
- **Open Graph:** `og:title`, `og:description`, `og:url`, `og:type` (`website`/`article`), `og:image` (per-page if provided, else the default OG image, §5), `og:site_name=Oraclous`, `og:locale=en`.
- **Twitter:** `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`.
- `<meta name="robots" content="index,follow">` for all marketing pages; `noindex` only for the rare thin/legal page that opts in via front-matter (`url-taxonomy.md` §5). (The console origin is `noindex` separately — §6.)
- `<meta name="viewport">`, charset, theme-color from `--ink`/`--paper`, preconnect/font preload as needed.

Centralizing this means **every page is SEO-correct by construction** — there is no per-page `<head>` hand-assembly, so a page can't ship without a canonical/OG.

### 4.2 `SchemaJsonLd.astro` — JSON-LD per page type

Reads the page's `schema[]` array and emits one `<script type="application/ld+json">` per declared type, built from front-matter + page body + site constants. Mapping:

| `schema[]` value | Source of the data | Notes |
|---|---|---|
| `BreadcrumbList` | derived from `url` segments + a path→label map | **on every page** (sitemap §5 mandate); Home › Platform › BYOM etc. |
| `Organization` | site constant (name, logo, `sameAs`: GitHub/LinkedIn/Crunchbase/Wikidata per keyword map §4) | Home (and footer-global if desired). |
| `WebSite` | site constant + `SearchAction` | Home (home.md build note explicitly calls for `SearchAction`). |
| `SoftwareApplication` | site constant (category, OS, offers→free self-host) | Home, Platform. |
| `FAQPage` | parsed `**Q:**/A:` blocks in the body (§3.5) | any page with an FAQ section. |
| `TechArticle` / `Article` | front-matter (`title`, `meta_description`, `datePublished`/`dateModified` for blog), author | platform clusters use `TechArticle`; blog uses `Article` + `Person`. |
| `HowTo` | step list parsed from the how-it-works body | `/how-it-works`. |
| `DefinedTerm` / `DefinedTermSet` | glossary collection (§3.5); established terms add `sameAs` (Wikipedia/Wikidata) | term pages / glossary index. |
| `ItemList` | collection listing (glossary index, blog index) | hub pages. |
| `Offer` / `Product` | pricing front-matter | `/pricing`. |

Implementation note (Gate 5): JSON-LD is injected by serializing a build-time-constructed object and writing it into the `<script type="application/ld+json">` via Astro's `set:html` (the data is **never** user-supplied — it comes from the team's own front-matter/body and site constants). This is the documented, controlled exception, analogous to the existing `chart.tsx` allowance in `.github/workflows/ci.yml` Gate 5. The schema-emitter file is added to the Gate-5 allowlist (§7). **No `dangerouslySetInnerHTML` anywhere** (that's a React API; Astro uses `set:html` and `.astro` files aren't in Gate 5's `.ts/.tsx` grep scope — but we whitelist deliberately rather than rely on the scope gap).

### 4.3 Schema source-of-truth note

The JSON-LD **shapes** (which properties for each type) should be recorded once — under the GEO deliverable in `marketing/seo/schema/` (to be created, §0.1/§9) or in `marketing/ia/` — and the emitter built from that, so the schema spec lives with the content team, not buried in app code. This mirrors the repo's "record once, link many" discipline.

---

## 5. Static asset emission

| Asset | How it's produced | Owner |
|---|---|---|
| **`sitemap.xml`** | `@astrojs/sitemap` integration — auto-generates from built routes; configure to **only** include indexable marketing URLs with `lastmod` (`url-taxonomy.md` §5). Exclude any `noindex` pages via the integration filter. | build (config) |
| **`robots.txt`** | static file in `apps/marketing/public/robots.txt` — `Allow:` the AI crawlers per the GEO crawler policy (GBot, GPTBot, ClaudeBot/anthropic-ai, PerplexityBot, etc.), `Sitemap: https://oraclous.com/sitemap.xml`. **Marketing origin only**; `app.oraclous.com` owns its own `robots.txt` with full `Disallow` (§6, `url-taxonomy.md` §7). | GEO PR |
| **`llms.txt`** | the GEO root file mapping the site for answer engines (sections → key URLs + one-line descriptions). Produced from the sitemap + page `title`/`meta_description`/`primary_query`. **Recommendation: generate it at build** from the content collection (a small build script writes `public/llms.txt` from front-matter) so it never drifts from the live page set. | GEO PR (generator), build |
| **`llms-full.txt`** | the long-form variant inlining each page's citable-answer block / definition for direct ingestion. Generate at build from the bodies (extract the `> **Citable answer …` blocks + glossary definitions). | GEO PR (generator), build |
| **Favicon** | `apps/marketing/public/` — reuse the existing brand symbol (`apps/console/public/oraclous-symbol.png`) at the standard sizes (`favicon.ico`, `apple-touch-icon.png`, `icon.svg`). Single brand source. | scaffold PR |
| **Default OG image** | a 1200×630 brand OG image in `public/og/default.png`. **Per-page OG images:** start with the shared default; optionally add build-time generation later (Satori/`astro-og-canvas`) keyed on `title` — **deferred decision, §9** (adds a build dep + bundle/CI time; not needed for v1). | scaffold (default), §9 (per-page) |

**`llms.txt`/`llms-full.txt` placement:** emitted to the **site root** (`/llms.txt`, `/llms-full.txt`) — Astro serves `public/` (static) or the build script writes into `dist/` post-build. Prefer the **build-script-into-dist** approach for the generated variants so they're always in sync with the rendered corpus.

---

## 6. Hosting & domains

### 6.1 The two origins (hard boundary — `url-taxonomy.md` §7)

| Origin | App | Indexable? | Auth? |
|---|---|---|---|
| `oraclous.com` (apex; `www` 301→apex) | `apps/marketing` (this spec) | **Yes** — SEO/GEO target | No |
| `app.oraclous.com` | `apps/console` (existing) | **No** — `robots.txt` Disallow + `noindex` | Yes |

- **Cross-domain CTAs are one-way and explicit:** marketing "use the product" CTAs (`Start free`, `Open console`, `Configure BYOM`) are absolute links to `https://app.oraclous.com[/path]`, **followed** (not `nofollow`), tracked as conversion events. The console never contributes to the marketing topical graph (logo→`oraclous.com` + footer only). The CTA parser (§3.2) classifies `app.oraclous.com` targets and renders them as absolute external links.
- **Cookie/consent boundary:** marketing analytics/consent set cookies scoped to `oraclous.com` only; never readable by `app.*`. Auth tokens are an `app.*` concern exclusively — the marketing site **handles no tokens** (so frontend invariants §1.5 / Gate 2 are satisfied by the site simply never touching auth).

### 6.2 Host / CDN options (static artifact)

The deploy artifact is a **directory of static files** (`apps/marketing/dist/` — HTML, CSS, hashed JS for islands, images, `sitemap.xml`, `robots.txt`, `llms*.txt`). Any static host works; recommended options in priority order:

1. **Cloudflare Pages** — fast global CDN, free tier, edge redirects (clean way to enforce trailing-slash 301 + `www`→apex), good for static. **Recommended default.**
2. **Netlify** — `_redirects`/`netlify.toml` for the 301 rules + headers (CSP, `X-Content-Type-Options`), preview deploys per PR (useful for the review workflow). Strong second.
3. **AWS S3 + CloudFront** — fits if the org standardizes on AWS; redirects/headers via CloudFront Functions; more setup.
4. **GitHub Pages** — simplest, but weaker on redirect rules/headers; acceptable for an MVP, not the long-term home.

**Host-level requirements (whichever host):** enforce `trailingSlash: never` 301s, `www`→apex 301, HTTPS-only (HSTS), and security headers (CSP allowing self + fonts + the analytics endpoint only; `X-Content-Type-Options: nosniff`; `Referrer-Policy`). These live in host config (`_redirects`/`_headers`/CloudFront), **not** app code. **Final host = open decision (§9).**

### 6.3 Deploy

- **CI builds** `apps/marketing/dist/` on merge to `main` (a `release`/`deploy` workflow, or the host's native git integration pointed at `apps/marketing` with build command `pnpm -w ... build --filter @oraclous/marketing` after building deps). Preview deploys per PR (Netlify/CF Pages) are valuable for the non-author reviewer to eyeball pages.

---

## 7. CI/CD parity

The new app must clear the **same gate floor** as the console (`CLAUDE.md` §4). Key consideration: **the existing gates grep `.ts`/`.tsx`; Astro components are `.astro`.** Gate scopes and lint config must be extended so `.astro` is actually covered (otherwise the gates pass vacuously on Astro files — a real hole).

| Gate / job | Today | Change needed for `apps/marketing` |
|---|---|---|
| **Quality — lint** | ESLint flat config matches `**/*.{ts,tsx}` only | Add `eslint-plugin-astro` + `astro-eslint-parser` and an override block for `**/*.astro` so `.astro` files are linted (a11y + TS). Otherwise Astro markup is unlinted. |
| **Quality — typecheck** | `pnpm -r typecheck` runs each package's `typecheck` | `apps/marketing` `typecheck` = `astro check` (typechecks `.astro` + `.ts`). Picked up by `pnpm -r typecheck` automatically. |
| **Quality — format:check** | Prettier over the repo | Add `prettier-plugin-astro` so `.astro` is formatted; ensure `.prettierignore` doesn't skip the app. |
| **Gate 1 — api-client-boundary** | greps `apps/`,`packages/` `.ts/.tsx` for `fetch`/`axios` | Marketing makes **no** backend calls → satisfied by construction. Extend the grep `--include="*.astro"` so it's *enforced* (catch a stray fetch in an `.astro` file), and keep `@oraclous/api-client` out of the app deps. |
| **Gate 2 — no-token-in-storage** | greps for `localStorage`/`sessionStorage` | Marketing handles no tokens. Extend grep to `*.astro`. Analytics (if added) must not store tokens — N/A, but the grep guards it. |
| **Gate 3 — axe-core AA** | Playwright specs in `tests/a11y/`, `--pass-with-no-tests` | **Add a11y specs for marketing pages.** Two patterns: (a) run axe against built static HTML served by `astro preview`/a static server (preferred — fast, no app server); or (b) reuse the Playwright harness pointing at the preview URL. Add `tests/a11y/marketing/*.spec.ts` covering a representative page per type (home, a platform cluster, glossary index, glossary term, blog index, pricing). This becomes a hard gate as pages ship. |
| **Gate 4 — bundle-budget** | gzips `apps/*/dist/**/*.js`, cap 500 KB | Already globs `apps/*/dist/` → marketing islands' JS is checked automatically. Astro's zero-JS-default keeps this trivially green; per-island JS stays far under cap. **No change** (the gate already covers the new app). |
| **Gate 5 — no-dangerouslySetInnerHTML** | greps `.ts/.tsx`, allowlists `chart.tsx` | Marketing uses Astro `set:html` for JSON-LD only (build-time data). Add `SchemaJsonLd.astro` to a documented allowlist and **extend the grep to `*.astro` to catch any other `set:html`** so the controlled exception is the *only* one. |
| **Build** | `pnpm -r build` | Includes `astro build` for the new app; build deps first (already ordered by `workspace:*`). |

**New CI jobs to add:**
1. **Lighthouse / Core Web Vitals check** — run Lighthouse CI (or `@lhci/cli`) against `astro preview` for a few key pages; assert performance/accessibility/SEO/best-practices budgets (e.g. perf ≥ 95, a11y = 100, LCP/CLS budgets). This is the GEO-critical gate and is **new** (the console doesn't need it; the marketing site does). Gate it on PRs touching `apps/marketing`.
2. **Link-checker** — crawl the built `dist/` (e.g. `linkinator`/`lychee` over `astro preview`) to assert (a) every internal `[..](/path)` link resolves to a real route, (b) `url` front-matter matches the rendered path, (c) no broken anchors. Critical because the corpus is link-dense (internal-linking strategy). **New job.**
3. **(Optional) HTML/schema validation** — validate emitted JSON-LD against schema.org shapes and run an HTML validator; nice-to-have for the GEO PR, can start as non-blocking.

**Workflow wiring:** add the marketing-specific jobs (Lighthouse, link-check, marketing a11y) to `ci.yml` (or a new `marketing.yml` triggered on `apps/marketing/**` + `marketing/**` paths). Keep them in the `main` ruleset's required checks once stable, so the non-author-review + green-CI merge rule (`CLAUDE.md` §0/§3.4) applies to marketing PRs too. **Do not weaken any existing gate.**

---

## 8. Phased build plan (GitHub Issues + PRs)

Each phase = one (occasionally two) reviewable PR(s), branched off `main`, Conventional-Commit titled, **non-author reviewed, maintainer-merged, no self-merge** (`CLAUDE.md` §3). Target < ~300 net lines of *logic* per PR (markup/content excluded). No attribution trailers anywhere (§3.2). Each issue states its Lift/Reshape/Greenfield call — this app is **Greenfield app shell consuming existing content** (the content itself is the spec), with the design-system/console patterns as the behavioral reference.

| # | Issue / PR | Conventional title | Scope (what lands) | Dependencies | Reviewable size |
|---|---|---|---|---|---|
| 1 | **Scaffold** | `feat(marketing-app): scaffold Astro app in apps/marketing` | `apps/marketing` skeleton: `package.json` (`@oraclous/marketing`), `astro.config.mjs` (+ `@astrojs/react`), `tsconfig.json`, `global.css` importing `tokens.css` + fonts, `BaseLayout.astro`, one placeholder home page, favicon. Builds + previews locally. **No content wiring yet.** | design-system builds | small |
| 2 | **Content collections** | `feat(marketing-app): typed content collections from marketing/pages` | `src/content/config.ts` (Zod schema §3.2), `glob` loader pointed at `../../marketing/pages` (or prebuild-copy fallback, §3.6), `[...slug].astro` route honoring `url`, `Prose.astro` token-styled body, build-note/internal-links **stripping** transform (§3.4). Renders all existing `pages/**.md` as routes. | #1 | medium |
| 3 | **SEO head** | `feat(marketing-app): BaseHead — title/meta/canonical/OG/Twitter` | `BaseHead.astro` driven by front-matter (§4.1); robots index/noindex; CTA parser (`lib/cta.ts`, internal vs `app.oraclous.com`). | #2 | small |
| 4 | **Schema / JSON-LD** | `feat(marketing-app): JSON-LD emitter from schema[] front-matter` | `SchemaJsonLd.astro` (§4.2) emitting BreadcrumbList (all), Organization/WebSite/SoftwareApplication/FAQPage/TechArticle/HowTo per `schema[]`; FAQ parser (`lib/faq.ts`); Gate-5 allowlist entry. | #3 | medium |
| 5 | **Nav + layout shell** | `feat(marketing-app): header mega-menu, footer, mobile drawer island` | Header (pillars per sitemap §4), footer (Blog/Glossary/About + GitHub), mobile drawer island reusing the `useDrawerA11y` pattern (port to `ui-utils`), skip-link, breadcrumb component. AA. | #2 | medium |
| 6 | **Glossary** | `feat(marketing-app): glossary index + term pages` | `glossary` collection (term entries derived from `brand/glossary.md`, §3.5), index (`DefinedTermSet`+`ItemList`+search island), `[term].astro` (`DefinedTerm`+`sameAs` for established terms). *(Content authoring of the 17 entries may be a paired content PR.)* | #4 | medium |
| 7 | **Blog scaffold** | `feat(marketing-app): blog index + article template (empty corpus)` | `blog` collection + schema (date/author/topic), `/blog` index (`Blog`+`ItemList`), `/blog/[slug]` (`Article`+`Person`+`FAQPage`), pagination `rel=next/prev`. Ships valid with zero posts. | #4 | medium |
| 8 | **GEO assets** | `feat(marketing-app): sitemap, robots, llms.txt + llms-full.txt` | `@astrojs/sitemap` config (indexable-only + `lastmod`), `robots.txt` (AI-crawler allowlist + sitemap), build-time `llms.txt`/`llms-full.txt` generators from front-matter/citable blocks (§5), default OG image. *(Depends on GEO crawler-policy + schema source files being created — §0.1; pair with a `marketing/seo/**` content PR.)* | #4 | medium |
| 9 | **CI parity** | `ci(marketing-app): gates, Lighthouse, link-checker for marketing` | Extend Gate 1/2/5 greps to `*.astro`; add `eslint-plugin-astro` + `prettier-plugin-astro`; `astro check` typecheck; **new** Lighthouse/CWV job + **new** link-checker job; marketing a11y specs (`tests/a11y/marketing/*`). Add required checks to the `main` ruleset. | #1–#8 (jobs can land incrementally; lint/typecheck/format right after #1) | medium |
| 10 | **Deploy** | `ci(marketing-app): static deploy of oraclous.com` (or `[impl-infra]`) | Host wiring (chosen host §6.2), build command, env, redirect/header rules (`www`→apex, trailing-slash 301, CSP), per-PR preview deploys, DNS for `oraclous.com`. | host decision (§9) | medium |
| 11 | **Docs** | `docs(marketing-app): app README + update repo CLAUDE.md §5/§6` | `apps/marketing/README.md` (build-order gotcha, dev steps), and update `oraclous-frontend/CLAUDE.md` §5 layout (add `apps/marketing`) + §6 stack (add Astro) so the contract reflects reality. | #1 | small |

**Sequencing note:** #9's cheap quality jobs (lint/typecheck/format for `.astro`) should land **immediately after #1** so every subsequent PR is gated; the heavier Lighthouse/link-check jobs follow once there are real pages (#2+). Content-authoring (glossary entries #6, GEO source files #8, blog posts) are **paired content PRs** owned by the marketing/GEO specialists, kept separate from the app-code PRs for clean review.

---

## 9. Risks & open decisions

| # | Risk / decision | Recommendation | Owner / when |
|---|---|---|---|
| R1 | **Design-system components are Tailwind-coupled** (CVA → `bg-primary` etc.) and only render styled under a Tailwind build with `tailwindPreset`. Reusing them wholesale in islands drags Tailwind into the marketing bundle. | **Default to token-first Astro components (§2.2 option A); use local island-scoped Tailwind (option B) only for genuinely complex primitives, justified per PR.** Reassess whether the design-system should ship a token-CSS (non-Tailwind) build for SSG consumers. | Build Architect; scaffold + per-island |
| R2 | **`marketing/seo/` & `marketing/geo/` don't exist** (robots policy, JSON-LD shapes, llms.txt source, AI-crawler allowlist). | Create them as a GEO deliverable **before/with PR #8**; this spec consumes them. Block #8 on them. | GEO/SEO specialist; before #8 |
| R3 | **Glossary term pages & blog posts not authored** as content. | Author the 17 glossary entries (from `brand/glossary.md`) + initial posts as content-collection `.md` files (paired content PRs). App ships glossary/blog scaffolding (#6/#7) ahead of full content. | Content team; with #6/#7 |
| R4 | **Out-of-app content loader** (`glob` base `../../marketing`) may be fragile for HMR / tsconfig / lint scope. | Try the in-place loader first; **fallback = prebuild copy/symlink** of `marketing/pages/**` into the app, keeping `marketing/` canonical. Decide in #2 and record. | Build Architect; PR #2 |
| R5 | **Final host** (Cloudflare Pages / Netlify / S3+CF / GH Pages). | Default **Cloudflare Pages** for static + edge redirects; final call is a maintainer/devops decision tied to existing infra. Redirect/header/CSP rules live in host config, not app code. | Maintainer + devops; PR #10 |
| R6 | **Per-page OG image generation** (Satori/`astro-og-canvas`) adds a build dep + CI time. | **Defer.** Ship a single brand default OG image for v1; add per-page generation later if needed, gated for bundle/CI cost. | Build Architect; post-v1 |
| R7 | **Design-system SSR-safety.** Astro renders islands' initial HTML server-side at build; a component touching `window`/`document` at module/render top-level breaks the build. | Audit each reused component before islanding it; render browser-only widgets `client:only="react"` if they can't SSR, or token-reskin them. Catch via the build (it fails loudly) + the audit in each island PR. | Build Architect; per-island |
| R8 | **Cross-domain analytics story.** Marketing conversions (CTA→`app.*`) span two origins with separate cookie scopes (§6.1). | Use a privacy-respecting, cookieless-by-default analytics (e.g. server-side or first-party, marketing-origin-scoped); track CTA clicks as outbound conversion events; **never** share cookies into `app.*`; honor consent. Pick the tool as its own small decision; keep it out of the auth-token path (Gate 2). | Marketing + devops; with #10 |
| R9 | **CI gates have an `.astro` blind spot** (greps target `.ts/.tsx`). | Extend Gate 1/2/5 greps to `*.astro` and add Astro lint/format (PR #9) so the gates actually cover Astro markup — don't rely on the scope gap to pass. | Build Architect; PR #9 |
| R10 | **`CLAUDE.md` §5/§6 don't mention Astro or `apps/marketing`.** | Update both in the docs PR (#11) so the repo contract matches reality (Astro added to the stack §6; `apps/marketing` to the layout §5; note the marketing site makes no gateway calls). | docs; PR #11 |

---

## 10. What this app deliberately is NOT

- **Not** a second console SPA — it is static HTML with islands.
- **Not** a backend consumer — zero `fetch`/`axios`, no `@oraclous/api-client`, no gateway calls (Gates 1 & 2 hold by construction).
- **Not** a place for auth/tokens — those are `app.oraclous.com`-only.
- **Not** a fork of the content — `marketing/**` stays the source of truth.
- **Not** a Tailwind-first app — it is token-first (`tokens.css`), Tailwind only inside the rare island that reuses a complex design-system primitive.
- **Not** allowed to weaken any existing CI gate — it extends the floor to `.astro` and adds CWV + link-check on top.
