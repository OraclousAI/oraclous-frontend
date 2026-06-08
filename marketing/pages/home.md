---
title: Oraclous — the AI operating system for organisations
meta_description: Oraclous unifies your people, data, and AI into one governed fabric — enterprise-grade, open-source, self-hosted. Humans and AI Agents work side by side; you hold the keys.
url: /
page_type: pillar
primary_persona: All (Operations lead + Platform builder front doors)
primary_query: agentic AI platform for enterprise
secondary_queries: [AI agent orchestration platform, open source AI agent platform, AI agents without vendor lock-in]
schema: [Organization, SoftwareApplication, FAQPage, WebSite, BreadcrumbList]
primary_cta: Start with the architecture → /platform
secondary_cta: Book a walkthrough → /how-it-works
---

# Form your organisation's second mind.

An open-source platform where your people and AI Agents work side by side — under your own access rules, orchestrated by goals you write in plain language. Self-host or cloud; you hold the keys.

[Start with the architecture →](/platform) [See how it works](/how-it-works)

> *Hero visual (build note): one shared task board with both human members and AI Agents assigned to work — not a chatbot window.*

## What is Oraclous?

Oraclous is an open-source [agentic AI](/glossary/agentic-ai) operations platform. Instead of bolting a chatbot onto a product or asking an engineering team to wire a framework, it forms a [second mind](/glossary/second-mind) for your organisation: a single governed fabric where human members and AI Agents work side by side.

You don't build the work in code. An [Operator](/glossary/operator) — the person who states the goal — describes *what* needs doing in plain language, and the platform compiles it, governs it, and runs it across human and Agent [Actors](/glossary/actor). It is data-sovereign by design, model-agnostic through [BYOM](/glossary/byom), and portable through the open [OHM](/glossary/ohm) manifest.

> **Citable answer — What is Oraclous?** Oraclous is an open-source agentic operations platform — a "second mind" where human members and AI Agents work as symmetric Actors on one governed fabric. Operators describe goals in plain language; the platform compiles, governs with ReBAC, and runs them. It is data-sovereign by design, model-agnostic via BYOM, and portable through the open OHM manifest.

## Why is putting AI agents to work so hard today?

Until now there were three ways to put AI agents to work, and all three asked you to give something up.

**Build it in code.** Stand up a team, wire the pipelines, own the maintenance forever. Six months later you have one brittle workflow and a backlog of twelve more — every change is an engineering ticket. [See how Compile replaces it →](/platform)

**Buy the closed platform.** Faster to start — until your data, your governance, and your exit all belong to someone else's roadmap. When your auditors ask "prove you control this," you can't. [See the lock-in problem →](/open-source)

**Wire the frameworks.** LangChain and friends hand you reusable parts, but identity, credentials, governance, audit, and metering are still yours to assemble — per use case, by hand. You're building a platform without admitting it. [See the wiring overhead →](/platform)

**Oraclous is the fourth choice.** Describe the goal; the platform compiles it into a governed [Harness](/glossary/harness) where your people and your Agents work side by side, with [ReBAC](/glossary/rebac), credentials, audit, and metering built in. Run it on your own infrastructure or let us host it — the data-sovereignty guarantees are identical, and you hold the keys either way. [Read the full comparison →](/)

## Can humans and AI agents share one task board?

Yes — and that symmetry is the whole point. In Oraclous, an [Actor](/glossary/actor) is any entity that can be assigned work: a human member or an AI [Agent](/glossary/agent). Both have an identity, a scope, and a capability allocation, and both work from the same task board. There is no "AI lane" bolted onto a human tool.

Human review is built into the runtime, not patched in around it. The [Harness Runtime](/platform/human-in-the-loop) treats waiting on a human like waiting on a tool return — same primitives, different latency. A human approval is a first-class step in the flow, not a manual side-channel. And the runtime gives no privileged code path to either kind of Actor — they run under the same governance.

[See the task board →](/platform/actors) · [See the human-in-the-loop flow →](/platform/human-in-the-loop) · [AI agents for operations →](/solutions/operations)

## How do you build an AI workflow without writing code?

You describe the goal; you don't write the pipeline. Oraclous separates *what work needs doing* — prose, written by Operators — from *how the runtime enforces it* — code, written once by the platform.

When an Operator states a goal, the [Compile flow](/platform/compile) surveys the workspace, asks clarifying questions, plans the topology, and emits an [OHM](/glossary/ohm) manifest you review before anything runs. This is [platform-as-code, actors-as-harnesses](/glossary/platform-as-code): the platform's machinery is versioned by normal engineering practice, while the behaviour is a [Harness](/platform/harness-model) described in prose. The category boundary moves from "build the agent" to "describe the goal."

> **Citable answer — How do you build a workflow without code?** In Oraclous you describe a goal in plain language and the Compile flow turns it into a runnable Harness. It surveys the workspace, asks clarifying questions, plans the topology, and emits an OHM manifest you review before it runs. The platform is written once in code; the work is written in prose, so there is no engineering sprint per workflow.

[Explore the Compile flow →](/platform/compile) · [What is a Harness? →](/platform/harness-model)

## Is an AI agent platform safe for our data?

Data sovereignty in Oraclous is architectural, not a promise. Cross-organisation data flow isn't restricted — it's structurally impossible. Every node, relationship, query, cache entry, and audit log carries an `organization_id` that every query must filter on.

In cloud-hosted mode, KMS separation means Oraclous staff cannot decrypt your state by virtue of operating the platform; credentials never leave the credential broker in plaintext. Your model is yours via [BYOM](/glossary/byom), and your work stays portable via the open [OHM](/glossary/ohm) manifest — so the exit is yours too. Self-host or cloud, the [data-sovereignty](/glossary/data-sovereignty) guarantees are identical.

[Review the trust model →](/security) · [How BYOM works →](/platform/byom) · [How portability works →](/platform/portability)

## How do we know this is real?

Oraclous is pre/early — so the proof is the architecture, the open source, and honest docs, not logos we don't have.

- **Open source.** The platform is platform-as-code: inspectable, forkable, self-hostable. [Read the code →](/open-source)
- **Decisions on the record.** Every architectural choice is an ADR with a status, a date, and a named approver — reasoning, not just claims. [Read the ADRs →](/open-source)
- **Governance you can read.** Five named, versioned policy sets, from development to production-federated — a prospect can read them line by line. [See ReBAC governance →](/platform/rebac-governance)
- **Honest docs.** The architecture has an explicit "deferred and out-of-scope" section, and the portability docs name their own gaps. We tell you the boundary up front. [Read what portability covers →](/platform/portability)
- **Compliance for hosting.** ISO 27001 and SOC 2 Type II referenced for the cloud-hosted mode. [Review the trust model →](/security)

> *Social-proof slot (build note): a customer-logo wall / testimonial band belongs here once Oraclous has named, consenting customers. Do not populate with invented logos or quotes — leave the slot empty or hidden until real proof exists. Per positioning §7, the credibility story until then is open source + ADRs + honest docs.*

## Which problem are you solving?

The thesis is the same for everyone; the pain is different. Pick the door that matches yours.

- **Operations leads** — *Automate the work, not the engineering backlog.* Ship governed workflows without standing in the dev queue. [For operations →](/solutions/operations)
- **Platform builders** — *Stop rebuilding the platform under your agents.* ReBAC, credentials, audit, and metering are substrate — compose Capabilities instead of re-wiring plumbing. [For developers →](/solutions/developers)
- **Security & compliance** — *Prove control, because it's in the architecture.* Structural isolation, your keys, provenance auditors can read. [For regulated teams →](/solutions/regulated)
- **Multi-model teams** — *Change the model. Keep the Harness.* Anthropic-native, OpenAI-compatible, Gemini-compatible — by config. [For multi-model teams →](/solutions/multi-model)
- **Multi-team federation** — *Collaborate across teams without collapsing the walls.* Cross-workspace work governed under your relationships, metered and provenance-tracked. [For regulated & federated teams →](/solutions/regulated)

## Frequently asked questions

**Q: What is an AI agent orchestration platform?**
A: An AI agent orchestration platform assigns, governs, and runs work across multiple AI Agents (and, in Oraclous, humans too) under one policy model — as substrate, rather than as plumbing each team wires by hand. Oraclous does this with Harnesses, ReBAC governance, and BYOM. [More on the platform →](/platform)

**Q: What is the difference between an AI agent framework and an AI agent platform?**
A: A framework hands you parts and leaves governance, identity, credentials, audit, and metering for you to wire per use case. A platform makes those substrate — built once, enforced everywhere. Oraclous also inverts the unit of work: you describe a goal in prose rather than coding each agent. [Why a platform, not a framework →](/platform)

**Q: Can you self-host AI agents with Oraclous?**
A: Yes. Oraclous is open source and platform-as-code, so you can run the whole platform on your own infrastructure with no vendor in the loop. The cloud-hosted mode carries identical data-sovereignty guarantees if you prefer operations off your plate — the choice of support model and isolation tier is yours. [See the open-source story →](/open-source)

**Q: How do I avoid vendor lock-in with AI agents?**
A: Two ways at once. BYOM keeps the model a resource you swap by config (Anthropic-native, OpenAI-compatible, Gemini-compatible), and OHM keeps your work portable — every export routes through the open manifest. The docs state plainly what portability does and doesn't carry, so there are no exit surprises. [How portability works →](/platform/portability)

**Q: Is Oraclous open source and free?**
A: The platform is open source and free to self-host — read the code, the ADRs, and the trade-offs before you commit. Cloud-hosted mode is a paid option with identical sovereignty guarantees and managed operations. Metering measures consumption neutrally; it does not set your prices. [See pricing →](/open-source)

[Self-host it →](/open-source) [See how it works](/how-it-works) [Read the architecture →](/platform)

---
**Internal links:** `/platform` (capability overview, multiple), `/how-it-works` (via Compile flow narrative), `/` + the three problem pages (`/platform`, `/open-source`, `/platform`), `/security` (every control claim), `/open-source` (open-source + ADR mentions), the four `/solutions/*` pages, `/platform/portability` (every no-lock-in mention), `/platform/byom`, `/platform/actors`, `/platform/compile`, `/platform/harness-model`, `/platform/human-in-the-loop`, `/platform/rebac-governance`, `/pricing`, and first-use Glossary links: `/glossary/second-mind`, `/glossary/rebac`, `/glossary/agentic-ai`, `/glossary/operator`, `/glossary/actor`, `/glossary/agent`, `/glossary/harness`, `/glossary/ohm`, `/glossary/byom`, `/glossary/data-sovereignty`, `/glossary/platform-as-code`. External: GitHub (open-source), `/how-it-works` (console CTAs, followed).
**Notes for build:** Hero = shared human+Agent task-board visual, not a chatbot UI. Section 2 = three problem panels + a fourth "fourth choice" panel. Section 6 proof band = four/five chips (open source · ADRs · readable governance · honest docs · hosting compliance). Section 7 = five persona door cards. Social-proof slot in Section 6 stays empty/hidden until real customers exist — no invented logos or quotes. `WebSite` schema carries a `SearchAction`; `Organization` schema carries the `sameAs` array (GitHub, LinkedIn, Crunchbase, Wikidata) per keyword map §4.
