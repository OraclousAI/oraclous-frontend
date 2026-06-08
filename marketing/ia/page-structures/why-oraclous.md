# Page Structures — Why Oraclous hub (`/why-oraclous`) + problem-page template & 6 variants

> Blueprint — structure + intent + target queries, **not** finished copy. Covers the Why-Oraclous pillar hub, the shared problem-page template, and the 6 problem variants. Grounded in positioning §5 ("three bad choices"), §6 (objections), and keyword-map Pillar G (highest commercial intent). Each problem page links to its matching Solution + Platform capability + Glossary term(s) — the mandated cross-link (`internal-linking.md` §2.3 / §6.2).

---

# PART 1 — Why-Oraclous hub (`/why-oraclous`)

Type: **Pillar**. Persona: **All**. Primary target query: *AI agent platform without vendor lock-in* / *build vs buy AI agents*. The one job: **frame the "three bad choices" and present Oraclous as the fourth.**

## Wireframe
- **H1:** "Why Oraclous?" — the fourth choice for agentic work.
- **Hero:** "There used to be three ways to put AI agents to work. All three asked you to give something up." Subhead: Oraclous is the fourth.
- **Citable answer block — H2:** "Why choose Oraclous over building, buying, or wiring it yourself?" → liftable: Building bespoke pipelines is brittle, closed SaaS takes your data sovereignty, and frameworks make you wire governance by hand; Oraclous is the open-source fourth choice — describe the goal, and ReBAC, credentials, audit, and metering come built in, data-sovereign and portable.
- **The three bad choices — H2:** "What are the three bad choices?" → 3 cards → bespoke-code-is-brittle · closed-saas-lock-in · framework-wiring-overhead.
- **What you actually need — H2:** "What should you actually demand?" → 3 cards → data-sovereignty · vendor-lock-in · agent-governance-audit.
- **FAQ — H2:** Should I build or buy AI agents? · What is the best open-source LangChain alternative? · How do I avoid vendor lock-in? · What is the difference between an agent framework and a platform?
- **CTA band:** See the comparison / Pick your team.

## JSON-LD
`WebPage` + `ItemList` (the 6 problem pages) + `FAQPage` + `BreadcrumbList`.

## Key links out
All 6 `/why-oraclous/*` · `/solutions` · `/platform` · `/open-source` · `/security` · Glossary terms.

---

# PART 2 — Shared problem-page template (all 6 `/why-oraclous/{problem}`)

Type: **Cluster**. Intent: C. Every variant follows this skeleton; the table fills the slots.

## Shared wireframe

### H1
The problem stated as the reader's reality (e.g. "Bespoke agent code is brittle — and the backlog never ends.").

### Hero
- **Headline intent:** name the pain sharply. **Subhead intent:** "there's a better way" tease → Oraclous.
- **Primary CTA:** problem-specific (table). **Secondary:** See how it works.

### Section 1 — The problem (recognition + cost)
- **H2 (question-shaped):** the problem as a question (e.g. "Why does bespoke agent code keep breaking?").
- Names the pain and its real cost (from positioning §5). For comparison-flavoured pages, this is where the "alternative-to" intent is served.

### Section 2 — Citable answer block (AEO hook)
- **H2:** "How does Oraclous solve this?"
- **Answer block (liftable, 2–3 sentences):** the Oraclous response to this exact problem, exact-termed, from positioning §5/§6.

### Section 3 — How Oraclous removes it (the mandated cross-link block)
- **H2:** "What does Oraclous do instead?"
- Explicit links to: **the matching Solution** + **the matching Platform capability** + **the Glossary term(s)** (per the table; this block is required on every problem page).

### Section 4 — The other two bad choices
- **H2:** "What about the other options?"
- Brief contrast + links to the sibling problem pages (the trio reinforces the narrative).

### Section 5 — FAQ (AEO hook)
- **H2:** "Frequently asked questions" — 3–5 from keyword map §2, problem-specific (table).

### Section 6 — CTA band
- Primary + secondary (table) + link to `/why-oraclous` hub and a Solution.

## JSON-LD (every problem page)
`WebPage` + `FAQPage` + `BreadcrumbList`. (Comparison-flavoured pages may add `Article` if they carry substantial editorial contrast content.)

## The 6 variants — slot fills

### 1 — `/why-oraclous/bespoke-code-is-brittle` (kills "build it in code")
| Slot | Value |
|---|---|
| Pain Q | "Why does bespoke agent code keep breaking — and the backlog never end?" |
| Citable answer | Building agentic workflows in code gives you one brittle pipeline and a backlog of more; Oraclous lets Operators describe the goal in prose and compiles it into a governed Harness — every change is a prose edit, not an engineering ticket. |
| Target query | build vs buy AI agents / stop building bespoke agent pipelines |
| → Solution | operations |
| → Capability | compile, harness-model |
| → Glossary | platform-as-code, actors-as-harnesses |
| FAQ | Should I build my own agent pipeline or buy a platform? · Why is bespoke automation so brittle? · Do I still need engineers? |
| Primary CTA | See how Compile replaces it |

### 2 — `/why-oraclous/closed-saas-lock-in` (kills "buy the closed platform")
| Slot | Value |
|---|---|
| Pain Q | "What do you give up when you buy a closed agent SaaS?" |
| Citable answer | Closed agent SaaS owns your data, your governance, and your exit; Oraclous is open source and data-sovereign by design — self-host or cloud with identical guarantees, and leave anytime via the open OHM manifest. |
| Target query | open source LangChain alternative / closed SaaS AI |
| → Solution | regulated |
| → Capability | portability |
| → Glossary | portability, data-sovereignty |
| FAQ | What is the best open-source alternative to closed agent SaaS? · Can I leave a closed platform? · Is open source safe for production? |
| Primary CTA | See the open-source story |

### 3 — `/why-oraclous/framework-wiring-overhead` (kills "wire the frameworks")
| Slot | Value |
|---|---|
| Pain Q | "Why does a framework still leave you building a platform?" |
| Citable answer | Frameworks like LangChain hand you parts but leave governance, identity, credentials, audit, and metering to wire per use case; Oraclous makes those substrate — built once, enforced at the Harness level — so you compose Capabilities instead of re-wiring infrastructure. |
| Target query | LangChain alternative / framework vs platform |
| → Solution | developers |
| → Capability | harness-model, rebac-governance |
| → Glossary | actors-as-harnesses, capability, platform-as-code |
| FAQ | What is the difference between an AI agent framework and a platform? · Is this just LangChain plus governance? · What is the best LangChain alternative? |
| Primary CTA | See the substrate |

### 4 — `/why-oraclous/data-sovereignty` (the sovereignty reason)
| Slot | Value |
|---|---|
| Pain Q | "Can you use AI agents without giving up control of your data?" |
| Citable answer | With Oraclous, cross-organisation data flow is structurally impossible — every record carries an organization_id, credentials never leave the broker, and in cloud mode staff cannot decrypt your state — so data sovereignty is architectural, not a promise. |
| Target query | data sovereignty AI / sovereign AI platform |
| → Solution | regulated |
| → Capability | rebac-governance, portability |
| → Glossary | data-sovereignty, rebac |
| FAQ | What is data sovereignty for AI? · Can hosted vendors see my data? · Who holds the encryption keys? |
| Primary CTA | Review the trust model |

### 5 — `/why-oraclous/vendor-lock-in` (the lock-in reason: model + platform + exit)
| Slot | Value |
|---|---|
| Pain Q | "How do you avoid getting locked into a model, a platform, or an exit penalty?" |
| Citable answer | Oraclous removes three lock-ins at once: BYOM swaps models by config across three protocol shapes, the platform is open-source platform-as-code, and OHM makes your work portable — with the docs stating exactly how far portability goes. |
| Target query | AI agent platform without vendor lock-in / model-agnostic agents |
| → Solution | multi-model |
| → Capability | byom, portability |
| → Glossary | byom, ohm, portability |
| FAQ | How do I avoid vendor lock-in with AI agents? · Can I switch LLM providers without a rewrite? · What does portability not cover? |
| Primary CTA | See BYOM + portability |

### 6 — `/why-oraclous/agent-governance-audit` (the governance/audit reason)
| Slot | Value |
|---|---|
| Pain Q | "How do you govern and audit AI agents across people and tools?" |
| Citable answer | Oraclous enforces ReBAC at the Harness level with five versioned policy sets, runs every execution under a policy envelope, and writes provenance and metering into the substrate — so governance is the platform, not a checkbox, and auditors get proof. |
| Target query | multi-agent governance / AI agent audit logs |
| → Solution | regulated |
| → Capability | rebac-governance, metering, human-in-the-loop |
| → Glossary | rebac, capability |
| FAQ | How do you govern AI agents in an enterprise? · What is ReBAC vs RBAC? · Can AI agents respect a company's existing permissions? · Where are the audit logs? |
| Primary CTA | Review the trust model |

> Terminology guard: these pages reference competitors (LangChain, CrewAI, closed SaaS) as *alternatives* for comparison intent, but never adopt their framing of Oraclous as "just a framework/bot." Always **ReBAC** (never RBAC), **Agent** (never bot). Each page links up to `/why-oraclous` and carries its breadcrumb.
