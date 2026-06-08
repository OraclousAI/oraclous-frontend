---
title: ReBAC governance — access by relationship, proven
meta_description: ReBAC for AI agents governs access by relationship, not role. Two-layer enforcement where code wins, five versioned policy sets, provenance auditors can read.
url: /platform/rebac-governance
diagram: rebac-graph
page_type: cluster
primary_persona: Security & compliance leader
primary_query: governed AI agents / ReBAC for AI
secondary_queries: [ReBAC vs RBAC, how to control what an AI agent can access, AI agent access control, agent governance and audit]
schema: [BreadcrumbList, FAQPage, TechArticle]
primary_cta: Review the trust model → /security
secondary_cta: Read the governance taxonomy → /developers
---

# What is ReBAC governance?

Access by relationship, not by role — enforced platform-wide at the [Harness](/glossary/harness) level, under five named, versioned policy sets. Auditors get proof, not promises.

[Review the trust model →](/security) [Read the governance taxonomy →](/platform)

> *Hero visual (build note): the two-layer enforcement diagram — a prose instruction hitting a coded policy wall labelled "code wins" — not a padlock icon.*

## What is ReBAC governance?

[ReBAC](/glossary/rebac) — relationship-based access control — defines what an [Actor](/glossary/actor) can touch by the *relationships* between entities (people, [Agents](/glossary/agent), workspaces, data), rather than by a static role assigned in advance. Oraclous enforces ReBAC platform-wide, at the Harness level, so the same fabric that runs the work also records who could touch what, and why.

The contrast with RBAC is the point. RBAC grants access by an assigned role, and as the matrix of who-needs-what grows, you get *role explosion* — a sprawl of near-duplicate roles nobody can fully reason about. ReBAC grants access by an Actor's relationship to the specific resource, so permissions scale with the relationships that already exist instead of with a hand-maintained role table.

> **Citable answer — What is ReBAC governance?** ReBAC (relationship-based access control) governs access by the relationships between entities — people, AI agents, workspaces, data — rather than by static roles. Oraclous enforces it platform-wide at the Harness level, avoiding RBAC's role explosion: permissions scale with relationships, and every access is provenance-tracked so auditors get proof rather than promises.

[What is ReBAC? →](/glossary/rebac) · [What is a Capability? →](/glossary/capability) · [Review the trust model →](/security)

## How does ReBAC governance work?

Governance in Oraclous runs in two layers, and the boundary between them is deliberate.

**Coded enforcement** is implemented in platform code — deterministic, predictable, and audit-anchored. It covers ReBAC checks, credential-scope enforcement, budget caps, [human-in-the-loop](/platform/human-in-the-loop) gates, and output redaction. The Substrate enforces ReBAC-graph integrity, identity verification, and storage isolation; the Harness Runtime enforces capability allocation, budget caps, and HITL gates.

**Prose interpretation** is the Markdown inside an OHM manifest — role descriptions, orchestration rules, hand-off conditions — interpreted by the language model at run time.

The rule that makes this trustworthy: **a prose instruction that contradicts a structured policy never overrides the policy. Governance lives in code; flexibility lives in prose; code wins.** If a manifest's prose tries to skip a HITL gate, the Runtime enforces the gate regardless. If it tries to expand an Agent's capability allocation, the Runtime checks the allocation and refuses. If it tries to spend past the budget, the Runtime halts when the budget is exhausted.

Those budgets and constraints are not improvised per Harness — they come from five named, versioned **policy sets** (the [Structured Governance Taxonomy](/platform)). Each set declares trust tier, signature requirement, BYOM constraints, capability allow/deny lists, audit level, retention, and explicit budget ceilings:

- **Development default** — relaxed: up to 200,000 tokens, 600 seconds wall-time, 200 tool calls per run; summary audit, 30-day retention; signatures not required.
- **Staging default** — signed; 100,000 tokens / 300 s / 100 tool calls; detailed audit, 90-day retention.
- **Production default** — signed; 50,000 tokens / 180 s / 50 tool calls; full audit, 365-day retention.
- **Production strict** — signed; 20,000 tokens / 60 s / 20 tool calls; Anthropic-native only, shell-exec and arbitrary-HTTP capabilities forbidden; full audit, 730-day retention.
- **Production federated** — signed; 50,000 tokens / 180 s / 50 tool calls; permits `federated:*` registries for cross-workspace work; full audit, 365-day retention.

A Harness references a policy set by ID; the Runtime applies it. To be honest about the line between what's *enforced* and what's *configured*: the policy sets and their ceilings are coded enforcement — the Runtime stops at the cap. *Which* set a Harness runs under, and any per-org tuning of the catalogue, is configuration you set and version. Provenance — the traceable record of where every result came from — is written as a universal sink on the Substrate, and every node, relationship, query, and audit log carries an `organization_id`.

[How a Harness works →](/platform/harness-model) · [See human-in-the-loop →](/platform/human-in-the-loop) · [Read the architecture →](/platform)

## Why does ReBAC governance matter?

If your auditors ask "prove you control what this agent can access," a "trust us" answer fails the review. ReBAC plus versioned policy sets plus provenance turns that question into a query: access is defined by relationships you can inspect, enforced by code that is deterministic, and recorded with an `organization_id` on every entry. The boundary between organisations isn't a setting that could be misconfigured — cross-organisation data flow is [structurally impossible](/security), because every storage primitive filters on `organization_id`.

This is the page for the **security and compliance leader** in a regulated organisation, and for the **federation owner** running work across team boundaries. For cross-workspace collaboration, the `production-federated` policy set lets one workspace request another's capabilities under ReBAC, with those traversals [metered](/platform/metering) and provenance-tracked — federation an auditor would sign off, not a free-for-all. See how this maps to your obligations on the [regulated & security solution](/solutions/regulated).

> **Citable answer — How is ReBAC different from RBAC?** RBAC grants access by an assigned role and suffers "role explosion" as near-duplicate roles multiply. ReBAC grants access by an Actor's relationship to the specific resource, so permissions scale with existing relationships instead of a hand-maintained role table. Oraclous enforces ReBAC in code at the Harness level, and code always overrides contradicting prose.

## Frequently asked questions

**Q: What is ReBAC and how is it different from RBAC?**
A: ReBAC (relationship-based access control) defines permissions by the relationships between people, Agents, workspaces, and data. RBAC defines them by static assigned roles and tends toward "role explosion." ReBAC scales with relationships instead of a growing role table, and Oraclous enforces it platform-wide at the Harness level.

**Q: How do you control what an AI agent can access?**
A: Each Agent has a capability allocation and runs inside a Harness under a versioned policy set. The Harness Runtime enforces that allocation, the policy set's budget caps, and ReBAC checks in code. Prose in the manifest cannot expand the allocation — the Runtime checks and refuses. Code wins.

**Q: What are the five policy sets?**
A: Development default, Staging default, Production default, Production strict, and Production federated. Each is named and versioned and declares trust tier, signature requirement, BYOM constraints, capability allow/deny, audit level, retention, and budget ceilings (token, tool-call, and wall-time limits). A Harness references one by ID.

**Q: Is the enforcement deterministic, or does the model decide?**
A: Enforcement is deterministic and coded. ReBAC checks, budget caps, HITL gates, and output redaction live in platform code, not in the model's interpretation. Prose handles flexible reasoning — role descriptions, hand-off conditions — but when prose contradicts a structured policy, the policy wins, every time.

**Q: How do auditors get proof of access?**
A: Provenance is a universal sink on the Substrate: every result is traceable to where it came from and how it was produced, and every node, relationship, query, and audit log carries an `organization_id`. Combined with versioned policy sets and ReBAC, that gives auditors an inspectable record rather than a verbal assurance.

---
**Internal links:** [/glossary/rebac](/glossary/rebac) (first-use), [/glossary/capability](/glossary/capability), [/glossary/harness](/glossary/harness), [/glossary/actor](/glossary/actor), [/glossary/agent](/glossary/agent); Related capabilities (governance triangle): [/platform/human-in-the-loop](/platform/human-in-the-loop), [/platform/metering](/platform/metering); plus [/platform/harness-model](/platform/harness-model); Solution: [/solutions/regulated](/solutions/regulated); control claims → [/security](/security); up-link [/platform](/platform).
**Notes for build:** Breadcrumb Home › Platform › ReBAC governance; emit BreadcrumbList + FAQPage + TechArticle JSON-LD; reference DefinedTerm /glossary/rebac via link, not duplicate schema. Skeptical-CISO page — every claim must survive a procurement security review verbatim. Policy-set figures are from the Structured Governance Taxonomy v1.0; if the taxonomy revises, update the numbers here. Two-layer enforcement diagram beside §"How it works".
