---
title: The Oraclous platform — one governed agentic fabric
meta_description: "The Oraclous platform is one governed fabric for agentic work: Harnesses carry the work, ReBAC governs it, BYOM runs it, OHM keeps it portable. Explore every capability."
url: /platform
diagram: fabric-mesh
page_type: pillar
primary_persona: All
primary_query: AI agent orchestration platform
secondary_queries: [agentic AI platform, multi-agent orchestration, multi-agent platform]
schema: [SoftwareApplication, FAQPage, BreadcrumbList, ItemList]
primary_cta: Explore the Compile flow → /platform/compile
secondary_cta: Read the architecture → /developers
---

# The Oraclous platform

One platform where your people and AI Agents run governed work: platform-as-code, actors-as-harnesses. [Harnesses](/glossary/harness) carry the work; [ReBAC](/glossary/rebac) governs it; [BYOM](/glossary/byom) runs it; [OHM](/glossary/ohm) keeps it portable — all built once, into the substrate.

[Explore the Compile flow →](/platform/compile) [Read the architecture →](/platform)

> *Hero visual (build note): the four-layer substrate with one Harness threaded through it — governed, run, metered — not a feature grid.*

## What is an AI agent orchestration platform?

An [agentic AI](/glossary/agentic-ai) orchestration platform assigns, governs, and runs work across multiple AI [Agents](/glossary/agent) — and, in Oraclous, humans too — under one policy model. The difference between a platform and a framework is where the hard parts live: a framework leaves identity, credentials, governance, audit, and metering for you to wire per use case; a platform makes them substrate, built once and enforced everywhere.

Oraclous does this with [Harnesses](/glossary/harness) as the unit of work, [ReBAC](/glossary/rebac) governance applied at the Harness level, and [BYOM](/glossary/byom) so the model is a resource you swap — not plumbing you DIY.

> **Citable answer — What is an AI agent orchestration platform?** An AI agent orchestration platform assigns, governs, and runs work across multiple AI Agents (and humans) under one policy model. Oraclous does this with Harnesses as the unit of work, ReBAC governance enforced at the Harness level, and BYOM for model choice — delivering orchestration as substrate rather than as plumbing each team wires by hand.

[What is multi-agent orchestration? →](/glossary/multi-agent-orchestration) · [What is agentic AI? →](/glossary/agentic-ai) · [Platform vs framework →](/platform)

## What can the platform do?

Eleven capabilities, grouped into three triangles. Each is substrate — not a bolt-on — and each has a deep page.

### The work — describe the goal

- **[Harness & OHM](/platform/harness-model)** — Every executable thing on the platform is a [Harness](/glossary/harness): a goal-driven assembly of human and Agent Actors under one policy envelope, with [OHM](/glossary/ohm) as its portable manifest. One unit of work, one governance and budget surface. [Learn more →](/platform/harness-model)
- **[Actors](/platform/actors)** — Humans and AI Agents are symmetric [Actors](/glossary/actor) on one task board: each has an identity, a scope, and a capability allocation, and work hands off between them under one governance model. [Learn more →](/platform/actors)
- **[Compile](/platform/compile)** — An [Operator](/glossary/operator) describes a goal in prose and the [Compile flow](/glossary/platform-as-code) surveys the workspace, plans the topology, and emits a Harness you review before it runs. Describe the goal, don't code the pipeline. [Learn more →](/platform/compile)

### Governance — provable control

- **[ReBAC governance](/platform/rebac-governance)** — Access by relationship, not by role, enforced platform-wide at the Harness level, under five named, versioned policy sets. Auditors get proof, not promises. [Learn more →](/platform/rebac-governance)
- **[Human-in-the-loop](/platform/human-in-the-loop)** — Human review is a first-class runtime primitive: the runtime treats waiting on a human like waiting on a tool return, so oversight is structural rather than a side-channel. [Learn more →](/platform/human-in-the-loop)
- **[Metering](/platform/metering)** — Substrate-level tracking of tokens, tool calls, storage, execution time, and cross-workspace traversals — per organisation and per workspace. Neutral measurement; you set the prices. [Learn more →](/platform/metering)

### Open & portable — your data, your model, your exit

- **[BYOM](/platform/byom)** — Bring your own model provider: Anthropic-native, OpenAI-compatible, or Gemini-compatible. The LLM is a resource the Agent uses, so you switch by config without rewriting the Harness. [Learn more →](/platform/byom)
- **[MCP & widgets](/platform/mcp-widgets)** — Oraclous is both an [MCP](/glossary/mcp) server (exposes ReBAC-scoped capabilities to clients like Claude Desktop) and an MCP client (imports external tools as native OHM), plus embeddable widgets to reach the work from your own product. [Learn more →](/platform/mcp-widgets)
- **[Portability](/platform/portability)** — [OHM](/glossary/ohm) is the canonical export hub and the reference runtime is open, so you can leave without re-implementing — and the docs name exactly what portability does and doesn't carry. [Learn more →](/platform/portability)
- **[Knowledge graph & retrieval](/platform/knowledge-graph)** — A queryable, provenance-tracked organisational memory: multi-modal ingest on the write side, ReBAC-bounded semantic, full-text, hybrid, and graph-traversal queries on the read side. The second mind that remembers. [Learn more →](/platform/knowledge-graph)
- **[Execution & scheduling](/platform/execution-scheduling)** — Durable, checkpointed execution: schedules fire from the Harness's triggers, runs pause/resume/cancel and survive restarts, and timeouts plus a declared retry count keep work from looping away. [Learn more →](/platform/execution-scheduling)

## How is this different from stitching tools together?

When you stitch tools together, the unit of work is whatever each tool happens to be, and governance, audit, and metering are yours to reconcile across all of them. In Oraclous the unit of work is the [Harness](/glossary/harness) — one thing to assign, govern, budget, and audit — and governance, provenance, and metering are substrate beneath every Harness, not features you assemble per project.

That is the meaning of platform-as-code, actors-as-harnesses: the platform's machinery is code, written and versioned once; the behaviour is Harnesses, described in prose. You compose Capabilities; you don't re-wire infrastructure each time.

> **Citable answer — How is a platform different from stitching tools together?** Stitching tools leaves governance, identity, audit, and metering for you to reconcile per use case. Oraclous makes the Harness the single unit of work and makes governance, provenance, and metering substrate beneath every Harness — built once by the platform, enforced everywhere — so you compose capabilities instead of re-wiring infrastructure.

[What is a Harness? →](/glossary/harness) · [Platform vs framework →](/platform) · [Review the trust model →](/security)

## Frequently asked questions

**Q: What is multi-agent orchestration?**
A: Multi-agent orchestration is coordinating several AI Agents — assigning their work, sequencing their hand-offs, and governing what each can do — so they act as one system rather than in isolation. Oraclous orchestrates Agents and humans together through one runtime, under one ReBAC policy envelope, with the Harness as the unit being orchestrated. [Read the definition →](/glossary/multi-agent-orchestration)

**Q: Does Oraclous support MCP?**
A: Yes — both directions. Oraclous is an MCP server, exposing ReBAC-scoped workspace capabilities to clients like Claude Desktop and Cursor, and an MCP client, importing external MCP tools into the Capability Registry as native OHM tools. MCP is the de-facto open standard for connecting AI systems to tools. [See MCP & widgets →](/platform/mcp-widgets)

**Q: Can I use Claude, GPT, Gemini, or a local model?**
A: Yes. BYOM supports three protocol shapes — Anthropic-native, OpenAI-compatible, and Gemini-compatible — and resolves model config at the agent, workspace, or organisation level. The LLM is a resource the Agent uses, so you can run providers side by side or switch between them by config, without touching the Harness. [How BYOM works →](/platform/byom)

**Q: Is Oraclous open source?**
A: Yes. The platform is open source and platform-as-code — inspectable, forkable, and self-hostable, with its architectural decisions documented as ADRs. You can read the code and the trade-offs before committing, and the cloud-hosted mode is an option, not an obligation. [See the open-source story →](/open-source)

**Q: How is a platform different from a framework like LangChain?**
A: A framework like LangChain gives you reusable parts but leaves governance, identity, credentials, audit, and metering to assemble per use case. Oraclous makes those substrate and inverts the unit of work: you describe a goal in prose and the Compile flow emits the Harness, rather than coding each agent. Humans are first-class Actors, and the platform is data-sovereign and portable by design. [Platform vs framework →](/platform)

[Explore the Compile flow →](/platform/compile) [Read the architecture →](/platform) [Self-host it →](/open-source)

---
**Internal links:** all 11 capability deep pages (`/platform/harness-model`, `/platform/actors`, `/platform/compile`, `/platform/rebac-governance`, `/platform/human-in-the-loop`, `/platform/metering`, `/platform/byom`, `/platform/mcp-widgets`, `/platform/portability`, `/platform/knowledge-graph`, `/platform/execution-scheduling`), `/how-it-works` (lifecycle narrative), `/developers` (architecture CTA), `/security` (control claim), `/platform` (platform-vs-framework), `/open-source` (open-source FAQ), and first-use Glossary links: `/glossary/harness`, `/glossary/rebac`, `/glossary/byom`, `/glossary/ohm`, `/glossary/agentic-ai`, `/glossary/agent`, `/glossary/actor`, `/glossary/operator`, `/glossary/platform-as-code`, `/glossary/mcp`, `/glossary/multi-agent-orchestration`. External: `/how-it-works` (console CTA, followed).
**Notes for build:** Capability grid = 11 cards in three labelled groups ("The work" / "Governance" / "Open & portable") matching the nav mega-menu triangles; emit `ItemList` JSON-LD over the 11 cards. Each card carries a one-line benefit + an exact-term "Learn more →" anchor to its `/platform/{capability}` deep page. Hero = four-layer substrate visual with one Harness threaded through, not a feature wall. `SoftwareApplication` schema on the page.
