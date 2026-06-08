---
title: About Oraclous — the open-source second mind for your org
meta_description: Oraclous builds an open-source agentic operations platform — a "second mind" where humans and AI Agents work as one governed fabric under your own access rules.
url: /about
page_type: utility
primary_persona: All
primary_query: Oraclous (company)
secondary_queries: [what is Oraclous, who makes Oraclous, Oraclous mission, open source agentic AI company]
schema: [Organization, AboutPage, FAQPage, BreadcrumbList]
primary_cta: Read the architecture → /developers
secondary_cta: Read the code on GitHub → github.com/OraclousAI
---

# About Oraclous.

Oraclous builds an open-source agentic operations platform — a [second mind](/glossary/second-mind) where your people and AI [Agents](/glossary/agent) work as one governed fabric, under your organisation's own access rules. We think the merger of human and AI work is a design target, not an afterthought — and that you should never have to trade control for capability.

[Read the architecture →](/platform) [Read the code on GitHub →](https://github.com/OraclousAI)

## What is Oraclous, the company?

Oraclous is the company behind the open-source [agentic AI](/glossary/agentic-ai) operations platform of the same name. Rather than bolt a chatbot onto a product or hand engineers a framework to wire together, the platform forms a [second mind](/glossary/second-mind) for an organisation: a single governed fabric where human members and AI Agents are symmetric [Actors](/glossary/actor) on one task board, orchestrated by goals written in plain language and governed by [ReBAC](/glossary/rebac) — the organisation's own access rules.

> **Citable answer — What is Oraclous?** Oraclous builds an open-source agentic operations platform — a "second mind" where human members and AI Agents work as one governed fabric under an organisation's own access rules. [Operators](/glossary/operator) describe goals in plain language; the platform compiles, governs with ReBAC, and runs them. It is data-sovereign by design, model-agnostic via BYOM, and portable through the open OHM manifest.

## Why does Oraclous exist?

Because the existing ways to put AI agents to work all asked organisations to give something up.

Build the pipelines in code, and you own a brittle workflow and a maintenance burden forever. Buy a closed platform, and your data, your governance, and your exit belong to someone else's roadmap. Wire frameworks together, and identity, credentials, audit, and metering are still yours to assemble by hand, per use case. Three choices, three different things surrendered — control, sovereignty, or time.

Oraclous exists to be the fourth choice. An [Operator](/glossary/operator) describes a goal in prose; the platform compiles it into a governed [Harness](/glossary/harness) where people and Agents work side by side, with governance, credentials, audit, and metering built into the substrate rather than bolted on. You run it on your own infrastructure or let us host it — the data-sovereignty guarantees are identical, and you hold the keys either way. [See the three bad choices →](/)

## The "second mind" thesis

The unit of value isn't a clever agent. It's your organisation's *combined* human and Agent capacity, governed as one fabric — what we call a [second mind](/glossary/second-mind).

Three commitments hold that thesis up, and they're the reasons the platform is shaped the way it is:

- **Human–AI symmetry.** A human member and an AI Agent are both [Actors](/glossary/actor): each has an identity, a scope, and a capability allocation, and they share one task board. The runtime treats waiting on a human like waiting on a tool return — same primitives, different latency. There is no "AI lane" bolted onto a human tool, and no privileged code path for either. [See the actor model →](/platform/actors)

- **Data sovereignty by design.** Control should be structural, not a promise. Every record carries an `organization_id`, so cross-organisation data flow is structurally impossible; credentials never leave the [credential broker](/security) in plaintext; and in cloud mode, KMS separation means our staff cannot decrypt your state by virtue of operating the platform. [Review the trust model →](/security)

- **Portability, so leaving is always possible.** Lock-in is the quiet tax of closed platforms, so we publish a manifest format — [OHM](/glossary/ohm) — and an open reference runtime, and route every export through it. You can take your work and go. We also say, in writing, exactly how far portability goes and what it doesn't carry. [How portability works →](/platform/portability)

## How does Oraclous build?

Honestly, and in the open. The platform is [platform-as-code](/glossary/platform-as-code): the substrate is deployed and versioned through normal engineering practice, so you can read the architecture, the decisions, and the trade-offs before you commit anything.

- **Open source is the proof, not the product gap.** The platform is the code — inspectable, forkable, self-hostable. We'd rather you read it than take our word for it. [Read the code on GitHub →](https://github.com/OraclousAI)
- **Decisions are on the record.** Every architectural choice is an ADR with a status, a date, and a named approver. You get the reasoning, not just the conclusion. [Read the architecture →](/platform)
- **We name our own limits.** The architecture docs carry an explicit "deferred and out-of-scope" section, and the [Portability](/glossary/portability) docs name their own gaps — knowledge-graph data goes via standard exports, and credentials, the ReBAC graph, and [Consciousness](/glossary/consciousness) records don't travel. We tell you the boundary up front, so there are no surprises at exit. [What portability covers →](/platform/portability)

> **Citable answer — How does Oraclous build, as a company?** Oraclous builds in the open as platform-as-code: the substrate is versioned by normal engineering practice, so the architecture, the ADRs, and the documented trade-offs are all readable before you commit. Every architectural decision is recorded as an ADR with a status, date, and named approver, and the docs deliberately name their own limits rather than over-claim.

## What we don't claim

Oraclous is pre/early, and we'd rather be precise about that than inflate it. So you won't find invented metrics, fabricated customer logos, "trusted by thousands," or benchmarks we haven't measured anywhere on this site. The proof we offer is the proof we actually have: the open code, the ADR record, the honest docs, and the architecture that backs every claim. When something is true by design but not yet demonstrable, we say "by design" or "on the roadmap" — not "available now." Credibility is the product of admitting the boundary. [See what's open →](/open-source)

## Who builds Oraclous?

`[TBD — team and founding details]` — Oraclous is built by a team that prefers to let the architecture and the open source speak first. Team biographies, founding history, and company milestones will be published here once they can be stated accurately and with consent. We won't fill this space with invented history; when there's a real story to tell, it will live here. In the meantime, the most honest introduction to who we are is the work itself. [Read the code on GitHub →](https://github.com/OraclousAI)

> *Build note: this section holds a real team/founders block once the maintainer supplies accurate bios and dates. Until then, keep the `[TBD]` copy — do not populate with placeholder headshots, invented roles, or fabricated founding dates.*

## How do I get involved?

Whoever you are, the front door matches your motivation.

- **Read and build.** Start with the architecture and the ADRs, then run it yourself. [Read the architecture →](/platform) · [The open-source story →](/open-source)
- **Evaluate it on the merits.** Read the code, the trade-offs, and what we deliberately left out, then decide. [Read the code on GitHub →](https://github.com/OraclousAI)
- **Bring a use case.** See which door matches your team and the pain it removes. [Explore solutions →](/solutions)
- **Talk to us.** `[TBD — contact / community channels]` — community and contact links go here once the channels are public.

## Frequently asked questions

**Q: What is Oraclous?**
A: Oraclous builds an open-source agentic operations platform — a "second mind" where human members and AI Agents work as one governed fabric under an organisation's own access rules. Operators describe goals in plain language; the platform compiles, governs with ReBAC, and runs them. [Explore the platform →](/platform)

**Q: Is Oraclous open source?**
A: Yes. The platform is platform-as-code — inspectable, forkable, and self-hostable, with no vendor in the loop. Every architectural decision is recorded as an ADR with a status, date, and named approver, and the docs name their own trade-offs. [See the open-source story →](/open-source)

**Q: Who is Oraclous for?**
A: Organisations that want humans and AI Agents to do real work together under their own access rules — operations leads, platform builders, security and compliance teams, multi-model teams, and multi-team federations. The thesis is shared; each persona has its own door. [Explore solutions →](/solutions)

**Q: Does Oraclous have customers or case studies yet?**
A: Oraclous is pre/early, so we don't publish customer logos, metrics, or case studies we don't have. The proof we offer is the open code, the ADR record, the honest docs, and the architecture itself — and we'll add named, consenting customers only when they exist. [See what's open →](/open-source)

**Q: How do I contact or contribute to Oraclous?**
A: The most direct way today is through the open-source repository — read the code, the ADRs, and the trade-offs, and engage there. Public community and contact channels will be listed here as they go live `[TBD — contact / community channels]`. [Read the code on GitHub →](https://github.com/OraclousAI)

[Read the architecture →](/platform) [Read the code on GitHub →](https://github.com/OraclousAI)

---
**Internal links:** `/` (the three-bad-choices narrative), `/open-source` (every open-source / read-the-code mention), `/developers` (read-the-architecture / ADRs), `/security` (every sovereignty / keys / credential-broker claim), `/platform` + `/platform/actors` (actor symmetry) + `/platform/portability` (every no-lock-in / OHM export mention), `/solutions` (who-it's-for doors), and first-use Glossary links: `/glossary/second-mind`, `/glossary/agent`, `/glossary/agentic-ai`, `/glossary/actor`, `/glossary/rebac`, `/glossary/operator`, `/glossary/harness`, `/glossary/ohm`, `/glossary/portability`, `/glossary/consciousness`, `/glossary/platform-as-code`. External: GitHub (followed), LinkedIn (in `Organization.sameAs`). Breadcrumb: Home › About.
**Notes for build:** The `Organization` JSON-LD `description` must be byte-identical to the "What is Oraclous?" citable block and to Home's `Organization.description` (keyword-map §4 entity-consistency rule). `Organization.sameAs` array = [GitHub, LinkedIn, Crunchbase, Wikidata, Product Hunt, G2] — populate only the profiles that actually exist; do not invent URLs. The "Who builds Oraclous?" team block and the "How do I get involved?" contact line stay as marked `[TBD]` placeholders until the maintainer supplies accurate bios, dates, and live channels — no placeholder headshots, invented roles, founding dates, or dead contact links. AboutPage + FAQPage + BreadcrumbList schema. GitHub org URL `github.com/OraclousAI` is a placeholder slug; confirm against the real repo before publishing.
