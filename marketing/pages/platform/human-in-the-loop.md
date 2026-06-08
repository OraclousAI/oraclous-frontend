---
title: Human-in-the-loop — oversight as a first-class step
meta_description: "Human-in-the-loop for AI agents, built into the runtime: humans approve or block steps on the same primitives as agent tool calls. Oversight is structural, not a side-channel."
url: /platform/human-in-the-loop
diagram: handoff
page_type: cluster
primary_persona: Operations / automation lead
primary_query: human in the loop AI agents
secondary_queries: [how humans approve agent work, is HITL a workaround or built in, can a human block an agent step, AI agent approval step]
schema: [BreadcrumbList, FAQPage, TechArticle]
primary_cta: See the HITL flow → /how-it-works
secondary_cta: See ReBAC governance → /platform/rebac-governance
---

# What is human-in-the-loop here?

Human review is a first-class runtime primitive, not a workaround. The Runtime treats waiting on a human like waiting on a tool return — same primitives, different latency — so oversight is structural.

[See the HITL flow →](/how-it-works) [See ReBAC governance →](/platform/rebac-governance)

> *Hero visual (build note): one runtime loop where an Agent's tool call and a human's task-board approval are the same shape of step — not a human bolted on beside the machine.*

## What is human-in-the-loop here?

[Human-in-the-loop](/glossary/human-in-the-loop) (HITL) is the assignment of a step in a [Harness](/glossary/harness) to a human for review, approval, or action. What makes it different in Oraclous is *where* it lives: humans and [Agents](/glossary/agent) are symmetric [Actors](/glossary/actor), and the Harness Runtime treats waiting on a human exactly like waiting on a tool to return — the same primitives, just a different latency. Oversight isn't a manual side-channel you remember to check; it's a step in the flow the work already runs in.

> **Citable answer — What is human-in-the-loop in Oraclous?** Human-in-the-loop (HITL) is the assignment of a step in a Harness to a human for review, approval, or action. Oraclous's Runtime treats waiting on a human like waiting on a tool return — same primitives, different latency — so human oversight is a structural part of the flow, not a manual side-channel. The Runtime enforces HITL gates regardless of prose.

[What is human-in-the-loop? →](/glossary/human-in-the-loop) · [What is an Actor? →](/glossary/actor) · [See the HITL flow →](/how-it-works)

## How does human-in-the-loop work?

The HITL flow is one of the platform's eight named behaviours, and it runs as a sequence of concrete steps:

1. **Gate triggered** — the Harness reaches a step that requires a human.
2. **Assignee resolution** — the Runtime works out which human (or human role) the step belongs to.
3. **Task creation** — a task is created on the workspace task board, the shared surface where [Actors](/platform/actors) — human and Agent alike — pick up work.
4. **Notification dispatch** — the assignee is notified.
5. **Pause and persist** — the run pauses and its state is persisted; nothing burns budget while it waits, and the run survives a restart.
6. **Human acts** — the person approves, blocks, edits, or supplies the input.
7. **Resumption** — the Runtime resumes the Harness from exactly where it paused.

Because the gate is *coded enforcement*, not a polite request to the model, prose can't route around it. If a manifest's prose tries to skip a HITL gate, **the Runtime enforces the gate regardless** — the same two-layer model that backs all of [ReBAC governance](/platform/rebac-governance): governance lives in code, flexibility lives in prose, and code wins. A human at a gate can let a step proceed or block it outright, and the policy set the Harness runs under decides where gates are mandatory.

[How a Harness works →](/platform/harness-model) · [How Actors share a task board →](/platform/actors) · [See ReBAC governance →](/platform/rebac-governance)

## Why does human-in-the-loop matter?

The usual way teams add oversight to agentic work is a bolt-on: a webhook, a Slack ping, a dashboard someone is supposed to watch. That's a side-channel, and side-channels get skipped under pressure. Making HITL a runtime primitive means oversight can't silently fall out of the flow — the run physically pauses at the gate and can't continue until a human acts.

This is the page for the **operations lead** who wants to ship automation without giving up the final say, and for the **security and compliance leader** for whom an unattended high-stakes action is a non-starter. A human approving inside the same flow the Agents run in — with the pause, the persisted state, and the audited resumption — is the difference between "we have a review process" and "review is structurally enforced." See how this lands for your team on the [operations](/solutions/operations) and [regulated & security](/solutions/regulated) solutions.

> **Citable answer — Is HITL a workaround or built in?** It's built in. In Oraclous, human-in-the-loop is a first-class runtime primitive: the Harness Runtime treats waiting on a human like waiting on a tool return, pausing and persisting the run at the gate until the person acts, then resuming. Because the gate is coded enforcement, prose cannot route around it — a human can block a step, and the Runtime obeys.

## Frequently asked questions

**Q: How do humans approve agent work?**
A: When a Harness reaches a HITL gate, the Runtime resolves the assignee, creates a task on the workspace task board, notifies the person, and pauses the run with its state persisted. The human approves, blocks, edits, or supplies input; the Runtime then resumes the Harness from exactly where it paused.

**Q: Is HITL a workaround or built in?**
A: Built in. Human-in-the-loop is a first-class runtime primitive — the Runtime treats waiting on a human like waiting on a tool return, same primitives, different latency. It's not a webhook or a dashboard bolted on beside the work; it's a step in the same flow the Agents run in, and the run pauses there until a human acts.

**Q: Can a human block an agent step?**
A: Yes. At a HITL gate the human can let the step proceed or block it outright. The gate is coded enforcement, so even if a manifest's prose tries to skip it, the Runtime enforces the gate regardless — code wins over prose. The work cannot continue past a block without human action.

**Q: What happens to the run while it waits for a human?**
A: It pauses and its state is persisted. Nothing consumes budget while it waits, and because the state is durable the run survives a restart. When the human acts, the Runtime resumes the Harness from exactly where it paused — no lost context, no re-run from the top.

**Q: Who decides where a human gate is required?**
A: The policy set the Harness runs under, plus the Harness's own orchestration. Policy sets are versioned governance envelopes that, among other constraints, anchor where mandatory gates apply; the Runtime enforces them in code. So whether a step requires a human is governance, not a per-run judgement the model makes on its own.

---
**Internal links:** [/glossary/human-in-the-loop](/glossary/human-in-the-loop) (first-use), [/glossary/actor](/glossary/actor), [/glossary/harness](/glossary/harness), [/glossary/agent](/glossary/agent); Related capabilities (governance triangle): [/platform/rebac-governance](/platform/rebac-governance), [/platform/actors](/platform/actors); plus [/platform/metering](/platform/metering), [/platform/harness-model](/platform/harness-model); narrative [/how-it-works](/how-it-works); Solutions: [/solutions/operations](/solutions/operations), [/solutions/regulated](/solutions/regulated); up-link [/platform](/platform).
**Notes for build:** Breadcrumb Home › Platform › Human-in-the-loop; BreadcrumbList + FAQPage + TechArticle JSON-LD; reference DefinedTerm /glossary/human-in-the-loop via link. HITL flow steps are from §5 flow 7; the "code wins" gate guarantee is from §6 (two-layer model) — keep consistent with /platform/rebac-governance. Sibling triangle per internal-linking §2.1 is rebac-governance ⇄ human-in-the-loop ⇄ metering; the row also lists actors as a related link.
