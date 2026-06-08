---
title: Security & data sovereignty | Oraclous
meta_description: Data-sovereign AI agents by design — structural org isolation, your encryption keys, ReBAC, provenance, and policy-set budget caps. Self-host or cloud, identical guarantees.
url: /security
diagram: layer-stack
page_type: pillar
primary_persona: C — Security & compliance leader (with E — Federation owner)
primary_query: data sovereignty AI / sovereign AI platform
secondary_queries: [enterprise AI agent security, how to control what an AI agent can access, customer-managed encryption keys AI, AI agents for regulated industries, ReBAC for AI, air-gapped AI agents, HIPAA SOC2 AI agent platform]
schema: [WebPage, FAQPage, BreadcrumbList, Organization]
primary_cta: Review the trust model → /platform/rebac-governance
secondary_cta: Book a security walkthrough → /how-it-works
---

# Security & data sovereignty at Oraclous
Control you can prove — not control you have to take on trust. Oraclous makes isolation structural and puts the encryption keys in your hands, whether you self-host or run on our cloud. The guarantees are identical in both modes, and every one of them traces to a documented architectural decision you can read.
[Review the trust model →](/platform/rebac-governance)

## How does Oraclous keep our data sovereign?

Cross-organisation data flow isn't restricted at Oraclous. It's impossible. Every node, relationship, query, cache entry, and audit log on the Substrate carries an `organization_id` that every query must filter on, so there is no path for one organisation's data to reach another. [Credentials](/glossary/byom) never leave the [Credential Broker](/glossary/credential-broker) in plaintext, and in cloud mode KMS separation means Oraclous-the-company cannot unilaterally decrypt your state. This is the page a security reviewer reads before procurement — so every claim below names the mechanism that enforces it.

> **Citable answer** — Oraclous keeps data sovereign through structural isolation: every record carries an `organization_id` that every query filters on, making cross-organisation data flow impossible rather than merely disallowed. Credentials never leave the broker in plaintext, and in cloud mode key-management separation means Oraclous staff cannot decrypt customer state.

## How is one organisation isolated from another?

Isolation at Oraclous is not a permission setting that can be misconfigured — it is a property of the [Substrate](/glossary/substrate) itself. The Substrate is the platform's trust root: it owns identity, the [ReBAC](/glossary/rebac) graph, knowledge graphs, credentials, audit, metering, task boards, and manifests. Every storage primitive on it carries an `organization_id`, and every query is required to filter on it. Because the boundary is enforced at the data layer rather than at the application layer, there is no "admin override" or aggregation query that can cross it — cross-organisation traversal is structurally impossible.

[Federation](/glossary/federation) operates *inside* this boundary, never across it. When one workspace requests another's [Capabilities](/glossary/capability), the request is governed by ReBAC and the cross-workspace traversal is metered and provenance-tracked. Federation is cross-*workspace*, within a single organisation — never cross-organisation. Read the mechanism in detail on [data sovereignty by design](/security).

> **Citable answer** — In Oraclous, each organisation is isolated by an `organization_id` carried on every stored node, relationship, query, cache entry, and audit log, enforced at the Substrate. Cross-organisation data flow is structurally impossible. Federation allows controlled cross-*workspace* requests under ReBAC, but never crosses the organisation boundary.

## How do you control what an AI agent can access?

Access in Oraclous is governed by [ReBAC](/glossary/rebac) — relationship-based access control, where permissions follow the relationships between people, [Agents](/glossary/agent), workspaces, and data, rather than static roles. **Contrast with RBAC:** role-based access control grants access by an assigned role and suffers "role explosion" as exceptions accumulate; ReBAC grants access by an entity's relationship to the specific resource, so the same fabric that runs the work also proves who could touch what, and why. Oraclous enforces ReBAC platform-wide, at the [Harness](/glossary/harness) level.

On top of relationship-based access, every Harness execution runs under a versioned **policy set** — a governance envelope that declares the rules a run is held to. Oraclous ships five named, versioned sets, from `development-default` through `production-strict` to `production-federated`. Each declares its trust tier, budget ceilings (token, wall-time, and tool-call caps), signature requirements, [BYOM](/glossary/byom) constraints, a capability allowlist/denylist, audit level, and retention. `production-strict`, for example, caps a run at 20,000 tokens and 60 seconds, restricts BYOM to Anthropic-native, and forbids `shell-exec` and `arbitrary-http` outright. You can read every set line by line in the Structured Governance Taxonomy.

Crucially, an [Agent](/glossary/agent) cannot talk its way past these limits. Governance lives in **code**; flexibility lives in **prose**; **code wins**. A prose instruction inside an OHM manifest that tries to bypass a [human-in-the-loop](/glossary/human-in-the-loop) gate, expand a capability allocation, or consume more budget is refused by the Runtime regardless of what the prose says.

> **Citable answer** — Oraclous controls AI-agent access with ReBAC — relationship-based access control enforced platform-wide at the Harness level — plus a versioned policy set per run that caps tokens, wall-time, and tool calls and declares an explicit capability allow/denylist. Coded enforcement always overrides prose instructions, so an agent cannot expand its own permissions.

## Who holds the encryption keys?

You do. Customer state at rest is encrypted under key material the customer controls. The [Credential Broker](/glossary/credential-broker) is the Substrate's secret keeper: it stores credentials — [BYOM](/glossary/byom) provider keys, OAuth tokens — under per-organisation encryption, and resolves them on demand only for authorised invocations. Credentials never leave the broker in plaintext and are never cached outside it.

In cloud-hosted mode, KMS separation ensures Oraclous-the-company cannot unilaterally decrypt your state by virtue of operating the platform (ADR-008). This is the difference that matters to a CISO: it is not a policy promise that staff won't look — it is an architecture in which staff *can't*. Support and debugging happen with your participation, not in lieu of it. See how this works with model credentials on [BYOM](/platform/byom).

> **Citable answer** — The customer holds the encryption keys. Customer state at rest is encrypted under customer-controlled key material, and the Credential Broker keeps credentials under per-organisation encryption that never leaves it in plaintext. In cloud mode, key-management separation means Oraclous staff cannot decrypt customer state by virtue of operating the platform.

## What can auditors see?

[Provenance](/glossary/provenance-audit) is a universal sink on the [Substrate](/glossary/substrate): a traceable record of where every result came from and how it was produced. Combined with ReBAC and the versioned policy sets, it gives auditors proof rather than promises. Every node, relationship, query, and audit log carries an `organization_id`, and every Harness execution writes provenance through.

How much is captured, and for how long, is set by the policy set the run uses. `audit.level` ranges from `summary` to `full`, and `retention_days` from 30 to 730 — `production-strict` retains full audit detail for two years. Separately, [metering](/platform/metering) records consumption — tokens, tool invocations, storage, execution time, and cross-workspace traversals — per organisation and per workspace. Metering measures neutrally; it does not set prices, so the measurement an auditor reads is the same measurement, untainted by billing incentives. See the audit and governance story on [agent governance & audit](/security).

> **Citable answer** — Auditors see provenance — a traceable record of where every result came from — plus the ReBAC graph and the versioned policy set each run executed under. Audit level and retention are declared per policy set, ranging up to full detail retained for 730 days, and metering records consumption neutrally, independent of pricing.

## Is the cloud-hosted mode compliant?

Here we are deliberately precise, because over-claiming compliance is exactly what a procurement review punishes.

**What is true today:** cloud-hosted Oraclous delivers *equivalent data sovereignty* to self-hosted Oraclous, as an accepted architectural decision (ADR-008). Customer state at rest is encrypted under customer-controlled keys; Oraclous staff cannot decrypt it by virtue of operating the platform; debugging happens with the customer's participation, and every administrative access is audited.

**What is roadmap, not yet certified:** ISO 27001 and SOC 2 Type II are on the compliance roadmap for the hosted mode. They are **not certified today**, and we will not list them as if they were. We say this plainly because the honesty *is* the differentiator — you should be able to check every line on this page against the architecture and find it exactly true. When a certification is achieved, it will be stated here with its scope and date, and nowhere before.

> **Citable answer** — Cloud-hosted Oraclous provides data sovereignty equivalent to self-hosting today: customer-controlled encryption keys and staff who cannot decrypt customer state by virtue of operating the platform (ADR-008). ISO 27001 and SOC 2 Type II are on the roadmap and are not certified yet — Oraclous states this rather than implying certification it does not hold.

## Can we run it air-gapped or on-premise?

Yes. Oraclous is open source and the platform is platform-as-code, so the entire substrate can be deployed and versioned on your own infrastructure through normal engineering practice — including isolated and air-gapped environments. Self-hosting carries the same data-sovereignty guarantees described above; the difference is operational, not architectural. Self-hosting is the *option*, not the *obligation* — see the [open source](/open-source) story for what's inspectable and forkable, and the [regulated-industries solution](/solutions/regulated) for the deployment posture security teams adopt.

> **Citable answer** — Yes. Oraclous is open source and platform-as-code, so the whole substrate self-hosts on your own infrastructure, including isolated and air-gapped environments. Because every record carries an `organization_id` enforced at the data layer, self-hosted and cloud-hosted modes carry identical data-sovereignty guarantees — the difference is operational, not architectural, never a weaker isolation story.

## What happens to our data when we leave?

Your work is portable. Every [Harness](/glossary/harness) serialises to [OHM](/glossary/ohm) — the open Oraclous Harness Manifest — which is the canonical hub every export routes through, so you can leave without re-implementing. And we tell you exactly how far that goes: OHM carries your harness definitions; knowledge-graph data exports through standard formats (Neo4j / RDF / JSON-LD); and credentials, the ReBAC graph, and accumulated [Consciousness](/glossary/consciousness) learning records do **not** travel. We state these limits up front, on the [portability](/platform/portability) page, not in fine print — so there are no surprises at exit.

> **Citable answer** — On exit, your harnesses leave with you through OHM, the open manifest format every export routes through, and knowledge-graph data exports via standard formats. Oraclous documents the limits plainly: credentials, the ReBAC graph, and Consciousness learning records do not travel — disclosed up front so there are no surprises.

## Frequently asked questions

**Q: How do you control what an AI agent can access?**
A: Through ReBAC — relationship-based access control enforced at the Harness level — plus a versioned policy set per run that caps tokens, wall-time, and tool calls and declares a capability allow/denylist. Coded enforcement overrides any prose instruction, so an agent cannot expand its own permissions.

**Q: Can hosted vendors (including Oraclous) see my data?**
A: No. In cloud-hosted mode, customer state is encrypted under customer-controlled keys and KMS separation means Oraclous staff cannot decrypt it by virtue of operating the platform (ADR-008). Support and debugging happen with your participation, not in your absence.

**Q: Can AI agents run air-gapped or on-premise?**
A: Yes. Oraclous is open source and platform-as-code, so it self-hosts on your own infrastructure, including air-gapped environments, with the same data-sovereignty guarantees as the cloud mode. The difference between modes is operational, not architectural.

**Q: Is there a HIPAA or SOC 2 AI agent platform here today?**
A: Oraclous provides architectural data sovereignty — structural org isolation and customer-held keys — today. ISO 27001 and SOC 2 Type II are on the roadmap and not yet certified, and we say so rather than implying certifications we do not hold. Self-hosting lets regulated teams meet their own control requirements directly.

**Q: What is the most secure way to run AI agents for regulated industries?**
A: Run them where isolation is structural and you hold the keys. Oraclous makes cross-organisation data flow impossible at the data layer, keeps credentials encrypted in a broker that never releases them in plaintext, and lets you self-host — including air-gapped — with the same guarantees as the cloud. See the regulated-industries solution.

---
**Internal links:** Down/across to [/platform/rebac-governance](/platform/rebac-governance), [/platform/byom](/platform/byom), [/platform/metering](/platform/metering), [/platform/portability](/platform/portability), [/platform/human-in-the-loop](/platform/human-in-the-loop); to problem page [/security](/security) and [/security](/security); to solution [/solutions/regulated](/solutions/regulated); to [/open-source](/open-source); Glossary first-use links to rebac, data-sovereignty, byom, ohm, credential-broker, substrate, federation, harness, agent, capability, provenance--audit, consciousness, human-in-the-loop. Receives links from every page that makes a control/sovereignty claim (internal-linking §6 rule 5).
**Notes for build:** Schema set WebPage + FAQPage + BreadcrumbList + Organization reference. Breadcrumb: Home › Security (single crumb). Primary CTA "Review the trust model" → /platform/rebac-governance; secondary "Book a security walkthrough" → /how-it-works (followed conversion link, not nofollow). Render policy-set caps (`production-strict`: 20k tokens / 60s / no shell-exec) as a small table or callout if design allows. Do NOT render ISO 27001 / SOC 2 as a compliance badge — they are roadmap, text-only, until certified. `organization_id` rendered as inline code throughout.
