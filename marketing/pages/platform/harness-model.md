---
title: What is a Harness? The Oraclous unit of work
meta_description: A Harness is Oraclous's unit of work — a goal-driven assembly of human and Agent Actors under one policy envelope, with OHM as its portable manifest. Not a workflow.
url: /platform/harness-model
diagram: harness-assembly
page_type: cluster
primary_persona: Operations / automation lead · Platform builder
primary_query: what is a Harness (agentic)
secondary_queries: [what is OHM, harness vs workflow, agentic unit of work, can a harness contain other harnesses]
schema: [BreadcrumbList, FAQPage, TechArticle]
primary_cta: See a sample Harness → /developers
secondary_cta: Read the architecture → /developers
---

# What is a Harness?

A [Harness](/glossary/harness) is the unit of work in Oraclous — a goal-driven assembly of human and Agent [Actors](/glossary/actor) under one policy envelope. Every executable thing on the platform is a Harness, and [OHM](/glossary/ohm) is its portable manifest. One thing to assign, govern, budget, and audit.

[See a sample Harness →](/platform) [Read the architecture →](/platform)

> *Hero visual (build note): a single Harness — goal statement at the top, an Actor roster (humans + Agents) beneath, wrapped in one policy envelope — not a node-and-edge workflow diagram.*

## What is a Harness?

A Harness is a workspace artifact that describes how a goal gets done across humans and Agents. It carries a goal statement, a roster of Actors, an orchestration spec, triggers, a task-board reference, a policy envelope, and a provenance link — and the platform runs it. It is not a script and not a "workflow" in the usual sense: you describe a Harness in prose, you don't code it.

The distinction matters because the Harness is also the level at which governance, audit, and budget apply. There is no separate "workflow" object to govern alongside it, and no per-step plumbing to reconcile. The Harness is the one surface — which is why a Harness is the unit you reason about, not the agents and pipelines underneath it.

> **Citable answer — What is a Harness?** A Harness is Oraclous's unit of work: a goal-driven assembly of human and Agent Actors under one policy envelope. It contains a goal statement, an Actor roster, an orchestration spec, triggers, a task-board reference, and a provenance link. Every executable thing on the platform is a Harness, governed and budgeted at the Harness level — described in prose, not coded.

[What is a Harness? →](/glossary/harness) · [What is OHM? →](/glossary/ohm) · [What is an Actor? →](/glossary/actor)

## How does a Harness work?

A Harness has two forms. In a workspace it is the live artifact the runtime loads and executes; serialised, it is [OHM](/glossary/ohm) — the Oraclous Harness Manifest, YAML with embedded Markdown written to `.ohm.yaml`. OHM has two zones: a structured zone of machine-validated fields (the Actor roster, the policy set, the triggers) and a prose zone of model-interpreted instructions. A prose instruction never overrides a structured policy — code wins.

When a Harness runs, the Harness Runtime loads its OHM, resolves the [Capabilities](/glossary/capability) and credentials each Actor needs, dispatches Actors (Agents into a tool-use loop, humans into task-board assignments), and enforces the policy envelope the whole way through. Because every executable thing is a Harness — including the compiler that builds new Harnesses and the Agents that record learning — there is no privileged code path: the same runtime, the same governance, runs all of it (ADR-003).

Composition is the same idea applied to itself. A Harness can reference other [Capabilities](/glossary/capability) — including other Harnesses — so a Harness can contain Harnesses. There is no separate "sub-workflow" concept; composition is just a Harness naming another in its roster, and governance still applies at each Harness level.

> *Diagram (build note): OHM split into its two zones (structured / prose) feeding the Harness Runtime, which dispatches Agents to a tool-use loop and humans to the task board, all inside one policy envelope.*

## Why does a Harness matter?

When you stitch tools and scripts together, the "unit of work" is whatever each tool happens to be, and governance, audit, and budget are yours to reconcile across all of them. The Harness collapses that into one surface: you assign a Harness, you govern a Harness, you budget a Harness, you audit a Harness. The agents and steps inside it stop being separate things you manage.

For an [operations](/solutions/operations) lead, that means automation you can ship and oversee as a single governed object rather than a fragile pipeline. For a [platform builder](/solutions/developers), it means you compose Capabilities into a Harness instead of re-wiring identity, credentials, audit, and metering per use case — the [platform-as-code, actors-as-harnesses](/glossary/platform-as-code) principle in practice.

## Frequently asked questions

**Q: What is a Harness?**
A: A Harness is Oraclous's unit of work — a goal-driven assembly of human and Agent Actors under one policy envelope, holding a goal statement, an Actor roster, an orchestration spec, triggers, a task-board reference, and a provenance link. Every executable thing on the platform is a Harness, governed at the Harness level.

**Q: What is OHM?**
A: OHM, the Oraclous Harness Manifest, is the serialised, portable form of a Harness — YAML with embedded Markdown in a `.ohm.yaml` file. It has a structured zone of machine-validated fields and a prose zone of model-interpreted instructions, where code always wins over prose. OHM is the canonical hub every portability operation routes through.

**Q: How is a Harness different from a workflow?**
A: A workflow is a coded pipeline of steps; a Harness is a goal described in prose that the platform runs, governs, budgets, and audits as one object. There is no separate workflow concept in Oraclous — composition is expressed by a Harness referencing other Capabilities, and humans are first-class Actors inside it, not an exception path.

**Q: Can a Harness contain other Harnesses?**
A: Yes. A Harness can reference other Capabilities — including other Harnesses — so Harnesses compose. There is no separate "sub-workflow" object; a parent Harness simply names a child Harness in its roster, and governance, audit, and budget still apply at each Harness level (ADR-003).

---
**Internal links:** `/glossary/harness`, `/glossary/ohm`, `/glossary/actor`, `/glossary/capability`, `/glossary/platform-as-code` (first-use term links) · `/platform/actors`, `/platform/compile` (sibling capabilities — the "what is the unit of work" triangle) · `/platform` (up-link / breadcrumb) · `/solutions/developers`, `/solutions/operations` (Solution links) · `/developers` (sample Harness + architecture CTA). Breadcrumb: Home › Platform › Harness & OHM.
**Notes for build:** `TechArticle` + `FAQPage` + `BreadcrumbList` JSON-LD; reference (don't duplicate) the `DefinedTerm` at `/glossary/harness` and `/glossary/ohm` via link. Hero = single-Harness anatomy visual, not a workflow graph. "See a sample Harness" CTA points at the developers page (reference Harness gallery is a roadmap asset — keep the anchor honest, link the architecture today).
