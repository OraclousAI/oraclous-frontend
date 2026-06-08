# Oraclous Marketing Site — Sitemap & Page Inventory

> Information-architecture blueprint for the Oraclous marketing site (`oraclous.com`). Grounded in `strategy/positioning.md`, `strategy/messaging-matrix.md`, `strategy/personas.md`, and `research/keyword-entity-map.md`. Audience strategy is **balanced / multi-persona**: Home leads with the "second mind" thesis; Solutions speak per persona. Terminology is exact throughout — **Harness, OHM, ReBAC (never RBAC), BYOM, Operator, Agent (never "bot"), Capability, Consciousness, Portability**.
>
> The console lives at `app.oraclous.com`; everything below is the marketing surface at `oraclous.com`. See `url-taxonomy.md` for the cross-domain boundary and `internal-linking.md` for the topical-authority graph.

---

## 1. Page-type model (SEO/AEO topical authority)

| Type | Role | Linking behaviour |
|---|---|---|
| **Pillar** | Broad authoritative hub for a topic cluster; targets a head/category term. | Links down to all its clusters; receives links up from every cluster (hub-and-spoke). |
| **Cluster** | Narrow, deep page answering one sub-topic/problem/comparison; targets a long-tail or mid-tail term. | Links up to its pillar + laterally to sibling clusters + into Glossary terms. |
| **Conversion** | Decision/transaction surface (Pricing, persona Solutions). | Links to proof (Security, Open-source, Platform) and to the console CTA. |
| **Utility** | Navigation/trust/legal scaffolding (About, legal, etc.). | Footer-reachable; minimal cluster role. |

A page can be **both** (e.g. Platform is a pillar *and* a conversion surface; Glossary is a pillar *and* a site-wide hub).

---

## 2. Sitemap tree

```
oraclous.com/
│
├── /                                   Home                         [PILLAR · conversion]
│
├── /platform                           Platform overview            [PILLAR]
│   ├── /platform/harness-model         Harness & OHM                [CLUSTER]
│   ├── /platform/actors                Actors (humans + Agents)     [CLUSTER]
│   ├── /platform/compile               Compile flow (goal→harness)  [CLUSTER]
│   ├── /platform/rebac-governance      ReBAC governance             [CLUSTER]
│   ├── /platform/byom                  BYOM (bring your own model)  [CLUSTER]
│   ├── /platform/knowledge-graph       Knowledge graph + retrieval  [CLUSTER]
│   ├── /platform/human-in-the-loop     HITL                         [CLUSTER]
│   ├── /platform/execution-scheduling  Execution & scheduling       [CLUSTER]
│   ├── /platform/mcp-widgets           MCP + embeddable widgets     [CLUSTER]
│   ├── /platform/portability           Portability (OHM export)     [CLUSTER]
│   └── /platform/metering              Metering                     [CLUSTER]
│
├── /how-it-works                       How it works                 [PILLAR]
│
├── /solutions                          Solutions hub                [PILLAR]
│   ├── /solutions/operations           For operations leads         [CLUSTER · conversion]
│   ├── /solutions/developers           For platform builders        [CLUSTER · conversion]
│   ├── /solutions/regulated            For regulated / security     [CLUSTER · conversion]
│   └── /solutions/multi-model          For multi-model ML teams     [CLUSTER · conversion]
│
├── /why-oraclous                       Why Oraclous hub             [PILLAR]
│   ├── /why-oraclous/bespoke-code-is-brittle      [CLUSTER]
│   ├── /why-oraclous/closed-saas-lock-in          [CLUSTER]
│   ├── /why-oraclous/framework-wiring-overhead     [CLUSTER]
│   ├── /why-oraclous/data-sovereignty              [CLUSTER]
│   ├── /why-oraclous/vendor-lock-in                [CLUSTER]
│   └── /why-oraclous/agent-governance-audit        [CLUSTER]
│
├── /security                           Security & data sovereignty  [PILLAR]
│
├── /open-source                        Open source                  [PILLAR]
│
├── /developers                         Developers                   [PILLAR]
│
├── /pricing                            Pricing                      [CONVERSION]
│
├── /blog                               Blog index                   [PILLAR]
│   └── /blog/{slug}                    Blog article                 [CLUSTER]
│
├── /glossary                           Glossary index               [PILLAR · site-wide hub]
│   └── /glossary/{term}                Glossary term                [CLUSTER]
│
└── /about                              About                        [UTILITY]
```

**Pillar count: 9** — Home, Platform, How-it-works, Solutions, Why-Oraclous, Security, Open-source, Developers, Blog, Glossary. (Glossary doubles as the site-wide entity hub; Home doubles as a conversion surface.)

> Note on count: 10 pages carry a pillar role above; Home and Glossary each carry a second role (conversion / hub). The "core marketing pillars" the copywriters and GEO specialist should treat as topical authority hubs are the **9 thematic pillars** plus the **Glossary hub** — 10 hub pages in total.

---

## 3. Page inventory (the full table)

Legend — **Persona**: A = Operations lead · B = Platform builder/developer · C = Security & compliance · D = ML/multi-model · E = Federation owner · F = Open-source evaluator · "All" = multi-persona. **Intent**: I = informational · C = commercial · N = navigational.

### Top-level pages

| URL | Type | Primary persona | Intent | Primary target query | The one job | Primary CTA |
|---|---|---|---|---|---|---|
| `/` | Pillar / conversion | All (B+A front doors) | C | agentic AI platform for enterprise | Land the "second mind" thesis; route each persona to its door | Start with the architecture |
| `/platform` | Pillar | All | C | AI agent orchestration platform | Show the platform is one governed fabric, not a bag of features | Explore the Compile flow |
| `/how-it-works` | Pillar | A, B | I | how to orchestrate multiple AI agents | Walk the goal→harness→run lifecycle end to end | See it in the console |
| `/solutions` | Pillar | All | C | AI agents for [team] | Route visitors to the persona that matches their pain | Pick your team |
| `/why-oraclous` | Pillar | All | C | AI agent platform without vendor lock-in | Frame the "three bad choices" and Oraclous as the fourth | See the comparison |
| `/security` | Pillar | C, E | C | data sovereignty AI / sovereign AI platform | Make control provable: structural isolation + your keys | Review the trust model |
| `/open-source` | Pillar | F, B | C | open source AI agent platform | Prove the open source is real, honest, self-hostable | Read the code on GitHub |
| `/developers` | Pillar | B, D | C | MCP-compatible agent platform | Give builders the architecture, ADRs, BYOM/MCP path | Read the architecture |
| `/pricing` | Conversion | A, C | C | AI agent platform pricing | Explain free self-host vs cloud-hosted; reduce risk | Start free (self-host) |
| `/blog` | Pillar | All | I | best AI agent orchestration platforms 2026 | Publish category-authority content; feed clusters | Subscribe |
| `/glossary` | Pillar / hub | All (F, C) | I | what is agentic AI | Define every Oraclous + category entity canonically | Browse the glossary |
| `/about` | Utility | All | N | Oraclous (company) | Establish org identity, mission, honesty stance | Read the architecture |

### Platform capability deep pages (clusters under `/platform`)

| URL | Type | Primary persona | Intent | Primary target query | The one job | Primary CTA |
|---|---|---|---|---|---|---|
| `/platform/harness-model` | Cluster | B, A | I | what is a Harness (agentic) | Define the Harness/OHM unit of work | See a sample Harness |
| `/platform/actors` | Cluster | A | I | humans and AI agents one task board | Show humans + Agents as symmetric Actors | See the task board |
| `/platform/compile` | Cluster | A | I | describe a goal turn into AI workflow | Explain goal-in-prose → committed harness | Try the Compile flow |
| `/platform/rebac-governance` | Cluster | C, E | C | governed AI agents / ReBAC for AI | Show governance is substrate (ReBAC, policy sets) | Review the trust model |
| `/platform/byom` | Cluster | D | C | BYOM AI agent platform | Show three protocol shapes; model is a resource | Configure BYOM |
| `/platform/knowledge-graph` | Cluster | B, A | I | AI agent knowledge graph memory | Show queryable, provenance-tracked org memory | Read the architecture |
| `/platform/human-in-the-loop` | Cluster | A, C | I | human in the loop AI agents | HITL as a first-class runtime primitive | See the HITL flow |
| `/platform/execution-scheduling` | Cluster | A, B | I | schedule AI agents / durable agent execution | Durable, checkpointed, scheduled execution | See scheduling |
| `/platform/mcp-widgets` | Cluster | B | C | MCP-compatible agent platform | MCP server + client + embeddable widgets | Connect via MCP |
| `/platform/portability` | Cluster | C, F | C | AI agent platform no vendor lock-in / OHM | OHM export hub + honest limits | Read portability docs |
| `/platform/metering` | Cluster | A, B | I | AI agent usage metering / cost attribution | Substrate metering; neutral measurement | See metering |

### Solutions persona pages (clusters under `/solutions`)

| URL | Type | Primary persona | Intent | Primary target query | The one job | Primary CTA |
|---|---|---|---|---|---|---|
| `/solutions/operations` | Cluster / conversion | A | C | AI agents for operations | "Automate the work, not the engineering backlog" | Book a walkthrough |
| `/solutions/developers` | Cluster / conversion | B | C | AI agents for developers / internal tooling | "Stop rebuilding the platform under your agents" | Read the architecture |
| `/solutions/regulated` | Cluster / conversion | C, E | C | AI agents for regulated industries | "Prove control — it's in the architecture" | Review the trust model |
| `/solutions/multi-model` | Cluster / conversion | D | C | model-agnostic AI agents / multi-model agents | "Change the model. Keep the harness." | Configure BYOM |

### Why-Oraclous problem pages (clusters under `/why-oraclous`)

| URL | Type | Primary persona | Intent | Primary target query | The one job | Primary CTA |
|---|---|---|---|---|---|---|
| `/why-oraclous/bespoke-code-is-brittle` | Cluster | A, B | C | build vs buy AI agents | Kill the "build it in code" option | See how Compile replaces it |
| `/why-oraclous/closed-saas-lock-in` | Cluster | C, A | C | open source LangChain alternative / closed SaaS | Kill the "buy closed SaaS" option | See the open-source story |
| `/why-oraclous/framework-wiring-overhead` | Cluster | B | C | LangChain alternative / framework vs platform | Kill the "wire frameworks" option | See the substrate |
| `/why-oraclous/data-sovereignty` | Cluster | C | C | data sovereignty AI | Sovereignty as the buying reason | Review the trust model |
| `/why-oraclous/vendor-lock-in` | Cluster | D, B | C | AI agent platform without vendor lock-in | Lock-in (model + platform + exit) as the reason | See BYOM + portability |
| `/why-oraclous/agent-governance-audit` | Cluster | C, E | C | multi-agent governance | Provable governance/audit as the reason | Review the trust model |

### Glossary terms (clusters under `/glossary`) — the AEO entity anchors

Each is a `DefinedTerm` page with a lead-sentence definition engines can lift verbatim. Primary persona All; intent I.

| URL | Primary target query | Entity class |
|---|---|---|
| `/glossary/harness` | what is a Harness (Oraclous) | Oraclous-proprietary |
| `/glossary/ohm` | what is OHM Oraclous Harness Manifest | Oraclous-proprietary |
| `/glossary/operator` | what is an Operator (agentic AI) | Oraclous-proprietary |
| `/glossary/actor` | actor vs agent AI | Oraclous-proprietary |
| `/glossary/capability` | what is a Capability (AI agent) | Oraclous-proprietary |
| `/glossary/consciousness` | AI agent learning record / Consciousness | Oraclous-proprietary |
| `/glossary/portability` | AI agent portability / no lock-in | Oraclous-proprietary |
| `/glossary/second-mind` | what is a second mind (AI) | Oraclous-proprietary |
| `/glossary/platform-as-code` | platform-as-code | Oraclous-proprietary |
| `/glossary/actors-as-harnesses` | actors-as-harnesses | Oraclous-proprietary |
| `/glossary/rebac` | what is ReBAC / ReBAC vs RBAC | Established (Wikipedia) |
| `/glossary/byom` | what does bring your own model BYOM mean | Established |
| `/glossary/mcp` | what is MCP Model Context Protocol | Established (Wikipedia) |
| `/glossary/agentic-ai` | what is agentic AI | Established |
| `/glossary/multi-agent-orchestration` | what is multi-agent orchestration | Established |
| `/glossary/data-sovereignty` | what is data sovereignty for AI | Established |
| `/glossary/agent` | what is an AI agent | Established |

> The Glossary mixes **proprietary** entities (Harness, OHM, Operator…) with **established** entities (ReBAC, MCP, BYOM, agentic AI…). The proprietary terms are only useful as entities if each is paired with an established one (e.g. "OHM — a portable manifest like MCP, for agent behaviour"). See `internal-linking.md` §Glossary-as-hub.

---

## 4. Navigation-surfaced vs deep pages

- **Primary header nav** surfaces the pillars: Platform · Solutions · Why Oraclous · Security · Open Source · Developers · Pricing (+ utility: Blog, Glossary, About in footer / secondary). How-it-works is reachable from Home and Platform.
- **Capability deep pages, persona Solutions, and Why-Oraclous problem pages** are reached via their pillar hub (mega-menu and on-page hub grids), not all in the top bar.
- **Glossary terms and blog articles** are deep, reached from their index and from contextual in-content links sitewide.

Full nav structure (header + footer), breadcrumbs, and the contextual cross-link rules are specified in `internal-linking.md`.

---

## 5. Cross-cutting requirements (every page)

Per the brief, **every** page must carry three AEO/GEO hooks (detailed per page in `page-structures/`):

1. **A question-shaped section** (H2 phrased as a real query) that yields a **citable answer block** — a 2–3 sentence direct answer an engine can lift verbatim, placed high.
2. **An FAQ section** with 3–5 question-shaped queries drawn from the keyword map (`research/keyword-entity-map.md` §2), answered concisely.
3. **An assigned JSON-LD schema set** — at minimum `BreadcrumbList` on every page, plus page-appropriate types (Home → `Organization` + `SoftwareApplication` + `FAQPage`; how-it-works → `HowTo`; glossary index → `DefinedTermSet`, glossary term → `DefinedTerm`; blog article → `Article` + `Person` + `FAQPage`; Pricing → `Offer`/`Product`; etc.).
