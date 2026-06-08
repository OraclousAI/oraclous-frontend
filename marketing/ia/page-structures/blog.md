# Page Structures — Blog index (`/blog`) + article template

> Blueprint — structure + intent + target queries, **not** finished copy. Covers the Blog pillar index and the shared article template. The blog captures informational + comparison intent (keyword-map Pillars A/B/D/F/G "best X 2026" and "X alternative" formats) and feeds topical authority up to the pillars. URL pattern: `/blog/{post-slug}` (flat, no date — see `url-taxonomy.md` §4).

---

# PART 1 — Blog index (`/blog`)

Type: **Pillar**. Persona: **All**. Primary target query: *best AI agent orchestration platforms 2026* (the listicle format that dominates SERPs) + the informational head terms. The one job: **publish category-authority content and route to articles + the pillars they support.**

## Wireframe
- **H1:** "The Oraclous blog" — governed, sovereign, open agentic operations.
- **Hero/intro:** one line on the editorial remit (the "State of Governed/Sovereign Agents" angle, keyword-map §5). 
- **Citable answer block — H2:** "What does the Oraclous blog cover?" → liftable: a one-paragraph topic map (agentic AI orchestration, ReBAC governance, data sovereignty, BYOM, MCP, open-source self-hosting, framework-vs-platform comparisons) linking the relevant pillars/glossary.
- **§ Featured / latest** → card list of articles (title, summary, topic tag, date). Crawlable `<a>` links; paginated with `rel=next/prev` (taxonomy §5).
- **§ Topic clusters — H2:** "Browse by topic" → groups mapping to the pillars (Orchestration · Governance & ReBAC · Sovereignty & security · BYOM & models · MCP & interop · Open source · Comparisons). Each links to its pillar + filtered article list.
- **FAQ — H2:** What are the best AI agent orchestration platforms in 2026? · What is the best open-source LangChain alternative? · ReBAC vs RBAC for AI agents? (each also a flagship article).
- **CTA band:** Subscribe / See the platform.

## JSON-LD: `Blog` + `ItemList` (recent posts) + `FAQPage` + `BreadcrumbList`.
## CTAs: Primary — Subscribe. Secondary — See the platform.
## Key links out: featured `/blog/{slug}` · `/platform` · `/why-oraclous` · `/glossary` · `/security`.

---

# PART 2 — Article template (all `/blog/{post-slug}`)

Type: **Cluster**. Intent: I (some C for comparison/listicle posts). Every article follows this skeleton. Articles never dead-end — they link up to the pillar/cluster they support and into Glossary terms (`internal-linking.md` §6.8).

## Shared wireframe

### H1
The article title (query-led, exact terminology).

### Byline + meta
- Author (a real named **Person** — feeds `Person` schema and E-E-A-T), publish date, modified date, est. reading time, topic tag.

### Lead = citable answer block (AEO hook — first, before the long read)
- **The opening 2–3 sentences directly answer the article's core question** (the "lead with a direct answer, then detail" rule, keyword-map §5). For listicles ("best X 2026"), the lead states the shortlist/verdict up top; for "vs" posts, the lead states the bottom-line comparison.
- Links the key entities to their Glossary terms on first use.

### Section 2…N — Body
- **H2/H3 phrased as the real questions** the reader/engine asks (AEO), each with a concise answer then detail.
- For **comparison/alternative posts** (Pillar G): a comparison table (Oraclous + alternatives across governance/sovereignty/portability/model-choice), each row exact-termed (ReBAC not RBAC; Agent not bot). Honest framing — no invented metrics, no straw-manning.
- For **definitional/how-to posts**: structured steps or a definition-first structure; cross-link the relevant Platform capability.

### Section — Where Oraclous fits
- A short, honest "how Oraclous relates to this topic" block linking the relevant pillar/capability/Solution. Not a hard sell — earns the link.

### FAQ (AEO hook)
- **H2:** "Frequently asked questions" — 3–5 question-shaped queries related to the article's topic (drawn from keyword-map §2).

### Author bio + related posts + CTA
- Author bio (`Person`), 2–3 related articles, and a soft CTA to the relevant pillar (`/platform`, `/security`, `/why-oraclous`, or `/glossary`).

## JSON-LD (every article)
`Article` (or `BlogPosting`) with `datePublished`/`dateModified`/`headline`/`author` + `Person` (the author, with credentials for E-E-A-T) + `FAQPage` + `BreadcrumbList`. Comparison posts may add `ItemList` for the ranked set.

## CTAs
- **Primary:** contextual to topic (Review the trust model / See the platform / Configure BYOM / Browse the glossary).
- **Secondary:** Subscribe.

## Key internal links out (every article)
Up to its **supporting pillar/cluster** + into **Glossary terms** (first-use) + 2–3 **related articles**. Comparison posts link to the matching `/why-oraclous/*` page; definitional posts link to the matching `/glossary/*` and `/platform/*` page.

## Seed article ideas (map to clusters — for the content plan, not exhaustive)
| Working title | Target query | Supports pillar | Type |
|---|---|---|---|
| Best open-source AI agent platforms (2026) | best open source AI agents 2026 | open-source | listicle |
| Best AI agent orchestration platforms (2026) | best AI agent orchestration platforms 2026 | platform | listicle |
| ReBAC vs RBAC for AI agents | ReBAC vs RBAC | glossary/rebac, security | comparison/explainer |
| The best open-source LangChain alternative | open source LangChain alternative | why-oraclous/framework-wiring-overhead | comparison |
| Framework vs platform: do you need governance built in? | AI agent framework vs platform | why-oraclous | explainer |
| How to control what an AI agent can access | how to control what an AI agent can access | security | how-to |
| What is data sovereignty for AI? | data sovereignty AI | security, glossary/data-sovereignty | explainer |
| BYOM: run Claude, GPT, Gemini, or a local model | BYOM AI agent platform | platform/byom | explainer |
| Build vs buy AI agents | build vs buy AI agents | why-oraclous/bespoke-code-is-brittle | decision guide |
| State of Governed/Sovereign Agents (annual) | governed AI agents / sovereign AI | blog (category-stat authority) | data report |

> Terminology + honesty guard applies to all articles: exact terms always (ReBAC, OHM, BYOM, Agent, Operator), no fabricated customers/metrics/benchmarks (positioning §7), comparison posts stay fair.
