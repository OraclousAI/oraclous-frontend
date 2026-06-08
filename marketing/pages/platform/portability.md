---
title: Portability — leave without a rewrite, and we say how far
meta_description: Oraclous Portability routes every export through OHM, the open manifest, with an open reference runtime — no vendor lock-in. The docs state exactly what travels and what doesn't.
url: /platform/portability
diagram: portability-hub
page_type: cluster
primary_persona: Security & compliance leader
primary_query: AI agent platform no vendor lock-in
schema: [BreadcrumbList, FAQPage, TechArticle]
secondary_queries: [OHM open manifest export, export AI agents to Claude Desktop MCP, what portability does not cover, leave AI platform without rewrite]
primary_cta: Read portability docs → /developers
secondary_cta: Review the trust model → /security
---

# Portability — leave without a rewrite, and we say how far

[Portability](/glossary/portability) is the property that [OHM](/glossary/ohm) — the open Oraclous Harness Manifest — and an open reference runtime let you leave without re-implementing your work. There's no lock-in. And, because honest scope is a feature, the docs name exactly what portability carries and what it doesn't.

[Read portability docs →](/platform) [Review the trust model →](/security)

> *Hero visual (build note): OHM as a central hub with outbound spokes labelled Claude Desktop, Claude Code SKILLs, MCP, OpenAPI — and a separate, clearly-labelled "stays behind" set (knowledge-graph data via Neo4j/RDF/JSON-LD exports, ReBAC graph, credentials, Consciousness records). Honesty drawn into the diagram, not hidden.*

## Can I leave without a rewrite?

Yes — your [Harnesses](/glossary/harness) are portable through [OHM](/glossary/ohm), the canonical hub every portability operation routes through. Oraclous publishes both the manifest format and a reference runtime, and locks you into neither: every inbound translation produces OHM, every outbound translation starts from OHM, and the reference runtime is open, so the manifest you export is something you can actually run. That's what "no vendor lock-in" means here — not a marketing promise, but a manifest you own and a runtime you can read.

> **Citable answer — Can I leave Oraclous without a rewrite?** Yes. Oraclous routes every portability operation through OHM, the open Oraclous Harness Manifest, and publishes an open reference runtime — so your Harnesses are exportable and runnable without re-implementation. The docs also state plainly what portability does not carry: knowledge-graph data exports via Neo4j/RDF/JSON-LD, and credentials, the ReBAC graph, and Consciousness records do not travel.

[What is OHM? →](/glossary/ohm) · [What is Portability? →](/glossary/portability)

## How does portability work?

OHM is the hub; everything routes through it. **Inbound**, three adapters translate external formats into OHM: a Claude Code SKILL.md adapter (SKILL.md → OHM skills), an MCP tool adapter (MCP tool definitions → OHM tools), and an OpenAPI 3.x adapter (one OHM tool per operation). **Outbound**, the same hub model means your work can leave in the formats the wider ecosystem speaks — to Claude Desktop and Claude Code SKILLs, over MCP, and as OpenAPI — because the manifest is the common currency on both sides. Pair this with the open reference runtime and an exported OHM isn't a dead artefact; it runs.

This is why portability is more than an export button. The unit you take with you — the OHM manifest — is the same governed unit Oraclous ran: a goal statement, an actor roster, an orchestration spec, triggers, and a policy envelope. You leave with the work as it was described, not a lossy snapshot of it.

## What does portability *not* cover?

Naming the boundary is the honest part, and the credible one. Per the architecture's portability section, four things do **not** travel with an OHM export:

- **Knowledge-graph data** — your organisational memory is handled through standard export formats (Neo4j dumps, RDF, JSON-LD), not through OHM. It's exportable; it just leaves by a different door.
- **The member directory and ReBAC graph** — platform-internal. Your relationship-based access structure is rebuilt in the destination, not serialised out.
- **Credentials** — they never leave the [Credential Broker](/glossary/credential-broker) in plaintext, by design. Portability does not, and should not, exfiltrate your secrets.
- **Per-Actor [Consciousness](/glossary/consciousness) records** — substrate-anchored. Exporting a Harness exports its OHM definition, but not the accumulated learning an Actor built up over time.

We state these in writing because a [security or compliance leader](/solutions/regulated) and an OSS evaluator both reward the disclosure and punish the over-claim. "Total portability, zero lock-in, leave with everything" is the sentence that fails a procurement review. "Here is exactly how far it goes" is the one that passes.

## Why does portability matter?

Lock-in is the quiet cost of every closed agent platform: your data, your governance, and your exit belong to someone else's roadmap, and the day you want to leave you discover the door was never built. Oraclous builds the door first and labels it. For [regulated and security teams](/solutions/regulated), portability plus stated limits is an auditable exit story — no surprises at the boundary. For [multi-model teams](/solutions/multi-model), it's the platform-level twin of the model freedom that [BYOM](/platform/byom) gives at the model level.

Portability completes the openness triangle. With [BYOM](/platform/byom) the model is yours to swap and [MCP & widgets](/platform/mcp-widgets) keeps you connected to the broader tool ecosystem both ways, Portability ensures the platform itself is something you can walk away from — manifest in hand.

## Frequently asked questions

**Q: What is OHM?**
A: OHM (Oraclous Harness Manifest) is the serialised, portable form of a Harness — YAML with embedded Markdown, written to `.ohm.yaml`. It has a structured zone of machine-validated fields and a prose zone of model-interpreted instructions, and it's the canonical hub every portability operation routes through, so you can leave without re-implementing.

**Q: What does portability not cover?**
A: Four things don't travel in an OHM export: knowledge-graph data (handled via Neo4j/RDF/JSON-LD exports instead), the member directory and ReBAC graph (platform-internal), credentials (they never leave the broker in plaintext), and per-Actor Consciousness records (substrate-anchored). The docs state this plainly so there are no exit surprises.

**Q: How do I export my work?**
A: Through OHM, the canonical hub. Your Harnesses serialise to OHM manifests, which the open reference runtime can run, and outbound paths reach Claude Desktop, Claude Code SKILLs, MCP, and OpenAPI. Knowledge-graph data exports separately via standard formats (Neo4j dumps, RDF, JSON-LD).

**Q: Does "no vendor lock-in" really mean no lock-in?**
A: It means your Harnesses are portable through the open OHM manifest and runnable on the open reference runtime — you can leave and re-run your work elsewhere. It does not mean every artefact travels: credentials, the ReBAC graph, and Consciousness records stay behind by design, and knowledge-graph data exports through standard formats. The boundary is documented, not hidden.

---
**Internal links:** [/glossary/ohm](/glossary/ohm) (first-use term · primary definition), [/glossary/portability](/glossary/portability) (first-use term · primary definition), [/glossary/harness](/glossary/harness), [/glossary/consciousness](/glossary/consciousness), [/glossary/credential-broker](/glossary/credential-broker); Solutions: [/solutions/regulated](/solutions/regulated), [/solutions/multi-model](/solutions/multi-model); sibling capabilities (openness/interop triangle, internal-linking §2.1): [/platform/byom](/platform/byom), [/platform/mcp-widgets](/platform/mcp-widgets); up-link [/platform](/platform); "no lock-in / OHM export" → this page is the canonical target (internal-linking §6.7) so it links out to [/glossary/ohm](/glossary/ohm); control/sovereignty (credentials never leave broker) → [/security](/security) per §6.5; "open reference runtime / read the code" → [/open-source](/open-source) + [/developers](/platform).
**Notes for build:** `TechArticle` + `FAQPage` + `BreadcrumbList` JSON-LD; breadcrumb Home › Platform › Portability. Link `/glossary/ohm` and `/glossary/portability` (DefinedTerm) rather than restating canonical definitions as schema. Source: §7 portability story (OHM canonical hub, MCP server/client, inbound adapters SKILL.md/MCP/OpenAPI 3.x, the four "does NOT cover" items), glossary OHM/Portability/Consciousness, voice-and-tone §2.2 + §3 (name the trade-off; honesty rule). The "what portability does NOT cover" H2 is load-bearing for credibility — keep it prominent, not in fine print. Honesty is the conversion asset here.
