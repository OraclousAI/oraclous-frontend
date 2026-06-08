# Page Structures — Glossary index (`/glossary`) + term-page template

> Blueprint — structure + intent + target queries, **not** finished copy. The Glossary is the **AEO engine** (`internal-linking.md` §7): the canonical, schema-marked definition source for every Oraclous and category entity. Each term page is built to be lifted verbatim by answer engines. Grounded in keyword-map §J (term list), §3 (entity targets), §5 (on-page execution notes).

---

# PART 1 — Glossary index (`/glossary`)

Type: **Pillar / site-wide hub**. Persona: **All (F, C heaviest)**. Primary target query: *what is agentic AI* (+ the whole definitional set). The one job: **define every Oraclous + category entity canonically and route to each term.**

## Wireframe
- **H1:** "Oraclous glossary" — the definitions, in one place.
- **Hero:** "The vocabulary of governed agentic operations." Subhead: Oraclous's terms (Harness, OHM, Operator…) and the category's (ReBAC, MCP, BYOM, agentic AI).
- **Citable answer block — H2:** "What are the key terms in agentic AI and Oraclous?" → liftable: a one-paragraph map naming the core entities and linking each.
- **§ Oraclous terms — H2:** "Oraclous concepts" → grid linking the 10 proprietary terms (Harness, OHM, Operator, Actor, Capability, Consciousness, Portability, second mind, platform-as-code, actors-as-harnesses).
- **§ Category terms — H2:** "Agentic AI & governance concepts" → grid linking the 7 established terms (ReBAC, BYOM, MCP, agentic AI, multi-agent orchestration, data sovereignty, Agent).
- **A–Z index** for crawlability + quick scan.
- **FAQ — H2:** What is agentic AI? · What is ReBAC vs RBAC? · What is MCP? · What does BYOM mean? (the highest-volume definitional queries, each also a full term page).
- **CTA band:** Browse the glossary / See the platform.

## JSON-LD: `DefinedTermSet` (the whole glossary) + `FAQPage` + `BreadcrumbList` + `ItemList` of terms.
## CTAs: Primary — Browse the glossary. Secondary — See the platform.
## Key links out: all 17 `/glossary/{term}` · `/platform` · `/security`.

---

# PART 2 — Term-page template (all 17 `/glossary/{term}`)

Type: **Cluster**. Intent: I. Designed for verbatim AI extraction — the lead sentence IS the citable answer. Per `internal-linking.md` §7: one canonical definition per entity; pair each proprietary term with an established one; link back out to the product page that uses it.

## Shared wireframe

### H1
The term, exact casing (e.g. "ReBAC", "OHM (Oraclous Harness Manifest)", "Harness").

### Lead definition = citable answer block (AEO hook — placed first, no hero fluff before it)
- **The opening sentence is a standalone, liftable definition** in the form "{Term} is …" — the single most important line on the page. Engines should be able to quote it verbatim.
- Followed by 1–2 sentences of essential context. For **proprietary** terms, the context sentence **pairs the term with an established entity** ("OHM is a portable manifest for agent behaviour — the way MCP is a portable protocol for tools").

### Section 1 — In depth
- **H2 (question-shaped):** "What is {term}?" / "How does {term} work?"
- Fuller explanation, exact-termed, cited to architecture where relevant.

### Section 2 — Why it matters / contrast (where applicable)
- **H2:** "Why does {term} matter?" or for contrast terms "{Term} vs {alternative}?" (e.g. "ReBAC vs RBAC?", "Actor vs Agent?", "platform vs framework?").

### Section 3 — Where this lives in Oraclous (mandated outbound block)
- **H2:** "Where does {term} show up in Oraclous?"
- Links to the **Platform capability / Solution / Security** page that uses the term (the term→product back-link, `internal-linking.md` §7).

### Section 4 — See also
- 2–3 related glossary terms (the intra-glossary mesh) + the external authoritative source for established entities (Wikipedia for ReBAC/MCP, etc. — the entity-association citation).

### Section 5 — FAQ (AEO hook)
- **H2:** "Frequently asked questions" — 2–4 related question-shaped queries (table).

## JSON-LD (every term page): `DefinedTerm` (member of the `DefinedTermSet`) + `FAQPage` + `BreadcrumbList`. Established entities add `sameAs` to the authoritative source (Wikipedia/Wikidata) inside the `DefinedTerm`.

## Per-term slot fills

| Term page | Citable lead (form) | Paired established entity | "vs" / contrast section | → Product page | See also | FAQ candidates |
|---|---|---|---|---|---|---|
| `/glossary/harness` | "A Harness is a goal-driven assembly of human and AI Agent Actors under one policy envelope." | (—, anchor: workflow/pipeline) | Harness vs workflow | `/platform/harness-model` | ohm, operator, capability | What is a Harness? · How is it different from a workflow? |
| `/glossary/ohm` | "OHM (Oraclous Harness Manifest) is the portable, serialised form of a Harness." | MCP | OHM vs proprietary export formats | `/platform/portability` | harness, mcp, portability | What is OHM? · Can I export it? · What doesn't it carry? |
| `/glossary/operator` | "An Operator is the person who states a goal in prose that compiles into a Harness." | (prompt author) | Operator vs developer | `/platform/compile` | harness, actor | What does an Operator do? · Do they write code? |
| `/glossary/actor` | "An Actor is any entity — human member or AI Agent — that can be assigned work in a Harness." | (—) | Actor vs Agent | `/platform/actors` | agent, harness, operator | What is the difference between an Actor and an Agent? |
| `/glossary/capability` | "A Capability is anything an Actor can invoke — one of five kinds: Tool, Skill, Agent, Harness, or Human role." | (tool/plugin) | — | `/platform/harness-model` | harness, mcp | What are the five Capability kinds? |
| `/glossary/consciousness` | "Consciousness is a per-Actor record of accumulated learning, recorded and consulted via the Learn flow." | (memory/RAG) | — | `/platform/knowledge-graph` | second-mind, actor | What is the Consciousness record? · Is it exported? |
| `/glossary/portability` | "Portability is the property that OHM and the open reference runtime let you leave without re-implementing." | (data portability) | — | `/platform/portability` | ohm, data-sovereignty | What does portability cover and not cover? |
| `/glossary/second-mind` | "A second mind is an organisation's unified human + AI Agent operational capacity, governed as one fabric." | (digital twin / AI workforce) | second mind vs AI workforce | `/platform`, `/` | consciousness, agentic-ai | What is a second mind? |
| `/glossary/platform-as-code` | "Platform-as-code means the platform substrate is deployed and versioned through normal engineering practice." | (infrastructure-as-code) | — | `/open-source` | actors-as-harnesses | What is platform-as-code? |
| `/glossary/actors-as-harnesses` | "Actors-as-harnesses means every executable thing on the platform is a Harness, not bespoke code." | (—) | — | `/platform/harness-model` | platform-as-code, harness | What does actors-as-harnesses mean? |
| `/glossary/rebac` | "ReBAC (relationship-based access control) defines permissions by the relationships between entities, not by static roles." | RBAC (contrast) + Wikipedia `sameAs` | ReBAC vs RBAC | `/platform/rebac-governance`, `/security` | data-sovereignty, capability | What is ReBAC? · ReBAC vs RBAC? · Why not RBAC for AI agents? |
| `/glossary/byom` | "BYOM (bring your own model) lets you connect your own LLM provider — Anthropic-native, OpenAI-compatible, or Gemini-compatible." | BYOM (Palantir/GitLab usage) | — | `/platform/byom` | mcp, portability | What does BYOM mean? · Which providers? · Local models? |
| `/glossary/mcp` | "MCP (Model Context Protocol) is the open standard for connecting AI models to tools and data; Oraclous is both an MCP server and client." | MCP + Wikipedia `sameAs` | — | `/platform/mcp-widgets`, `/developers` | byom, capability | What is MCP? · Is Oraclous MCP-compatible? |
| `/glossary/agentic-ai` | "Agentic AI is AI that pursues goals by taking actions across tools and steps, not just generating text." | agentic AI / generative AI (contrast) | agentic vs generative AI | `/platform`, `/` | multi-agent-orchestration, agent | What is agentic AI? · How is it different from generative AI? |
| `/glossary/multi-agent-orchestration` | "Multi-agent orchestration is coordinating multiple AI Agents (and humans) to complete work under one control model." | multi-agent systems | — | `/platform` | agentic-ai, harness | What is multi-agent orchestration? |
| `/glossary/data-sovereignty` | "Data sovereignty for AI means your data and the keys to it stay under your control, self-host or cloud." | data sovereignty (+ external) | — | `/security`, `/why-oraclous/data-sovereignty` | rebac, portability | What is data sovereignty for AI? · Who holds the keys? |
| `/glossary/agent` | "An AI Agent is an autonomous Actor that pursues assigned goals using Capabilities and an LLM as a resource." | AI agent (+ external) | Agent vs Actor; Agent vs bot | `/platform/actors` | actor, agentic-ai, capability | What is an AI agent? · Is an agent the same as a bot? (no — clarify) |

> Casing/spelling guard (keyword-map §3 strategic note): the proprietary terms are **only** useful as entities if spelled and cased identically everywhere — never vary Harness/OHM/ReBAC/BYOM/Operator/Consciousness/Portability. The glossary is the canonical spelling authority; every other page must match it. Never write "RBAC" for ReBAC or "bot" for Agent.
