---
title: Compile — turn a goal in prose into a governed Harness
meta_description: The Compile flow turns a goal written in plain language into a governed Harness you review before it runs. No code required — describe the goal, not the pipeline.
url: /platform/compile
diagram: compile-flow
page_type: cluster
primary_persona: Operations / automation lead
primary_query: describe a goal turn into AI workflow
secondary_queries: [no-code AI agent workflow, how the Compile flow works, what is an Operator, review AI workflow before it runs]
schema: [BreadcrumbList, FAQPage, TechArticle]
primary_cta: Try the Compile flow → /how-it-works
secondary_cta: See it in the console → /how-it-works
---

# How do you turn a goal into a workflow?

You write the goal in plain language, and the [Compile flow](/glossary/compile-flow) emits a governed [Harness](/glossary/harness). The platform surveys your workspace, plans the topology, and gives you a Harness to review before it runs. Describe the goal, don't code the pipeline.

[See the Compile flow →](/platform/compile) [See how it works →](/how-it-works)

> *Hero visual (build note): a prose goal in a text field on the left, an arrow through a "compile" step, and a reviewable Harness manifest on the right — with a visible "review before commit" gate between emission and run.*

## How do you turn a goal into a workflow?

You don't build the workflow — you state the goal. An [Operator](/glossary/operator) writes what needs doing in natural language, and Oraclous compiles it into a governed [Harness](/glossary/harness). This is the platform's founding separation: the Operator owns *what work needs doing* (prose), and the platform owns *how the runtime enforces it* (code, written once). The category boundary shifts from "build the agent" to "describe the goal" ([platform-as-code, actors-as-harnesses](/glossary/platform-as-code), ADR-003).

No code is required, and the result is not a black box. The Compile flow emits a [Harness](/glossary/harness) you read and approve before it ever runs — so describing a goal in prose does not mean losing sight of what will execute.

> **Citable answer — How do you turn a goal into a workflow in Oraclous?** An Operator writes the goal in plain language and the Compile flow turns it into a governed Harness: the platform surveys the workspace, may ask clarifying questions, plans the topology, and emits a manifest the Operator reviews before committing. No code is required, and the Harness is reviewable before it runs.

[What is an Operator? →](/glossary/operator) · [The Compile flow →](/glossary/compile-flow) · [What is a Harness? →](/glossary/harness)

## How does the Compile flow work?

The Compile flow runs as a sequence you can follow step by step (§5, flow 1):

1. **State the goal.** The Operator describes the outcome in natural language.
2. **Invoke the compiler.** The Application Gateway invokes the compiler Harness — the compiler is itself a Harness running on the same runtime as everything else, no privileged code path.
3. **Survey the workspace.** The compiler surveys the available [Capabilities](/glossary/capability), Actors, and data in the workspace.
4. **Ask clarifying questions** (when needed). If the goal is ambiguous, the flow asks before it assumes.
5. **Plan the topology.** It works out which human and Agent Actors do what, in what order, under which policy.
6. **Emit the manifest.** It produces the Harness as [OHM](/glossary/ohm) — the portable manifest.
7. **Review dialogue.** The Operator reads the proposed Harness and refines it in conversation.
8. **Commit and set triggers.** Only on the Operator's commit does the Harness become live, with its triggers registered.

The review gate is the load-bearing step: the Harness is reviewable before it runs, so you describe the goal in prose but still inspect — and refine — the exact governed object that will execute. The platform shows you the mechanism; it does not ask you to trust magic.

> *Diagram (build note): the eight-step Compile flow as a left-to-right pipeline with the "review dialogue → commit" gate emphasised — the point being that nothing runs before the Operator commits.*

## Why does the Compile flow matter?

For an [operations](/solutions/operations) lead, the Compile flow is the difference between shipping automation and waiting in the engineering queue. Agentic workflows usually need an engineering sprint per use case; the Compile flow lets the people who know the work describe it directly, and ship a governed Harness without standing in the dev queue. Full control, complete audit — because the output is a governed Harness, not an ungoverned script.

Compile is partly built today: it is architecture-true and central to the platform, but it is best understood as the design of how goals become Harnesses, with a reference Harness gallery still a roadmap asset. What is real now is the separation it rests on — prose for the goal, code for enforcement — and the principle that you review the Harness before it commits.

## Frequently asked questions

**Q: How does the Compile flow work?**
A: An Operator states a goal in natural language; the Application Gateway invokes the compiler Harness, which surveys the workspace, optionally asks clarifying questions, plans the topology, emits the Harness as an OHM manifest, runs a review dialogue with the Operator, and commits — registering triggers. Nothing runs until the Operator commits.

**Q: Do I need to write code?**
A: No. You describe the goal in plain language and the Compile flow emits the Harness. Oraclous separates what work needs doing (prose, written by the Operator) from how the runtime enforces it (code, written once by the platform) — so shipping a workflow does not require an engineering sprint per use case.

**Q: What is an Operator?**
A: An Operator is the person who states an organisation's goal in natural language so the platform can compile it into a governed Harness. The Operator owns what needs doing; the platform owns how the runtime enforces it. This separation lets teams ship workflows without coding each one by hand.

**Q: Can I review the Harness before it runs?**
A: Yes. The Compile flow emits a Harness manifest and runs a review dialogue with the Operator before anything commits. You read and refine the exact governed object that will execute, and only your commit makes it live and registers its triggers — so describing a goal in prose never means running an unseen workflow.

---
**Internal links:** `/glossary/operator`, `/glossary/harness`, `/glossary/compile-flow`, `/glossary/ohm`, `/glossary/capability`, `/glossary/platform-as-code` (first-use term links) · `/platform/harness-model`, `/platform/actors` (sibling capabilities — the "what is the unit of work" triangle) · `/platform` (up-link / breadcrumb) · `/solutions/operations` (Solution link) · `/how-it-works` (lifecycle narrative), `/how-it-works` (console CTA, followed). Breadcrumb: Home › Platform › Compile.
**Notes for build:** `TechArticle` + `FAQPage` + `BreadcrumbList` JSON-LD; reference the `DefinedTerm` at `/glossary/operator` and `/glossary/compile-flow` by link. Hero = prose-in / reviewable-Harness-out with an explicit review gate. Keep the maturity honest per §3.5 of the voice guide: Compile is architecture-true and central; the reference Harness gallery is a roadmap asset — don't imply a polished shipped no-code builder. Console CTAs (`/how-it-works`) are followed conversion links.
