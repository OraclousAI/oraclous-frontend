# Page Structures — Platform hub (`/platform`) + capability-page template

> Covers the Platform pillar hub and the shared template for all 11 capability deep pages, with per-capability specifics. Structure + intent + target queries — **not** finished copy. Grounded in `messaging-matrix.md` §2 (per-capability) and the keyword map Pillars A/D/E/F.

---

# PART 1 — Platform hub (`/platform`)

Type: **Pillar**. Persona: **All**. Primary target query: *AI agent orchestration platform* / *multi-agent platform*. The one job: **show Oraclous is one governed fabric, not a bag of features** — and route to each capability.

## Wireframe

### H1
"The Oraclous platform" — the agentic operations platform, one governed fabric.
- Target: *AI agent orchestration platform*, *agentic AI platform*, *multi-agent orchestration*.

### Hero
- **Headline intent:** one platform where people + Agents run governed work; "platform-as-code, actors-as-harnesses."
- **Subhead intent:** **Harnesses** carry the work; **ReBAC** governs it; **BYOM** runs it; **OHM** keeps it portable — built once, into the substrate.
- **Primary CTA:** Explore the Compile flow (→ `/platform/compile`). **Secondary:** Read the architecture (→ `/developers`).

### Section 1 — Citable answer block (AEO hook)
- **H2:** "What is an AI agent orchestration platform?"
- **Answer block:** A direct, liftable definition that positions Oraclous as the platform (vs framework): an agent orchestration platform assigns, governs, and runs work across multiple AI **Agents** (and humans) under one policy model — Oraclous does this with **Harnesses**, **ReBAC** governance, and **BYOM**, as substrate rather than DIY plumbing.
- Links: `/glossary/multi-agent-orchestration`, `/glossary/agentic-ai`, `/why-oraclous/framework-wiring-overhead`.

### Section 2 — Capability grid (the hub spokes)
- **H2:** "What can the platform do?"
- 11 capability cards, grouped into the three triangles (matching the nav mega-menu and `internal-linking.md` §2.1):
  - *The work:* Harness & OHM · Actors · Compile
  - *Governance:* ReBAC governance · Human-in-the-loop · Metering
  - *Open & portable:* BYOM · MCP & widgets · Portability · Knowledge graph · Execution & scheduling
- Each card → its `/platform/{capability}` page.

### Section 3 — One fabric, not features
- **H2:** "How is this different from stitching tools together?"
- The unit is the Harness; governance/audit/metering are substrate. Links: `/glossary/harness`, `/why-oraclous/framework-wiring-overhead`, `/security`.

### Section 4 — FAQ (AEO hook)
- **H2:** "Frequently asked questions"
- Candidates: What is multi-agent orchestration? · Does Oraclous support MCP? · Can I use Claude / GPT / Gemini / a local model? · Is it open source? · How is a platform different from a framework like LangChain?
- Links to Glossary / Developers / Why-Oraclous / Open-source.

### Section 5 — CTA band
- Primary: Explore the Compile flow. Secondary: Read the architecture / Start free.

## JSON-LD
`SoftwareApplication` (or `Product`) + `FAQPage` + `BreadcrumbList` (+ `ItemList` for the capability grid).

## Key internal links out
All 11 `/platform/*` · `/how-it-works` · `/developers` · `/security` · `/glossary/multi-agent-orchestration`.

---

# PART 2 — Capability-page template (applies to all 11 `/platform/{capability}`)

Every capability page follows this skeleton; the per-capability table below fills the slots. Type: **Cluster**. Intent: I/C.

## Shared wireframe

### H1
The capability name (exact term) + its benefit. (e.g. "BYOM — bring any model, never get locked in.")

### Hero
- **Headline intent:** the capability's headline from `messaging-matrix.md` §2 ("Benefit").
- **Subhead intent:** the "feature → benefit → so-what" line for this capability.
- **Primary CTA:** capability-specific (see table). **Secondary:** Read the architecture / See it in the console.

### Section 1 — Citable answer block (AEO hook)
- **H2 (question-shaped):** "What is {capability}?" (the capability's definitional question).
- **Answer block (2–3 liftable sentences):** the feature + what you get, exact-termed. **Links to the matching `/glossary/{term}` for the canonical definition** (does not re-define canonically — per `internal-linking.md` §6.3).

### Section 2 — How it works
- **H2 (question-shaped):** "How does {capability} work?"
- The mechanism, cited to architecture (the proof points in matrix §2). Diagram where helpful.

### Section 3 — Why it matters / who it's for
- **H2:** "Why does {capability} matter?"
- The "so what" + the persona who cares most → links to that Solution page.

### Section 4 — FAQ (AEO hook)
- **H2:** "Frequently asked questions" — 3–5 question-shaped queries from the keyword map (see table).

### Section 5 — Related capabilities + CTA
- "See also" → its sibling-triangle capabilities (`internal-linking.md` §2.1) + its Glossary term + its Solution.

## JSON-LD (every capability page)
`TechArticle` (or `WebPage`) + `FAQPage` + `BreadcrumbList`. Pages defining an entity also reference the `DefinedTerm` (`/glossary/{term}`) via link, not duplicate schema.

## Per-capability slot fills

| Page | Definitional Q (citable block) | Target query | FAQ candidates | Primary CTA | Glossary link | Solution link | Sibling links |
|---|---|---|---|---|---|---|---|
| `/platform/harness-model` | What is a Harness? | what is a Harness (agentic) | What is a Harness? · What is OHM? · How is a harness different from a workflow? · Can a harness contain other harnesses? | See a sample Harness | `/glossary/harness`, `/glossary/ohm` | developers, operations | actors, compile |
| `/platform/actors` | What is an Actor (human or Agent)? | humans and AI agents one task board | Can humans and AI agents share a task board? · What is the difference between an Actor and an Agent? · How does work hand off between a human and an agent? | See the task board | `/glossary/actor`, `/glossary/agent` | operations | harness-model, knowledge-graph, human-in-the-loop |
| `/platform/compile` | How do you turn a goal into a workflow? | describe a goal turn into AI workflow | How does the Compile flow work? · Do I need to write code? · What is an Operator? · Can I review the harness before it runs? | Try the Compile flow | `/glossary/operator` | operations | harness-model, actors |
| `/platform/rebac-governance` | What is ReBAC governance? | governed AI agents / ReBAC for AI | What is ReBAC and how is it different from RBAC? · How do you control what an AI agent can access? · What are the five policy sets? | Review the trust model | `/glossary/rebac`, `/glossary/capability` | regulated | human-in-the-loop, metering |
| `/platform/byom` | What is BYOM? | BYOM AI agent platform | What does bring your own model mean? · Can I use Claude / GPT / Gemini / a local model? · Where do my model keys live? · Does switching models change the harness? | Configure BYOM | `/glossary/byom` | multi-model | mcp-widgets, portability |
| `/platform/knowledge-graph` | How does Oraclous remember? | AI agent knowledge graph memory | How does the platform store organisational memory? · Is retrieval ReBAC-bounded? · Can I export the knowledge graph? | Read the architecture | `/glossary/second-mind` | developers, operations | actors, rebac-governance |
| `/platform/human-in-the-loop` | What is human-in-the-loop here? | human in the loop AI agents | How do humans approve agent work? · Is HITL a workaround or built in? · Can a human block an agent step? | See the HITL flow | `/glossary/actor` | operations, regulated | rebac-governance, actors |
| `/platform/execution-scheduling` | How does execution work? | schedule AI agents / durable agent execution | Can agents run on a schedule? · What happens if a run crashes? · Are there retry limits? | See scheduling | `/glossary/harness` | operations | harness-model, metering |
| `/platform/mcp-widgets` | Does Oraclous support MCP? | MCP-compatible agent platform | Is Oraclous an MCP server or client? · Can I embed Oraclous in my product? · Which MCP clients work (Claude Desktop, Cursor)? | Connect via MCP | `/glossary/mcp` | developers | byom, portability |
| `/platform/portability` | Can I leave without a rewrite? | AI agent platform no vendor lock-in / OHM | What is OHM? · What does portability not cover? · How do I export my work? | Read portability docs | `/glossary/ohm`, `/glossary/portability` | regulated, multi-model | byom, mcp-widgets |
| `/platform/metering` | How is usage measured? | AI agent usage metering / cost attribution | What does metering track? · Does Oraclous set prices? · Can I enforce budgets? | See metering | `/glossary/capability` | operations | rebac-governance, execution-scheduling |

> Note: `harness-model`, `actors`, `compile` are the "describe-the-goal" group; `rebac-governance`, `human-in-the-loop`, `metering` the governance group; `byom`, `mcp-widgets`, `portability`, `knowledge-graph`, `execution-scheduling` the open/runtime group. Every page links up to `/platform` and carries its breadcrumb.
