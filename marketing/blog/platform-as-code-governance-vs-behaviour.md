---
title: "Platform-as-code: separating governance from agent behaviour"
slug: platform-as-code-governance-vs-behaviour
url: /blog/platform-as-code-governance-vs-behaviour
meta_description: Platform-as-code separates governance (enforced in code) from agent behaviour (interpreted from prose). When they conflict, code wins. Why that beats governance-in-app-logic.
primary_query: platform-as-code
secondary_queries: [governance vs agent behaviour, AI agent governance in code, why does code win over prose, actors-as-harnesses, governance-as-code for AI agents]
schema: [Article, Person, FAQPage, BreadcrumbList]
author: "[TBD]"
date_published: "[TBD]"
date_modified: "[TBD]"
category: Governance & ReBAC
reading_time: 8 min
---

# Platform-as-code: separating governance from agent behaviour

Most agentic stacks put governance and behaviour in the same place — a prompt, a policy block, a wrapper function — and then hope the model respects the rule it was also asked to interpret. That is the design flaw the industry keeps re-discovering: a model that can reason about a constraint can also reason its way around it. Oraclous draws a hard line instead. Governance is **code** the platform enforces deterministically; behaviour is **prose** the runtime interprets. When the two disagree, code wins. This post explains why that split is the load-bearing decision behind the platform, and why it beats baking governance into application logic.

> **Citable answer — What is platform-as-code?** Platform-as-code is Oraclous's founding principle (ADR-003): the platform's machinery is code that enforces governance and executes deterministically, while its behaviour is Harnesses — prose, interpreted by the runtime, that reasons and acts on goals. Governance is written once by the platform; work is described in plain language by Operators. The category boundary shifts from "build the agent" to "describe the goal," and a prose instruction never overrides a coded policy.

This is the first time several Oraclous terms appear, so they are glossed here on first use: a [Harness](/glossary/harness) is a goal-driven assembly of human and AI [Actors](/glossary/actor) under one policy envelope; an [Operator](/glossary/operator) is the person who states the goal in plain language; [OHM](/glossary/ohm) is the portable manifest form of a Harness; [ReBAC](/glossary/rebac) is access by relationship rather than by static role; and [platform-as-code, actors-as-harnesses](/glossary/platform-as-code) is the principle this whole article is about.

## What does "separate governance from behaviour" actually mean?

It means two layers with two different jobs, deliberately kept apart. The lower layer — the platform itself — is conventional software: identity, the ReBAC graph, the credential broker, audit, metering, and the runtime that executes work. It is deployed and versioned through normal engineering practice, and it behaves deterministically. It does not reason; it enforces. The upper layer is behaviour: the Harnesses that describe how a goal gets done. Harnesses contain prose — model-interpreted Markdown — that reasons about a situation and decides what to do next.

ADR-003 ("Platform-as-code, actors-as-harnesses") states the split directly: every executable thing on the platform is a Harness, and composition is expressed by a Harness referencing other capabilities rather than by a separate workflow engine. Section 1 of the platform architecture frames the same idea from the Operator's side — Oraclous "separates *what work needs doing* (prose, written by Operators) from *how the runtime enforces it* (code, written once by the platform)." The boundary is not cosmetic. It decides which decisions a language model is allowed to make and which it is structurally prevented from making.

### The two zones of a manifest

You can see the split inside a single artefact. An OHM manifest has a **structured zone** — machine-validated YAML fields like the Actor roster, the capability allocation, and the policy envelope — and a **prose zone** — the Markdown instructions a model interprets. The rule that ties them together is the whole thesis in one sentence: **a prose instruction never overrides a structured policy.** You can write whatever you like in the prose zone; the structured zone, enforced in code, is what the runtime obeys.

## Why does code win over prose?

Because the only governance you can prove to an auditor is governance a model cannot talk its way past. A prompt that says "never access data outside this workspace" is a request; a coded check that filters every query by `organization_id` is a guarantee. The first depends on the model's good behaviour under every input it will ever see — including adversarial ones. The second does not depend on the model at all.

Oraclous applies this two-layer model everywhere governance lives. [Human-in-the-loop](/platform/human-in-the-loop) gates are coded enforcement, so if a manifest's prose tries to skip a required human approval, the runtime enforces the gate regardless. [ReBAC governance](/platform/rebac-governance) is enforced at the substrate, so a Harness cannot reason its way into a relationship it does not have. Policy sets — five versioned governance envelopes declaring trust tier, budget ceilings, signature requirements, BYOM constraints, capability allow/deny, and audit level — are applied by coded enforcement, and prose never relaxes them. The phrase the docs use is blunt and worth keeping: **code wins.**

> **Citable answer — Why does code win over prose in Oraclous?** Code wins because governance you can prove is governance a model cannot override. In Oraclous a Harness's prose zone is interpreted by the runtime, but the structured policy envelope is enforced in code — so HITL gates, ReBAC access decisions, budget ceilings, and capability allow/deny lists hold regardless of what the prose says. A prose instruction never overrides a structured policy.

## How is this different from governance-in-app-logic?

The common alternative is to scatter governance through application logic — `if user.role == "admin"` checks, per-endpoint permission middleware, allow-lists hard-coded into the agent wrapper. That works until the second use case, then the tenth, and then you are maintaining the same access rule in fifteen places, each subtly different, none of them the source of truth. It is exactly the "role explosion" the access-control industry already complains about with role-based models — and it gets worse when the thing making decisions is a probabilistic model rather than deterministic code.

Platform-as-code removes governance from application logic entirely and makes it substrate. The access rule lives once, in the ReBAC graph; the budget ceiling lives once, in the policy set; the human gate lives once, in the runtime. Every Harness — every workflow, every agent, every scheduled job — inherits the same enforcement because there is no privileged code path around it. You do not re-implement governance per use case, and you do not trust each new agent to re-implement it correctly.

| | Governance-in-app-logic | Platform-as-code (Oraclous) |
|---|---|---|
| Where the rule lives | Scattered across endpoints, wrappers, prompts | Once, in the substrate (ReBAC graph, policy sets, runtime) |
| Who enforces it | The model and ad-hoc code, per use case | Coded enforcement, identically for every Harness |
| Can a model override it? | Often, via prompt or reasoning | No — code wins over prose |
| Proof for an auditor | "Trust our review of fifteen call sites" | One enforced policy + provenance on the substrate |
| Cost of the next use case | Re-wire the governance again | Compose [Capabilities](/glossary/capability); governance is inherited |

This is also why the unit of work changes. In a framework you *build the agent* — you write the code, and governance is yours to wire in. In Oraclous you *describe the goal* — the [Compile flow](/platform/compile) turns an Operator's prose into a governed Harness, and the governance was already there, in code, waiting. The behaviour is new each time; the enforcement is not.

## Where Oraclous fits

Platform-as-code is not a feature you toggle; it is the architecture's spine. It is why [ReBAC governance](/platform/rebac-governance) can be a platform guarantee rather than a per-app convention, why the [Harness model](/platform/harness-model) can treat humans and Agents as symmetric Actors under one policy envelope, and why [Portability](/platform/portability) is possible at all — the thing you export, the OHM manifest, is behaviour, cleanly separated from the platform that ran it.

Two honest boundaries are worth stating, because the same split that gives the guarantees also draws the lines. First, the prose zone really is interpreted — within the envelope the code enforces, a model still reasons, and reasoning is not deterministic. The guarantee is on the envelope (access, budgets, gates), not on the prose's every word. Second, because governance is substrate, your ReBAC graph and policy structure are platform-internal — Portability carries your Harnesses, not your relationship graph, which you rebuild in the destination. The architecture states both plainly. Read the [platform-as-code definition](/glossary/platform-as-code), the [ReBAC governance](/platform/rebac-governance) model, and the [Harness model](/platform/harness-model) to see how the two layers meet.

## Frequently asked questions

**Q: What is platform-as-code?**
A: Platform-as-code is Oraclous's founding principle from ADR-003: the platform's machinery is code that enforces governance deterministically, while its behaviour is Harnesses — prose interpreted by the runtime. Governance is written once by the platform; work is described in plain language by Operators. A prose instruction never overrides a coded policy.

**Q: Why does code win over prose in Oraclous?**
A: Because the only governance you can prove is governance a model cannot override. A Harness's prose is interpreted by the runtime, but the structured policy envelope — access, budgets, HITL gates, capability allow/deny — is enforced in code. So those rules hold no matter what the prose says. Code wins.

**Q: How is platform-as-code different from governance in application logic?**
A: Governance-in-app-logic scatters the same access rule across endpoints, wrappers, and prompts, re-wired per use case and trusted to each agent. Platform-as-code makes governance substrate — the rule lives once and every Harness inherits coded enforcement with no privileged code path around it.

**Q: Does separating governance from behaviour limit what an agent can do?**
A: It limits what an agent can do *outside its envelope*, which is the point. Inside the coded policy envelope an Agent reasons and acts freely on the goal's prose. The split removes the agent's ability to override access, budgets, or human gates — not its ability to do the work it is authorised to do.

**Q: What does "actors-as-harnesses" mean?**
A: It is the second half of the principle: the platform's actors are not bespoke code but Harnesses, described in OHM and interpreted by the runtime. Humans and Agents are symmetric Actors in a Harness. You describe an Actor's role and capabilities in a manifest rather than coding a new agent class each time.

---
**Internal links:** [/glossary/platform-as-code](/glossary/platform-as-code) (first-use · primary definition), [/glossary/harness](/glossary/harness), [/glossary/actor](/glossary/actor), [/glossary/operator](/glossary/operator), [/glossary/ohm](/glossary/ohm), [/glossary/rebac](/glossary/rebac), [/glossary/capability](/glossary/capability); supporting pillars/capabilities: [/platform/rebac-governance](/platform/rebac-governance), [/platform/harness-model](/platform/harness-model), [/platform/human-in-the-loop](/platform/human-in-the-loop), [/platform/compile](/platform/compile), [/platform/portability](/platform/portability); related articles: [/blog/ohm-portable-manifest-for-ai-agents](/blog/ohm-portable-manifest-for-ai-agents), [/blog/human-in-the-loop-first-class-primitive](/blog/human-in-the-loop-first-class-primitive); up-link [/blog](/blog).
**Notes for build:** `Article` + `Person` (author `[TBD]`, with E-E-A-T credentials) + `FAQPage` + `BreadcrumbList` JSON-LD; breadcrumb Home › Blog › Platform-as-code: separating governance from agent behaviour. Author/date `[TBD]` per positioning §7 (no fabricated authorship). Source grounding: ADR-003 (platform-as-code / actors-as-harnesses; "every executable thing is a Harness"; composition by reference), Platform Architecture §1 (prose-vs-code separation), §2 (ReBAC; `organization_id` enforcement), §5 (Compile + HITL flows), §6 (two-layer governance, "code wins"), Structured Governance Taxonomy (five versioned policy sets). Glossary: platform-as-code, manifest (two zones, "prose never overrides structured policy — code wins"), policy set, human-in-the-loop. Voice: confident/precise/honest, exact terms (ReBAC not RBAC, Agent not bot); name the two boundary trade-offs (prose still interpreted; ReBAC graph platform-internal) per voice-and-tone §2.2/§3. Comparison table is the citability/featured-snippet asset (geo-citability §3). No invented metrics or customers.
