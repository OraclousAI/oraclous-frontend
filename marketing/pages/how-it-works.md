---
title: How Oraclous works — goal to governed work
meta_description: "How Oraclous works: write a goal in plain language and the platform compiles, governs, runs, and learns it across human and AI Agent Actors — every step audited."
url: /how-it-works
diagram: handoff
page_type: pillar
primary_persona: Operations lead + Platform builder
primary_query: how to orchestrate multiple AI agents
secondary_queries: [how does an AI agent platform work, how to build an AI workflow without code, describe a goal turn into AI workflow]
schema: [HowTo, FAQPage, BreadcrumbList]
primary_cta: See it in the console → /how-it-works
secondary_cta: Read the architecture → /developers
---

# How Oraclous works

Write the goal. The platform does the rest — and proves it. From a goal in plain language to governed work running across your people and AI Agents, in five steps: describe, compile, govern, run, and learn — every step audited.

[See how it works →](/how-it-works) [Read the architecture →](/platform)

> *Hero visual (build note): a one-glance horizontal lifecycle — Describe → Compile → Govern → Run → Learn — with both human and Agent icons on the "Run" stage.*

## How does Oraclous turn a goal into running work?

The loop is the same every time, whether the work runs once or on a schedule. An [Operator](/glossary/operator) states a goal in prose; the [Compile flow](/platform/compile) surveys the workspace, asks clarifying questions, plans the topology, and emits an [OHM](/glossary/ohm) manifest for review. Once committed, the runtime runs the [Harness](/glossary/harness) across human and Agent [Actors](/glossary/actor) under a [ReBAC](/glossary/rebac) policy envelope — with provenance and metering on every step.

> **Citable answer — How does Oraclous turn a goal into running work?** An Operator states a goal in prose; the Compile flow surveys the workspace, asks clarifying questions, plans the topology, and emits an OHM manifest for review. Once committed, the runtime runs the Harness across human and AI Agent Actors under a ReBAC policy envelope, with provenance and metering written on every step.

## Step 1 — How do you start a workflow?

You start by saying what you want, not by building it. The [Operator](/glossary/operator) — the person who states the goal — writes *what* needs doing in plain language. There is no pipeline to wire and no code to write at this stage; the prose is the input.

This is the core separation Oraclous is built on: *what work needs doing* is prose written by Operators, and *how the runtime enforces it* is code written once by the platform. You bring the goal; the platform owns the enforcement.

[How the Compile flow works →](/platform/compile) · [What is an Operator? →](/glossary/operator)

## Step 2 — How does prose become a runnable harness?

The [Compile flow](/platform/compile) turns your goal into a reviewable [Harness](/platform/harness-model) through a defined sequence — no black box.

1. **Workspace survey.** The compiler reads what's available: the Capabilities, Actors, data, and policies already in the workspace.
2. **Clarifying questions.** Where the goal is ambiguous, it asks you — before it commits to a plan.
3. **Topology planning.** It plans which Actors do what, in what order, and how they hand off.
4. **Manifest emission.** It emits an [OHM](/glossary/ohm) manifest — the serialised, portable form of the Harness, with a machine-validated structured zone and a model-interpreted prose zone.
5. **Review dialogue.** You read the proposed Harness and discuss changes.
6. **Commit.** Only when you commit does it become a runnable Harness.

You review the Harness before it runs. A prose instruction never overrides a structured policy — code wins.

[Explore the Compile flow →](/platform/compile) · [What is a Harness? →](/platform/harness-model) · [What is OHM? →](/glossary/ohm)

## Step 3 — How is the work governed?

Every Harness runs inside a governance envelope, and that envelope is substrate, not a checkbox. Access is [ReBAC](/glossary/rebac) — relationship-based access control, where permissions follow the relationships between people, Agents, workspaces, and data, rather than static roles. It is enforced platform-wide, at the Harness level.

Each Harness runs under one of five named, versioned [policy sets](/platform/rebac-governance) — from development to production-strict to production-federated — each declaring trust tier, budget ceilings, signature requirements, BYOM constraints, capability allow/deny, and audit level and retention. Coded enforcement applies them; prose never overrides them. Budget caps, capability allocation, and human-in-the-loop gates are all set here, before the work runs.

[Review ReBAC governance →](/platform/rebac-governance) · [Review the trust model →](/security) · [ReBAC vs RBAC →](/glossary/rebac)

## Step 4 — How does the work actually run?

One runtime runs everything. The [Harness Runtime](/platform/execution-scheduling) dispatches Agents into a tool-use loop and humans into task-board assignments — through the same runtime, with no privileged code path for either.

Human review is built in, not bolted on: the runtime treats waiting on a human like waiting on a tool return — same primitives, different latency — so a [human-in-the-loop](/platform/human-in-the-loop) approval is a first-class step. Execution is durable and checkpointed: long-running work survives restarts, schedules fire from the Harness's triggers, and runs can pause, resume, or cancel. Timeouts and a declared retry count are enforced — no runaway loops. Every step writes provenance and meters its consumption.

[See the Actors model →](/platform/actors) · [See the human-in-the-loop flow →](/platform/human-in-the-loop) · [See execution & scheduling →](/platform/execution-scheduling)

## Step 5 — Does the platform get better over time?

It does, and it remembers in a way you can trace. As Actors do work, the Learn flow writes to [Consciousness](/glossary/consciousness) — a per-Actor record of accumulated learning that the platform consults on later work. It is the platform's term for persistent memory, not literal sentience.

Organisational memory lives in the [knowledge graph](/platform/knowledge-graph): a queryable, provenance-tracked store of nodes and relationships, every record scoped by `organization_id`. Retrieval is ReBAC-bounded and traceable to source, so the [second mind](/glossary/second-mind) actually remembers — and you can always see where an answer came from.

[How Oraclous remembers →](/platform/knowledge-graph) · [What is Consciousness? →](/glossary/consciousness)

## What do I own at the end?

You own your work and your model — and you can leave with both. Your Harnesses are portable via [OHM](/platform/portability), the canonical export hub; the reference runtime is open. Your model is yours via [BYOM](/platform/byom) — Anthropic-native, OpenAI-compatible, or Gemini-compatible, swapped by config without touching the Harness.

The docs state plainly what portability does *not* carry — Consciousness records and the ReBAC graph stay on the substrate, and knowledge-graph data exports via standard formats — so there are no surprises at exit.

> *Recap visual (build note): the five-step loop as a closed cycle (Learn feeds back into Describe), with an "OHM out / BYOM in" portability annotation on the boundary.*

[How portability works →](/platform/portability) · [How BYOM works →](/platform/byom)

## Frequently asked questions

**Q: How do you orchestrate multiple AI agents with Oraclous?**
A: You describe the goal in prose, and the Compile flow plans a Harness that assigns work across multiple Agents (and humans) and defines how they hand off. The Harness Runtime then dispatches all of them through one runtime, under one ReBAC policy envelope — orchestration is the platform's job, not yours to wire. [See the Compile flow →](/platform/compile)

**Q: Do I need to write code to use Oraclous?**
A: No. An Operator states the goal in plain language and the platform compiles it into a runnable Harness. The platform itself is written once in code; the work you create is written in prose. Developers can still go deeper through the architecture and the typed APIs, but no code is required to ship a workflow. [Try the Compile flow →](/platform/compile)

**Q: How do you keep a human in the loop?**
A: Human-in-the-loop is a first-class runtime primitive, not a workaround. The runtime treats waiting on a human like waiting on a tool return, so an approval or action is a real step in the same flow Agents run in. A human can review, approve, or block a step, and the runtime enforces the gate regardless of prose. [See the HITL flow →](/platform/human-in-the-loop)

**Q: Can AI agents run on a schedule?**
A: Yes. Execution is durable and checkpointed, and schedules fire from the triggers declared in the Harness's OHM manifest. Recurring and long-running work survives restarts, and you can pause, resume, or cancel a run — with timeouts and a declared retry count enforced so nothing loops away. [See execution & scheduling →](/platform/execution-scheduling)

**Q: Can I review the harness before it runs?**
A: Yes — review is built into the Compile flow. After the platform plans the topology and emits the OHM manifest, you read the proposed Harness in a review dialogue and only commit when you're satisfied. Nothing runs until you commit, and code-level policies always win over prose. [See the Compile flow →](/platform/compile)

[See how it works →](/how-it-works) [Self-host it →](/open-source) [Pick your team →](/solutions)

---
**Internal links:** `/platform/compile`, `/platform/harness-model`, `/platform/rebac-governance`, `/platform/actors`, `/platform/human-in-the-loop`, `/platform/execution-scheduling`, `/platform/knowledge-graph`, `/platform/portability`, `/platform/byom`, `/platform` (via capability links), `/solutions` (CTA), `/security` (governance claim), `/developers` (architecture CTA), and first-use Glossary links: `/glossary/operator`, `/glossary/ohm`, `/glossary/harness`, `/glossary/actor`, `/glossary/rebac`, `/glossary/consciousness`, `/glossary/second-mind`. External: `/how-it-works` (console CTAs, followed).
**Notes for build:** This page carries `HowTo` JSON-LD — the five "Step N" sections (Describe, Compile, Govern, Run, Learn) map to five `HowToStep` entries in order; Step 2's six sub-points can be `HowToStep` or itemized within. Hero = horizontal 5-step lifecycle diagram. Section 7 = recap loop diagram (closed cycle, OHM-out/BYOM-in annotation). Keep the lifecycle order intact — this is the canonical procedural narrative for the whole site.
