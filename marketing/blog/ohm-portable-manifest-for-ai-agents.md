---
title: "OHM: a portable manifest format for AI agents"
slug: ohm-portable-manifest-for-ai-agents
url: /blog/ohm-portable-manifest-for-ai-agents
meta_description: OHM is Oraclous's portable manifest for AI agents — a Harness as YAML plus Markdown. What it carries, where it can travel, and the limits the docs state up front.
primary_query: portable manifest for AI agents
secondary_queries: [what is OHM Oraclous Harness Manifest, export AI agents without lock-in, OHM vs MCP, AI agent manifest format, what does OHM not export]
schema: [Article, Person, FAQPage, BreadcrumbList]
author: "[TBD]"
date_published: "[TBD]"
date_modified: "[TBD]"
category: Open source & portability
reading_time: 8 min
---

# OHM: a portable manifest format for AI agents

Every closed agent platform ships the same hidden clause: the agents you build live in its proprietary constructs, and they do not come out. Sierra's stack, Copilot's M365 estate, a framework's bespoke "crew" classes — the work is shaped to the tool, so leaving means rebuilding. Oraclous answers that with a portable unit. OHM — the Oraclous Harness Manifest — is the canonical, vendor-neutral form of an agentic workflow: one file you own, that an open reference runtime can run. This post explains what OHM carries, where it travels, and — honestly — what it leaves behind.

> **Citable answer — What is OHM?** OHM (Oraclous Harness Manifest) is the serialised, portable form of a Harness — YAML with embedded Markdown, written to a `.ohm.yaml` file. It has a structured zone of machine-validated fields (Actors, capabilities, policy envelope, triggers) and a prose zone of model-interpreted instructions. OHM is the canonical hub every Oraclous portability operation routes through, so a customer can leave without re-implementing their work.

First-use glossary terms: a [Harness](/glossary/harness) is a goal-driven assembly of human and AI [Actors](/glossary/actor) under one policy envelope; [OHM](/glossary/ohm) is its portable manifest form; [Portability](/glossary/portability) is the property that OHM plus the open runtime let you leave without a rewrite; [BYOM](/glossary/byom) is bring-your-own-model; [MCP](/glossary/mcp) is the Model Context Protocol; and [Consciousness](/glossary/consciousness) is a per-Actor learning record. The framing to hold throughout: **OHM is to agent behaviour roughly what MCP is to agent tools** — a portable, vendor-neutral standard that attaches a new idea (a manifest for *what the work is*) to an established one (a protocol for *what the tools are*).

## What does an OHM manifest carry?

A manifest carries the whole Harness, in two zones with two jobs. The **structured zone** is machine-validated YAML: the goal statement, the roster of Actors (humans and Agents alike), the orchestration spec, the triggers that schedule it, a task-board reference, and the policy envelope it runs under. The **prose zone** is model-interpreted Markdown: the instructions an Agent reasons over. The two are bound by one rule — a prose instruction never overrides a structured policy. Code wins. That rule is what makes a manifest safe to move around: the governance travels as enforceable structure, not as a suggestion in text.

Each manifest also carries a content hash — immutable and automatic — and optional semver tags, so a Harness has a verifiable identity and a version history. The result is a single artefact that is at once human-readable, machine-validated, and version-addressable: the unit you describe, the unit Oraclous runs, and the unit you take with you are the same unit. There is no lossy "export" step that flattens a rich runtime object into something less.

### Why a manifest, not an export button?

Because an export button gives you a snapshot; a manifest gives you the work. When the thing you take out is the same governed object the platform ran — goal, Actors, orchestration, triggers, policy envelope — you leave with the behaviour as it was described, not a downgraded copy of it. That is the difference between portability as a checkbox and portability as a property of the architecture.

## Where can OHM travel?

OHM is a hub: everything routes through it, in and out. **Inbound**, three adapters translate external formats into OHM — a Claude Code SKILL.md adapter (SKILL.md becomes OHM skills), an MCP tool adapter (MCP tool definitions become OHM tools), and an OpenAPI 3.x adapter (one OHM tool per operation). **Outbound**, the same hub model lets the work leave in the formats the wider ecosystem speaks: to Claude Desktop and Claude Code SKILLs, over MCP, and as OpenAPI. Because Oraclous is both an [MCP server and an MCP client](/platform/mcp-widgets), the manifest is the common currency on both sides of the connection.

The reference runtime is what makes this more than file shuffling. Oraclous publishes the OHM format *and* an open reference runtime, and locks you into neither — so an exported manifest is not a dead artefact. You can read it, version it, and run it. That combination, the open format plus the open runtime, is what the docs mean by "no vendor lock-in": a manifest you own and a runtime you can read.

> **Citable answer — How is OHM different from MCP?** OHM and MCP solve adjacent problems. MCP (Model Context Protocol) is an open standard for connecting AI systems to tools and context. OHM (Oraclous Harness Manifest) is a portable format for an entire agentic workflow — the goal, the human and AI Actors, the orchestration, and the governing policy. Oraclous imports MCP tools into OHM and exposes OHM capabilities over MCP, so the two compose rather than compete.

## What does OHM *not* carry?

Naming the boundary is the honest part — and the credible one. Per the architecture's portability section, four things do **not** travel inside an OHM export:

- **Knowledge-graph data** — your organisational memory exports through standard formats (Neo4j dumps, RDF, JSON-LD), not through OHM. It is exportable; it just leaves by a different door.
- **The member directory and ReBAC graph** — platform-internal. Your relationship-based access structure is rebuilt in the destination, not serialised out with the manifest.
- **Credentials** — they never leave the credential broker in plaintext, by design. A portable manifest should not, and does not, exfiltrate your secrets.
- **Per-Actor [Consciousness](/glossary/consciousness) records** — substrate-anchored. Exporting a Harness exports its OHM definition, but not the accumulated learning an Actor built up over time.

We put these in writing because the buyers who care most about portability — security and compliance leaders, and open-source evaluators — reward the disclosure and punish the over-claim. "Total portability, zero lock-in, leave with everything" is the sentence that fails a procurement review. "Here is exactly how far it goes, and here are the standard export paths for the rest" is the one that passes.

| What you export | How it travels | Lock-in implication |
|---|---|---|
| Harnesses (goal, Actors, orchestration, triggers, policy) | OHM manifest, runnable on the open reference runtime | None — you own the unit and a runtime to run it |
| Tools and skills | OHM (in), and out via Claude Desktop / SKILLs / MCP / OpenAPI | None — bidirectional adapters through the hub |
| Knowledge-graph data | Standard exports: Neo4j dumps, RDF, JSON-LD | Exportable, separate door — not inside OHM |
| ReBAC graph + member directory | Not serialised — rebuilt in the destination | Platform-internal by design |
| Credentials | Never leave the broker in plaintext | By design — secrets are not exfiltrated |
| Consciousness records | Do not travel | Substrate-anchored; accumulated learning stays |

## Where Oraclous fits

OHM is the centre of the platform's openness story and the reason "no vendor lock-in" is a property rather than a slogan. It is the canonical hub for [Portability](/platform/portability), the bidirectional bridge to the [MCP ecosystem](/platform/mcp-widgets), and the platform-level twin of the freedom that [BYOM](/platform/byom) gives at the model level — swap the model by config, walk away with the manifest. If you want the deeper "why," the same clean separation that makes OHM portable is the subject of [platform-as-code](/blog/platform-as-code-governance-vs-behaviour): OHM is *behaviour*, cleanly separable from the platform that runs it.

Read the [portability story](/platform/portability) for the export paths and the stated limits, the [OHM definition](/glossary/ohm) for the canonical spec, and the [vendor lock-in](/platform/portability) page for why a portable manifest is the buying reason it is.

## Frequently asked questions

**Q: What is OHM?**
A: OHM (Oraclous Harness Manifest) is the serialised, portable form of a Harness — YAML with embedded Markdown in a `.ohm.yaml` file. It has a structured zone of machine-validated fields (Actors, capabilities, policy, triggers) and a prose zone of model-interpreted instructions. OHM is the canonical hub every portability operation routes through.

**Q: How is OHM different from MCP?**
A: MCP is an open protocol for connecting AI systems to tools and context; OHM is a portable format for a whole agentic workflow — goal, Actors, orchestration, and policy. They compose: Oraclous imports MCP tools into OHM and exposes OHM capabilities over MCP. OHM is to behaviour what MCP is to tools.

**Q: What does OHM not export?**
A: Four things stay behind by design: knowledge-graph data (it exports via Neo4j/RDF/JSON-LD instead), the member directory and ReBAC graph (platform-internal), credentials (they never leave the broker in plaintext), and per-Actor Consciousness records (substrate-anchored). The docs state this plainly so there are no exit surprises.

**Q: Can I run an OHM manifest outside Oraclous?**
A: Yes — that is the point of an open reference runtime. Oraclous publishes both the OHM format and a reference runtime and locks you into neither, so an exported manifest is not a dead file. You can read it, version it by content hash and semver, and run it on the open runtime.

**Q: Does using OHM avoid vendor lock-in?**
A: It avoids lock-in for the work itself. Your Harnesses are portable through the open manifest and runnable on the open runtime, so you can leave and re-run them. It does not mean every artefact travels — credentials, the ReBAC graph, and Consciousness records stay behind, and knowledge-graph data exports through standard formats. The boundary is documented, not hidden.

---
**Internal links:** [/glossary/ohm](/glossary/ohm) (first-use · primary definition), [/glossary/harness](/glossary/harness), [/glossary/actor](/glossary/actor), [/glossary/portability](/glossary/portability), [/glossary/byom](/glossary/byom), [/glossary/mcp](/glossary/mcp), [/glossary/consciousness](/glossary/consciousness); supporting pillars/capabilities: [/platform/portability](/platform/portability), [/platform/mcp-widgets](/platform/mcp-widgets), [/platform/byom](/platform/byom); Why-Oraclous: [/platform/portability](/platform/portability); related articles: [/blog/platform-as-code-governance-vs-behaviour](/blog/platform-as-code-governance-vs-behaviour), [/blog/human-in-the-loop-first-class-primitive](/blog/human-in-the-loop-first-class-primitive); up-link [/blog](/blog). Per internal-linking §6.7, "no lock-in / OHM export" funnels to /platform/portability and /glossary/ohm.
**Notes for build:** `Article` + `Person` (author `[TBD]`) + `FAQPage` + `BreadcrumbList` JSON-LD; breadcrumb Home › Blog › OHM: a portable manifest format for AI agents. Source grounding: Platform Architecture §7 (OHM canonical hub; MCP server + client; inbound adapters SKILL.md/MCP/OpenAPI 3.x; the four "does NOT cover" items; open reference runtime), §2 (structured/prose zones, "prose never overrides structured policy"), glossary OHM/Manifest/Portability/Consciousness/MCP. The proprietary-to-established pairing (OHM↔MCP) is mandatory per keyword-entity-map §3 and internal-linking §7. Honesty: the "what OHM does NOT carry" H2 + table are load-bearing for credibility — keep prominent, not fine print (voice-and-tone §2.2/§3). Tables are the featured-snippet/citability asset (geo-citability §3). No invented metrics/customers; competitor mentions (Sierra/Copilot) stay fair per blog template + competitive-landscape §7.
