# Oraclous Marketing Site — Internal Linking & Topical Authority

> The pillar→cluster linking graph, global nav (header + footer), breadcrumb model, contextual cross-link rules, and the Glossary-as-hub model. This is the spine of both **SEO topical authority** (hub-and-spoke link equity) and **AEO entity association** (consistent entity co-occurrence so answer engines resolve Oraclous's vocabulary). Companion to `sitemap.md` and `url-taxonomy.md`.
>
> Persona keys: A=Operations · B=Platform builder · C=Security/compliance · D=Multi-model · E=Federation · F=OSS evaluator.

---

## 1. The principle (why linking is load-bearing here)

Two outcomes drive every rule below:

1. **Topical authority (SEO).** Each pillar is a hub; its clusters link up to it and to each other; the pillar links down to all clusters. Concentrated, reciprocal linking tells crawlers the pillar is the authority for its topic and passes equity to the deep pages.
2. **Entity association (AEO).** Answer engines build an entity graph. Every time `/security` co-occurs with "ReBAC", "data sovereignty", and `/glossary/rebac`, the engines strengthen the Oraclous↔ReBAC↔sovereignty association. The Glossary is the canonical definition source; **every page funnels its key terms into the Glossary**, and the Glossary funnels back out to the product pages that use the term. This consistent two-way wiring is what makes the proprietary vocabulary (Harness, OHM, Operator) resolvable as Oraclous entities.

**Rule of thumb:** a term that appears as a defined entity (anything in `glossary/*`) is linked **on first use per page** to its glossary entry; a problem named on a Why-Oraclous page always links to its matching Solution + Platform capability; a Platform capability always links to its Glossary definition and the Solution(s) that sell it.

---

## 2. Pillar → cluster graph (the topical map)

### 2.1 Platform pillar (`/platform`)
`/platform` ⇄ each capability child (down-links in the hub grid; up-links via breadcrumb + "Part of the Platform" link on each child).

```
/platform  ──┬─→ /platform/harness-model        ─┐
             ├─→ /platform/actors                 │
             ├─→ /platform/compile                │  (each child links
             ├─→ /platform/rebac-governance       │   back up to /platform
             ├─→ /platform/byom                    │   AND laterally to
             ├─→ /platform/knowledge-graph         │   2–3 related siblings)
             ├─→ /platform/human-in-the-loop       │
             ├─→ /platform/execution-scheduling    │
             ├─→ /platform/mcp-widgets             │
             ├─→ /platform/portability             │
             └─→ /platform/metering               ─┘
```

Lateral sibling links (the high-value ones):
- `harness-model` ⇄ `actors` ⇄ `compile` (the core "what is the unit of work" triangle).
- `rebac-governance` ⇄ `human-in-the-loop` ⇄ `metering` (the governance triangle).
- `byom` ⇄ `mcp-widgets` ⇄ `portability` (the openness/interop triangle).
- `knowledge-graph` ⇄ `actors` (the "second mind remembers" pair).

### 2.2 Solutions pillar (`/solutions`)
`/solutions` ⇄ each persona child. Each persona child links **out** to the Platform capabilities and Why-Oraclous problems most relevant to that persona (the "proof" links), and to Security/Open-source/Pricing as appropriate.

| Solution | → Platform capabilities | → Why-Oraclous | → Trust/convert |
|---|---|---|---|
| `/solutions/operations` (A) | compile, human-in-the-loop, harness-model, execution-scheduling | bespoke-code-is-brittle | pricing, how-it-works |
| `/solutions/developers` (B) | harness-model, mcp-widgets, byom, portability, knowledge-graph | framework-wiring-overhead | open-source, developers, pricing |
| `/solutions/regulated` (C/E) | rebac-governance, human-in-the-loop, portability, metering | data-sovereignty, agent-governance-audit | security, pricing |
| `/solutions/multi-model` (D) | byom, mcp-widgets | vendor-lock-in | developers, pricing |

### 2.3 Why-Oraclous pillar (`/why-oraclous`)
`/why-oraclous` ⇄ each problem child. **Every problem page links to its matching Solution + Platform capability + Glossary term(s)** (the mandated contextual cross-link, §5). It is the "three bad choices" narrative made navigable.

| Problem page | → Solution | → Platform capability | → Glossary terms |
|---|---|---|---|
| `bespoke-code-is-brittle` | operations | compile, harness-model | platform-as-code, actors-as-harnesses |
| `closed-saas-lock-in` | regulated | portability | portability, data-sovereignty |
| `framework-wiring-overhead` | developers | harness-model, rebac-governance | actors-as-harnesses, capability, platform-as-code |
| `data-sovereignty` | regulated | rebac-governance, portability | data-sovereignty, rebac |
| `vendor-lock-in` | multi-model | byom, portability | byom, ohm, portability |
| `agent-governance-audit` | regulated | rebac-governance, metering, human-in-the-loop | rebac, capability |

Each problem page also links laterally to the **other problem pages** ("the other two bad choices") so the trio reinforces the narrative.

### 2.4 Standalone pillars
- **Security** (`/security`) is the trust hub: links down/across to `rebac-governance`, `portability`, `byom`, `metering`, `human-in-the-loop`, `data-sovereignty` (problem), `regulated` (solution), and Glossary `rebac`/`data-sovereignty`. Receives links from every page that makes a control/sovereignty claim.
- **Open-source** (`/open-source`) links to GitHub (external), `developers`, `portability`, `platform-as-code` (glossary), `pricing` (free self-host), and the OSS-evaluator-relevant Why pages.
- **Developers** (`/developers`) links to `harness-model`, `byom`, `mcp-widgets`, `portability`, `open-source`, and Glossary `mcp`/`byom`/`ohm`. The technical front door.
- **How-it-works** (`/how-it-works`) is the narrative spine: links to `compile`, `harness-model`, `actors`, `human-in-the-loop`, `execution-scheduling` in lifecycle order, then to `/platform` and a Solution.
- **Pricing** (`/pricing`) links to `open-source` (free self-host), `security` (hosted guarantees), and the console (`app.oraclous.com`).
- **Blog** (`/blog`) articles link up to the relevant pillar/cluster they support and into Glossary terms; the index links to pillars.

### 2.5 The cluster→pillar→cluster mesh (text view)
```
                         ┌──────────────┐
        ┌────────────────│     HOME     │────────────────┐
        │                └──────┬───────┘                 │
        ▼                       ▼                          ▼
   ┌─────────┐           ┌─────────────┐            ┌──────────────┐
   │ PLATFORM│◀────────▶│  SOLUTIONS   │◀─────────▶ │ WHY-ORACLOUS │
   │ (11 cap)│           │ (4 persona)  │            │ (6 problem)  │
   └────┬────┘           └──────┬───────┘            └──────┬───────┘
        │  every capability ▲   │  every solution ▲  every problem
        │  links to its     │   │  links to caps + │  links to its
        ▼  glossary term    │   ▼  problems        ▼  solution+cap+glossary
   ┌────────────────────────┴───────────────────────────────────┐
   │                       GLOSSARY (hub)                          │
   │  every page's key terms link in; terms link back out to the  │
   │  product pages that use them                                  │
   └──────────────────────────────────────────────────────────────┘
        ▲                ▲              ▲             ▲
   SECURITY        OPEN-SOURCE     DEVELOPERS    HOW-IT-WORKS / BLOG
   (trust hub)     (OSS hub)       (dev hub)     (narrative / content)
```

---

## 3. Global navigation — header

**Primary header (desktop): logo + 7 items + console CTA.**

```
[Oraclous logo]   Platform ▾   Solutions ▾   Why Oraclous ▾   Security   Open Source   Developers   Pricing      [Sign in]  [Start free →]
```

- **Platform ▾** mega-menu — grouped capability links (3 columns matching the §2.1 triangles):
  - *The work:* Harness & OHM · Actors · Compile · How it works
  - *Governance:* ReBAC governance · Human-in-the-loop · Metering
  - *Open & portable:* BYOM · MCP & widgets · Portability · Knowledge graph · Execution & scheduling
- **Solutions ▾** menu — the 4 persona pages (Operations · Developers · Regulated & security · Multi-model teams) + "All solutions".
- **Why Oraclous ▾** menu — the 6 problem pages grouped as "The three bad choices" (bespoke-code, closed-saas, framework-wiring) and "What you actually need" (data-sovereignty, no vendor lock-in, governance & audit) + "Why Oraclous overview".
- **Security · Open Source · Developers · Pricing** — direct links (no submenu); these are the high-intent single pages.
- **CTAs:** `[Sign in]` and `[Start free →]` both link to `app.oraclous.com` (cross-domain, §url-taxonomy §7). "Start free" is the persistent primary CTA in the header on every page.
- **Mobile:** the same items collapse into the existing accessible nav drawer (focus-trap, scroll-lock, focus-restore per the repo's a11y invariants). Mega-menus become accordion sections.

**Utility/secondary (top-right or under a "Resources" item):** Blog · Glossary · About · GitHub (external). Glossary is also reachable from every in-content term link.

---

## 4. Global navigation — footer

Four columns + a meta row. The footer is the **completeness net** — every indexable page is reachable from the footer within two clicks.

```
PRODUCT              SOLUTIONS              WHY ORACLOUS                 RESOURCES
Platform             Operations             Bespoke code is brittle      How it works
  Harness & OHM      Developers             Closed SaaS lock-in          Blog
  Actors             Regulated & security   Framework wiring overhead    Glossary
  Compile            Multi-model teams      Data sovereignty             Developers
  ReBAC governance                          Vendor lock-in               GitHub ↗
  BYOM               COMPANY                Agent governance & audit     llms.txt ↗
  Knowledge graph    About
  Human-in-the-loop  Security               GET STARTED
  Execution & sched. Open source            Start free (self-host) →
  MCP & widgets      Pricing                Open the console ↗  (app.oraclous.com)
  Portability
  Metering

[Oraclous logo]   © Oraclous   ·   Terms   ·   Privacy   ·   Security.txt   ·   Status ↗
```

- The footer surfaces **all 11 capability pages and all 6 problem pages** (the header mega-menus do too, but the footer guarantees flat crawlability).
- External links (GitHub, console, llms.txt, Status) marked with ↗ and `rel` per §6.

---

## 5. Breadcrumb model

- **Every page below depth 1 shows a breadcrumb trail** rendered as a semantic `<nav aria-label="Breadcrumb">` with an ordered list, and emits `BreadcrumbList` JSON-LD (mandatory on every page per the brief).
- Trails mirror the URL hierarchy exactly:

  | Page | Breadcrumb |
  |---|---|
  | `/platform/byom` | Home › Platform › BYOM |
  | `/solutions/operations` | Home › Solutions › Operations |
  | `/why-oraclous/data-sovereignty` | Home › Why Oraclous › Data sovereignty |
  | `/glossary/rebac` | Home › Glossary › ReBAC |
  | `/blog/{slug}` | Home › Blog › {Article title} |
  | depth-1 pages (`/security`, `/pricing`, …) | Home › Security (single crumb; the page is its own top level) |

- The breadcrumb label uses the page's display title (exact terminology), not the slug.
- Breadcrumbs are **navigational links**, not just decoration — each crumb above the current page is clickable and contributes an up-link to the pillar (reinforcing §2).

---

## 6. Contextual cross-links (in-content)

These are the rules copywriters follow when writing body copy. They are **mandatory**, not optional flourishes.

1. **First-use term → Glossary.** The first time any glossary term (Harness, OHM, ReBAC, BYOM, Operator, Actor, Capability, Consciousness, Portability, MCP, second mind, agentic AI, multi-agent orchestration, data sovereignty, platform-as-code, actors-as-harnesses, Agent) appears in a page's body, link it to `/glossary/{term}`. Once per page (first use), to keep links meaningful.
2. **Why-Oraclous problem page → matching Solution + Platform capability + Glossary** (the brief's named requirement). Each problem page carries an explicit "How Oraclous solves this" block linking the mapped Solution and capability from §2.3, plus its glossary terms inline.
3. **Platform capability → its Glossary definition + the Solution(s) that sell it + sibling capabilities.** Each capability page links to `/glossary/{term}` for the definition (does not restate it canonically), to the persona Solution(s) per §2.2, and to its sibling triangle per §2.1.
4. **Solution page → the capabilities that prove it + the problem it removes + Security/Pricing.** Per §2.2.
5. **Every claim of control/sovereignty → `/security`.** Any page that says "your keys", "data-sovereign", "cross-org flow impossible", "ReBAC" links to `/security` (and `/glossary/rebac` / `/glossary/data-sovereignty`).
6. **Every "open source / self-host / read the code" mention → `/open-source`** (and GitHub external).
7. **Every "no lock-in / leave anytime / OHM export" mention → `/platform/portability`** and `/glossary/ohm`.
8. **Blog article → the pillar/cluster it supports** (up-link) and **into Glossary terms** (entity links). Articles never dead-end.
9. **External entity citations.** Where the page asserts an established entity (ReBAC, MCP, BYOM, data sovereignty), cite the authoritative external source (e.g. Wikipedia ReBAC/MCP) the **first time the entity is defined** on the Glossary term page — this is the entity-association hook from `keyword-entity-map.md` §3. External citations use `rel="noopener"` (and open same-tab or new-tab per design-system convention); do **not** `nofollow` authoritative entity sources. Outbound console links (`app.oraclous.com`) are followed conversion links, not `nofollow`.

**Anchor-text rule:** descriptive, exact-term anchors ("ReBAC governance", "the Compile flow", "OHM portability") — never "click here" / "learn more" as the sole anchor. Exact-term anchors are both an a11y win and an entity-association signal.

---

## 7. Glossary as the site-wide hub (the AEO engine)

The Glossary is the single most leveraged structure for AEO. Model:

- **One canonical definition per entity.** Each `/glossary/{term}` page holds the *only* canonical definition; product pages reference it rather than redefining (avoids competing definitions that confuse entity resolution).
- **Inbound:** every page links its key terms in (§6 rule 1). The Glossary therefore accrues internal links from across the whole site — it becomes the highest-authority hub for definitional queries.
- **Outbound (term → product):** each glossary entry ends with a "Where this lives in Oraclous" block linking to the Platform capability and/or Solution that uses the term, plus 2–3 related glossary terms ("See also"). So `/glossary/rebac` → `/platform/rebac-governance`, `/security`, and `See also: data-sovereignty, capability`.
- **Proprietary-to-established pairing.** Every proprietary term page explicitly pairs the new entity with an established one in its definition and links the established term's glossary page (and external source): e.g. `/glossary/ohm` defines OHM and links `/glossary/mcp` ("a portable manifest, the way MCP is a portable tool protocol"). This attaches the new entity to a known node in the engines' graph.
- **`DefinedTermSet` on the index, `DefinedTerm` on each entry** (schema, §sitemap §5).
- **Cross-term links inside the Glossary** form their own dense mesh (ReBAC↔RBAC-contrast↔data-sovereignty↔capability; Harness↔OHM↔Operator↔Actor↔Capability↔Portability; BYOM↔MCP↔portability) so the proprietary vocabulary is internally consistent and self-reinforcing.

---

## 8. Link-flow summary (where equity concentrates)

- **Receives the most internal links (deliberately):** `/glossary/*` (every page's first-use terms), `/security` (every control claim), `/platform` (every capability up-link + nav), `/platform/portability` (every no-lock-in mention).
- **Distributes the most:** Home (routes to all pillars), the three hub pillars (`/platform`, `/solutions`, `/why-oraclous`), and the footer (flat crawl to every page).
- **Must never dead-end:** blog articles, glossary terms (both always link back out per §6.8 / §7).
- **Reciprocity is enforced:** if A links to B as a primary relationship (problem→solution, capability→glossary), B links back to A.
