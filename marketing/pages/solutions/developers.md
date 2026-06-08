---
title: AI agents for developers — build on the substrate
meta_description: "AI agents for developers and internal tooling: ReBAC, credentials, audit, and metering are substrate services. Compose Capabilities, support MCP both ways, stay portable via OHM."
url: /solutions/developers
page_type: cluster
primary_persona: Platform builder / developer
primary_query: AI agents for developers / internal tooling
secondary_queries: [build AI agents without governance plumbing, MCP-compatible agent platform, open source LangChain alternative, self-host AI agent platform, AI agent platform no vendor lock-in]
schema: [BreadcrumbList, FAQPage, WebPage]
primary_cta: Read the architecture → /platform/harness-model
secondary_cta: Read the code on GitHub → /open-source
---

# Stop rebuilding the platform under your agents.
You've shipped an agent stack before — and watched most of the effort go to governance plumbing you rebuilt by hand. Oraclous makes identity, [ReBAC](/glossary/rebac), credentials, audit, and metering substrate services, so you compose [Capabilities](/glossary/capability) instead of re-implementing security per project — and stay portable through the open [OHM](/glossary/ohm) manifest.

[Read the architecture →](/platform/harness-model) [Read the code on GitHub →](/open-source)

> *Hero visual (build note): two stacks side by side — a framework stack with a thick hand-wired "governance/identity/credentials/audit/metering" layer the developer maintains, vs. the Oraclous stack where that layer is the substrate and the developer composes Capabilities on top.*

## Why does 60% of agent work go to governance plumbing?

Because frameworks hand you parts, not a platform. LangChain and its peers give you reusable pieces, but identity, ReBAC, the credential store, audit, and metering are still yours to assemble — per use case, by hand. You set out to build an agentic feature and end up building a platform without admitting it: a security review stalls the homegrown stack, the credential handling gets a second pass, and the metering you bolted on doesn't match the next project's. The plumbing tax is paid again every time.

Underneath that is a second fear: lock-in — to a closed platform that owns your exit, or a single LLM vendor that owns your roadmap. (This is the framework-vs-platform trade-off in full; see [framework wiring overhead](/platform).) This page is the persona angle on that problem; the [developer hub](/platform) is the technical front door with the ADRs and the services-reference.

## How does Oraclous help developers?

You build on a substrate that already does the hard parts. [ReBAC](/glossary/rebac), the [Credential Broker](/glossary/credential-broker), [provenance](/glossary/provenance-audit), and [metering](/platform/metering) are platform services, not your code to write — so you compose [Capabilities](/glossary/capability) (Tools, Skills, [Agents](/glossary/agent), [Harnesses](/glossary/harness), Human roles) under one descriptor model instead of re-wiring infrastructure. It is open, model-agnostic via [BYOM](/glossary/byom), interoperable through MCP in both directions, and portable through [OHM](/glossary/ohm) — so you build faster and you can still leave.

> **Citable answer — How does Oraclous help developers?** Oraclous makes governance the substrate, not your code: ReBAC, the credential broker, provenance, and metering are platform services. Developers compose Capabilities under one descriptor model instead of re-implementing identity and security per project, interoperate with the MCP ecosystem as both server and client, and stay portable through the open OHM manifest — so there is no platform or model lock-in.

[What is a Capability? →](/glossary/capability) · [What is OHM? →](/glossary/ohm) · [Framework wiring overhead →](/platform)

## How would this work for my team?

Five capabilities carry the builder story, each a deeper page on the platform:

- **[The Harness model](/platform/harness-model)** — platform-as-code, actors-as-harnesses (ADR-003). The *platform* is code, versioned by normal engineering practice; the *actors* are [Harnesses](/glossary/harness) described in OHM. Composition is a Harness referencing other Capabilities — there's no separate workflow concept to wire.
- **[MCP & widgets](/platform/mcp-widgets)** — Oraclous is both an MCP server (it exposes your workspace Capabilities to clients like Claude Desktop, Cursor, and Continue, ReBAC-scoped) and an MCP client (it imports external MCP tools into the [Capability Registry](/glossary/capability-registry) as native OHM tools). MCP both ways, plus embeddable widgets — without bypassing governance.
- **[BYOM](/platform/byom)** — three protocol shapes (Anthropic-native, OpenAI-compatible, Gemini-compatible); the model is a resource the Agent uses, not the Agent itself. Tune cost and quality by config, no rewrite.
- **[Portability](/platform/portability)** — OHM is the canonical export hub and the reference runtime is open. The docs name their own limits plainly (knowledge-graph data goes via standard exports; the ReBAC graph, credentials, and [Consciousness](/glossary/consciousness) records don't travel) — so there are no surprises at exit.
- **[Knowledge graph + retrieval](/platform/knowledge-graph)** — a queryable, provenance-tracked org memory, ReBAC-bounded and traceable to source. The "second mind" actually remembers.

You compose these instead of building them — and because the substrate enforces governance at the Harness level, the security review you used to fail is now reading the platform's enforcement, not your bespoke one.

## How do I know it holds up?

Read the code, the ADRs, and the trade-offs. Oraclous is platform-as-code (ADR-003) — inspectable, forkable, self-hostable — and the [open-source](/open-source) codebase is the proof, not a teaser. The decision record (ADR-003 platform-as-code, ADR-007 BYOM, ADR-008 data sovereignty) documents the reasoning with status, date, and approver, and the services-reference gives one page per service with its layer, port, and responsibilities. Crucially, the [portability docs](/platform/portability) state what portability does *not* carry — honest scoping in writing is a credibility asset, not a liability.

Two honest notes: the gateway's OpenAPI contract and the typed API client are still firming up, so "MCP first-class" is architecture-true with partial demo coverage today; and a frictionless self-host quickstart is a roadmap asset we're building before pushing the self-host story hard. Both are on the roadmap, stated plainly rather than implied as shipped.

## Frequently asked questions

**Q: Is this just another framework?**
A: No. A framework hands you parts and leaves governance, identity, credentials, audit, and metering for you to wire per use case. Oraclous makes those substrate services, enforced at the Harness level, and inverts the unit of work: you compose Capabilities and describe goals, rather than writing agent code per use case.

**Q: Can I self-host?**
A: Yes. Oraclous is platform-as-code (ADR-003) — the substrate is deployed and versioned through normal engineering practice, so it is inspectable, forkable, and self-hostable. Cloud-hosted mode is the option, not the obligation, and your work is portable via OHM if you move between them.

**Q: Does it support MCP?**
A: Both ways. Oraclous is an MCP server — it exposes your workspace Capabilities to clients like Claude Desktop, ReBAC-scoped — and an MCP client — it imports external MCP tools into the Capability Registry as native OHM tools. Inbound adapters also cover SKILL.md and OpenAPI 3.x.

**Q: Can I actually leave?**
A: Yes, and the docs say exactly how far it goes. OHM is the canonical export hub and the reference runtime is open. Portability covers your Harnesses; it does not carry the ReBAC graph, credentials, or Consciousness records, and knowledge-graph data goes via standard exports — stated up front, so there are no exit surprises.

**Q: Is the open source real?**
A: Yes. The platform is open source and platform-as-code — you can read the codebase, the ADRs (with status, date, and approver), and the services-reference before committing. The docs name their own deferred scope and portability limits, which is the point: you verify the claims against the code, not a brochure.

---
**Internal links:** [/glossary/rebac](/glossary/rebac), [/glossary/ohm](/glossary/ohm), [/glossary/capability](/glossary/capability), [/glossary/agent](/glossary/agent), [/glossary/harness](/glossary/harness), [/glossary/byom](/glossary/byom), [/glossary/credential-broker](/glossary/credential-broker), [/glossary/provenance-audit](/glossary/provenance-audit), [/glossary/capability-registry](/glossary/capability-registry), [/glossary/consciousness](/glossary/consciousness) (first-use term links) · capabilities that prove it (internal-linking §2.2): [/platform/harness-model](/platform/harness-model), [/platform/mcp-widgets](/platform/mcp-widgets), [/platform/byom](/platform/byom), [/platform/portability](/platform/portability), [/platform/knowledge-graph](/platform/knowledge-graph), [/platform/metering](/platform/metering) · problem removed: [/platform](/platform) · trust/convert: [/open-source](/open-source), [/developers](/platform), [/pricing](/open-source) · up-link [/solutions](/solutions). "no lock-in / leave" → /platform/portability + /glossary/ohm (§6.7); "self-host / read the code" → /open-source (§6.6). Breadcrumb: Home › Solutions › Developers.
**Notes for build:** `WebPage` + `FAQPage` + `BreadcrumbList` JSON-LD. Most-technical register per voice guide §7 (developer); lead with mechanism, link ADRs/services-reference. Pair with — do not duplicate — the /developers pillar: this is the persona/solution angle, /developers is the technical hub. Keep maturity honest (honesty rule §3.2/§3.5): OpenAPI/api-client firming up, self-host quickstart is roadmap — label as roadmap. No invented metrics. The "60%" figure is the persona's stated pain (positioning/personas), not a measured Oraclous metric — keep it framed as the framework-stack tax, not an Oraclous benchmark.
