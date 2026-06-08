---
title: Actors — humans and AI Agents on one task board
meta_description: "In Oraclous, humans and AI Agents are symmetric Actors on one task board: each has an identity, scope, and capability allocation, and work hands off both ways."
url: /platform/actors
diagram: fabric-mesh
page_type: cluster
primary_persona: Operations / automation lead
primary_query: humans and AI agents one task board
secondary_queries: [Actor vs Agent, human and AI agent handoff, symmetric actors, human in the loop task board]
schema: [BreadcrumbList, FAQPage, TechArticle]
primary_cta: See the task board → /how-it-works
secondary_cta: Read the architecture → /developers
---

# What is an Actor — human or Agent?

In Oraclous, humans and AI [Agents](/glossary/agent) are symmetric [Actors](/glossary/actor) on one task board. Each has an identity, a scope, and a capability allocation, and work hands off between them under one governance model. The runtime treats waiting on a human like waiting on a tool return.

[See the task board →](/how-it-works) [Read the architecture →](/platform)

> *Hero visual (build note): one task board with mixed cards — some assigned to a person, some to an Agent — under one policy envelope; work-handoff arrows pointing both directions, human↔Agent.*

## What is an Actor (human or Agent)?

An Actor is any entity — a human member or an AI Agent — that can be assigned work in a [Harness](/glossary/harness). Humans and Agents are symmetric: each has an identity, a scope, and a capability allocation, and they share a common interface. That symmetry is the basis of the "second mind" — your organisation's combined human and Agent capacity, governed as one fabric rather than two systems bolted together.

An Agent is the non-human kind of Actor: it has its own identity, role, capability allocation, scope, and [Consciousness](/glossary/consciousness) record. An Agent is not the language model — the LLM is a resource the Agent uses ([BYOM](/glossary/byom)). So the Actor/Agent distinction is simply Actor as the general role-in-the-work, and Agent as the software participant filling it alongside your people.

> **Citable answer — What is an Actor?** An Actor is any entity — human member or AI Agent — that can be assigned work in an Oraclous Harness. Humans and Agents are symmetric Actors: each has an identity, a scope, and a capability allocation, and shares a common interface. This symmetry lets people and Agents share one task board under one governance model.

[What is an Actor? →](/glossary/actor) · [What is an Agent? →](/glossary/agent) · [What is a Harness? →](/glossary/harness)

## How do Actors work on one task board?

A [Harness](/glossary/harness) carries a roster of Actors and a single task-board reference. When the Harness runs, the Harness Runtime dispatches each Actor according to kind: Agents go into a tool-use loop, humans get task-board assignments. Both are dispatched through one runtime with no privileged code path — the same governance, the same provenance, applies whether a person or an Agent is doing the step.

Work hands off in both directions. An Agent can complete a step and pass the next to a person; a person can finish a review and pass control back to an Agent. When a step is assigned to a human — the [human-in-the-loop](/platform/human-in-the-loop) case — the runtime treats waiting on that human like waiting on a tool return: it creates the task, notifies the assignee, pauses and persists the execution, and resumes when the human acts. Same primitives, different latency. Human oversight is structural, not a manual side-channel grafted on after the fact.

Behind the task board, each Actor's identity, scope, and capability allocation are enforced at the [Harness](/glossary/harness) level under [ReBAC](/glossary/rebac) — relationship-based access control, where what an Actor can touch follows its relationships, not a static role. And each Actor accrues a [Consciousness](/glossary/consciousness) record — its per-Actor memory of past work — consulted on future runs, so the second mind actually remembers what it has done.

> *Diagram (build note): the dispatch split — Harness Runtime routing Agent Actors to a tool-use loop and human Actors to task-board cards — with a bidirectional handoff arrow and a "pause + persist + resume" callout on the human path.*

## Why do symmetric Actors matter?

Most "AI at work" tools treat humans and software as two different systems: the bots do their thing, and a human approval is a side-channel you bolt on. That split is where oversight leaks and accountability blurs. Oraclous closes it by making humans and Agents the same kind of thing — Actors — on the same board, under the same policy.

For an [operations](/solutions/operations) lead, that means your team and your Agents share one queue: you can see what each is doing, hand work between them, and keep a human in the loop on the steps that need judgement — without leaving the flow the Agents run in. The work, the governance, and the memory are one fabric, not three.

## Frequently asked questions

**Q: Can humans and AI agents share a task board?**
A: Yes — it is the core design of Oraclous. Humans and Agents are symmetric Actors with a common interface, so a single Harness's task board holds work for both. The runtime dispatches Agents into a tool-use loop and humans into task-board assignments, with no privileged code path and one governance model over both.

**Q: What is the difference between an Actor and an Agent?**
A: An Actor is any entity that can be assigned work in a Harness — human or AI. An Agent is the non-human kind of Actor, with its own identity, role, capability allocation, scope, and Consciousness record. An Agent is not the LLM; the LLM is a resource the Agent uses. Every Agent is an Actor; not every Actor is an Agent.

**Q: How does work hand off between a human and an agent?**
A: Both ways, on the same task board. An Agent can complete a step and assign the next to a person; a person can finish and pass control back. When a step needs a human, the runtime treats waiting on them like waiting on a tool return — it creates the task, pauses and persists the run, and resumes when the human acts.

**Q: Is human review built in or bolted on?**
A: Built in. Oraclous's runtime treats waiting on a human like waiting on a tool return — same primitives, different latency — so a human-in-the-loop step is a first-class part of the flow, enforced by the runtime regardless of prose, rather than a manual approval routed around the system.

---
**Internal links:** `/glossary/actor`, `/glossary/agent`, `/glossary/harness`, `/glossary/consciousness`, `/glossary/byom`, `/glossary/rebac` (first-use term links) · `/platform/harness-model`, `/platform/knowledge-graph`, `/platform/human-in-the-loop` (sibling capabilities — "the second mind remembers" pair + HITL) · `/platform` (up-link / breadcrumb) · `/solutions/operations` (Solution link) · `/how-it-works` (task-board flow CTA), `/developers` (architecture). Breadcrumb: Home › Platform › Actors.
**Notes for build:** `TechArticle` + `FAQPage` + `BreadcrumbList` JSON-LD; reference the `DefinedTerm` at `/glossary/actor` and `/glossary/agent` by link, don't duplicate. Hero = one task board with mixed human/Agent cards + bidirectional handoff. The "ReBAC at the Harness level" claim links to `/glossary/rebac` per the control-claim cross-link rule.
