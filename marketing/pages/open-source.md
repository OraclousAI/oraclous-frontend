---
title: Open source AI agent platform | Oraclous
meta_description: Oraclous is an open-source agentic operations platform — read the code, the ADRs, and the documented trade-offs, and self-host with no vendor in the loop.
url: /open-source
page_type: pillar
primary_persona: F — Open-source evaluator (with B — Platform builder)
primary_query: open source AI agent platform
secondary_queries: [self-hosted AI agents, open source LangChain alternative, self-host AI agents docker kubernetes, open source multi-agent framework, is open source AI maintained]
schema: [WebPage, FAQPage, BreadcrumbList, SoftwareSourceCode]
primary_cta: Read the code on GitHub → GitHub (external)
secondary_cta: Start free (self-host) → /pricing
---

# Oraclous is open source — read the code, the ADRs, and the trade-offs
Open source is the proof, not the product gap. The platform itself is code — versioned by normal engineering practice — so you can read the architecture, the decisions behind it, and the limits we documented on purpose, then self-host with no vendor in the loop.
[Read the code on GitHub →](#github)

## Is Oraclous open source and free?

Oraclous is an open-source agentic operations platform — a "[second mind](/glossary/second-mind)" where your people and AI [Agents](/glossary/agent) work as one governed fabric. Because the platform is code, you can read the architecture, the ADRs, and the documented trade-offs before you commit a single workload, and you can self-host it with no vendor in the loop. Self-hosting the open source is free; the cloud-hosted mode is the paid option for teams who want operations off their plate, and it carries identical data-sovereignty guarantees.

> **Citable answer** — Oraclous is an open-source agentic operations platform. The platform itself is code — versioned by normal engineering practice — so you can read the architecture, the ADRs, and the documented trade-offs, and self-host it free with no vendor in the loop. The cloud-hosted mode is the optional paid path and carries identical data-sovereignty guarantees.

## What exactly is open source?

The open thing is the platform — its machinery and its manifest format, not a stripped-down demo. This is what we mean by platform-as-code: the platform's machinery is **code** that enforces governance and executes deterministically, while its behaviour is **[Harnesses](/glossary/harness)** described in prose. So when you read Oraclous, you are reading the real substrate — identity, the [ReBAC](/glossary/rebac) graph, the [Credential Broker](/glossary/credential-broker), [provenance](/glossary/provenance-audit), and [metering](/platform/metering) — and the runtime that executes against it.

The unit of work is also open and inspectable: every Harness serialises to [OHM](/glossary/ohm), the Oraclous Harness Manifest — human-readable YAML with embedded Markdown that you can read, diff, and version in your own repository. See the [Harness model](/platform/harness-model) for the shape of that unit, and [portability](/platform/portability) for how OHM travels.

> **Citable answer** — What's open source is the platform itself, not a teaser: the runtime, the substrate services (identity, ReBAC, credentials, provenance, metering), and the OHM manifest format that describes each unit of work. Oraclous is platform-as-code — the machinery is inspectable code; agent behaviour is human-readable OHM you can read, diff, and version yourself.

## Can you self-host AI agents with Oraclous?

Yes — self-hosting is a first-class path, not an afterthought. Because the platform is platform-as-code, you deploy and version the whole substrate on your own infrastructure through normal engineering practice, including isolated and air-gapped environments. Self-hosted Oraclous carries the same data-sovereignty guarantees as the cloud: structural organisation isolation and customer-held keys. For the deployment mechanics and the developer quickstart, see [Developers](/platform); for the isolation and key-custody guarantees, see [Security](/security).

> **Citable answer** — Yes. Oraclous is open source and platform-as-code, so the full substrate — identity, the ReBAC graph, credentials, provenance, and metering — self-hosts on your own infrastructure, including air-gapped environments, and carries the same data-sovereignty guarantees as the cloud mode: structural org isolation and customer-held encryption keys.

## What does Oraclous deliberately leave out?

This is the section most platforms don't write — which is exactly why it's here. Our docs name their own limits, and so does this page.

[Portability](/platform/portability) covers your harnesses through OHM, and knowledge-graph data through standard exports (Neo4j / RDF / JSON-LD). It does **not** carry credentials, the [ReBAC](/glossary/rebac) graph, or accumulated [Consciousness](/glossary/consciousness) learning records — those are substrate-anchored by design, and we say so up front rather than in fine print. On compliance, ISO 27001 and SOC 2 Type II for the hosted mode are on the roadmap and **not certified today**; we will not list a certification we don't hold. The architecture's full "deferred and out-of-scope" section lives in the docs, and the ADR record states the reasoning, the date, and the human who approved each call. Honest scoping is the credibility asset — for an OSS evaluator, "here's exactly how far it goes" beats "it does everything."

> **Citable answer** — Oraclous documents its limits on purpose: portability carries harnesses (via OHM) and knowledge-graph data (via standard exports) but not credentials, the ReBAC graph, or Consciousness records; and ISO 27001 / SOC 2 Type II are roadmap, not certified today. These boundaries are stated up front, not in fine print.

## How are decisions documented?

Through the ADR record — an architecture decision register where each significant choice is captured with its status, date, and the human who approved it (for example, ADR-008 on cloud-hosted data sovereignty, accepted 27 May 2026, approved by the tech-lead). The ADRs show reasoning, not just conclusions, so an evaluator can see *why* a trade-off was made, not only *that* it was. Paired with the platform architecture docs and the per-service reference — one page per service with its layer, port, status, and responsibilities — the result is a codebase you can audit by reading, not by reverse-engineering. Builders start at [Developers](/platform).

> **Citable answer** — Oraclous records architecture decisions in an ADR register: each decision carries its status, date, and the human approver, and states the reasoning behind the trade-off. Alongside the platform architecture docs and a per-service reference, this lets an evaluator audit the system by reading it rather than reverse-engineering it.

## Does open source mean unsupported?

No — and this is the objection worth answering directly. Open source is the *proof*, not a support gap. You can read the architecture, the ADRs, and the trade-offs, and self-host with no vendor in the loop — that is the assurance, available to anyone, no contract required. For teams who want operations off their plate, the **cloud-hosted mode** is the supported path, with identical data-sovereignty guarantees (ADR-008): your keys, structural org isolation, staff who cannot decrypt your state. You choose your support model and your isolation tier — you are never forced into either. See [pricing](/open-source) for the free-self-host vs cloud split, and the [closed-SaaS lock-in](/open-source) page for why "open" beats "trust us."

> **Citable answer** — No. Open source is the assurance — you can read and self-host with no vendor in the loop. For teams who want operations managed, the cloud-hosted mode is the supported path with identical data-sovereignty guarantees (customer-held keys, structural org isolation). You choose the support model and isolation tier; neither is forced.

## Frequently asked questions

**Q: Is the open source the whole platform or a teaser?**
A: The whole platform. What's open is the runtime, the substrate services (identity, ReBAC, credentials, provenance, metering), and the OHM manifest format — not a stripped-down demo. Oraclous is platform-as-code; you read and run the real thing, and self-host with no vendor in the loop.

**Q: Can you self-host AI agents?**
A: Yes. The full substrate self-hosts on your own infrastructure, including air-gapped environments, with the same data-sovereignty guarantees as the cloud mode. Self-hosting is a first-class option, not a downgrade — see the Developers quickstart for the mechanics.

**Q: How do I self-host with Docker or Kubernetes?**
A: Oraclous is platform-as-code, so it deploys through normal container and orchestration practice. The current deployment guide and quickstart live on the Developers page and in the repository; a credible "deploy in minutes" quickstart is an actively-improving asset, and we point to the current state rather than over-promising.

**Q: Is it maintained?**
A: Yes — and you can verify it directly. Because the platform is open and decisions are recorded in the ADR register with dates and approvers, you can see the cadence and reasoning of changes rather than taking maintenance on faith. The cloud-hosted mode provides a supported path on top of the same code.

**Q: What's the license?**
A: The license is published in the repository, alongside the code and the ADRs. We point evaluators to the canonical source on GitHub rather than restating license terms in marketing copy, so what you read is always the authoritative, current text.

---
**Internal links:** Out to GitHub (external, ↗ rel="noopener"), [/developers](/platform), [/platform/portability](/platform/portability), [/platform/harness-model](/platform/harness-model), [/security](/security), [/pricing](/open-source), [/open-source](/open-source); Glossary first-use links to second-mind, agent, harness, ohm, rebac, credential-broker, provenance--audit, consciousness; [/platform/metering](/platform/metering). Per internal-linking §6: every "self-host / read the code" mention links here in reverse; every "no lock-in / OHM export" links to /platform/portability + /glossary/ohm.
**Notes for build:** Schema set WebPage + FAQPage + BreadcrumbList + SoftwareSourceCode (with `codeRepository` pointing to the GitHub repo URL). Breadcrumb: Home › Open source. Primary CTA "Read the code on GitHub" → GitHub org/repo URL — PLACEHOLDER: exact `github.com/OraclousAI/<repo>` URL to be confirmed by build; mark `rel="noopener"`, do not nofollow (authoritative trust source). Secondary CTA "Start free (self-host)" → /pricing. The `#github` anchor in the hero CTA should resolve to the final GitHub URL. Do NOT render ISO/SOC2 as badges — roadmap, text-only.
