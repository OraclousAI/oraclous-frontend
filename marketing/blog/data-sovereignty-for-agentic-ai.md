---
title: "Data sovereignty for agentic AI: self-hosted vs cloud"
slug: data-sovereignty-for-agentic-ai
url: /blog/data-sovereignty-for-agentic-ai
meta_description: Data sovereignty for agentic AI explained — what self-hosted vs cloud-with-your-keys actually guarantees, and why KMS separation matters more than location.
primary_query: data sovereignty AI / sovereign AI platform
secondary_queries: [data sovereignty for AI agents, self-hosted vs cloud AI agents, customer-managed encryption keys AI, who can decrypt my AI data, sovereign AI platform for regulated industries]
schema: [Article, Person, FAQPage, BreadcrumbList]
author: "[TBD — author byline; E-E-A-T: needs a named author + bio]"
date_published: "[TBD]"
date_modified: "[TBD]"
category: Architecture
reading_time: 9
---

# Data sovereignty for agentic AI: self-hosted vs cloud

When the thing reading your data is a person, "we trust the vendor" is a manageable risk. When it is an [Agent](/glossary/agent) — software with its own identity, joining and acting on your records at machine speed, often unattended — the bar rises. Sovereignty stops being a procurement checkbox and becomes an architectural question: what can the Agent reach, whose data can it touch, and who else can decrypt the state it leaves behind? The self-hosted-versus-cloud debate usually misses that this is about *who holds the keys*, not *where the servers sit*.

> **Citable answer** — [Data sovereignty](/glossary/data-sovereignty) for agentic AI means your organisation's data stays under your control regardless of who operates the platform. It is not primarily about server location: a self-hosted platform with a leaky access model has less sovereignty than a cloud platform where key-management separation means the vendor cannot decrypt your state. The decisive factors are isolation and who holds the keys.

## What does data sovereignty mean for agentic AI?

Data sovereignty is the property that your organisation's data stays under *your* control — not your vendor's policy, good intentions, or roadmap. For agentic AI the standard is higher than for ordinary SaaS, because the actor is no longer a human reading one record. It is an Agent reading, joining, and acting on data across systems, at speed, frequently without a person watching each step. If you cannot say with certainty what that Agent can reach and who can decrypt what it produces, you do not have sovereignty — you have a promise.

This is where the usual security pitch answers a different question. "Enterprise-grade security" and SOC 2 attestations are real and useful, but they describe the *vendor's operational controls* — whether the vendor behaves well — not whether the vendor *can* read your data. Those are not the same guarantee. For regulated work, the second one is the one that survives a procurement security review.

It is also why "just self-host it" is an incomplete answer. Self-hosting helps, but a platform can run on your own servers and still leak data between teams through a weak access model, or still cache a credential in plaintext in a log. Sovereignty is not a deployment location. It is a set of guarantees that hold no matter who operates the platform — and those guarantees have to be built into the architecture, not bolted on as a policy.

## Self-hosted vs cloud: what each mode actually guarantees

The honest framing is that self-hosted and cloud are two operational choices that should carry the *same* sovereignty guarantees — and where they diverge, you should know exactly how.

| | Self-hosted | Cloud (with your keys) |
|---|---|---|
| **Where it runs** | Your infrastructure | The vendor's infrastructure |
| **Who operates it** | You | The vendor |
| **What "sovereignty" depends on** | Your access model + your key handling | The vendor's isolation architecture + key-management separation |
| **Can the vendor read your data?** | No vendor in the loop | Only if the architecture lets it — the question to ask |
| **The real trade** | Control, in exchange for running it | Operations off your plate, *if* the guarantees hold |
| **What does NOT change it** | — | The data still belongs to you; location is not the guarantee |

The point of the table is the bottom-right cell. A credible cloud mode is not "trust us not to look." It is an architecture in which the vendor *can't* look, because the keys that decrypt your state are not the vendor's to use. If a cloud platform can give you that, the choice between self-hosted and cloud becomes an operational preference — who runs the machines — rather than a sovereignty compromise.

## Why key separation matters more than location

The single most decisive mechanism in sovereign agentic AI is **key-management separation**: customer state at rest is encrypted under key material the customer controls, so the vendor cannot unilaterally decrypt it by virtue of operating the platform. This is the line that matters to a CISO. It is not a promise that staff won't look — it is an architecture in which they can't.

Oraclous's [ADR-008](/platform) makes this an explicit architectural decision: in cloud-hosted mode, "Oraclous staff cannot decrypt customer state by virtue of operating the platform," and "support and debugging happen with the customer's participation, not in lieu of it." Credentials get the same treatment — they live in the [Credential Broker](/glossary/credential-broker), never leave it in plaintext, and are never cached outside it. That is what "you hold the keys" means in practice, and it is checkable, not aspirational.

Key separation pairs with structural isolation. At Oraclous, cross-organisation data flow is not *restricted* — it is structurally impossible. Every node, relationship, query, cache entry, and audit log on the [Substrate](/glossary/substrate) carries an `organization_id` that every query must filter on (Platform Architecture v1.1 §2). There is no admin override and no aggregation query through which one [organisation's](/glossary/organisation) data can reach another, because the isolation lives at the data layer, not in an application setting that could be misconfigured. [Federation](/glossary/federation) operates *inside* this boundary — one workspace can request another's [capabilities](/glossary/capability) under [ReBAC](/glossary/rebac) — but it is cross-*workspace*, never cross-organisation.

Together those two mechanisms answer the agentic-AI sovereignty question directly: isolation bounds *what an Agent can reach*, and key separation bounds *who can decrypt what it produces*. Crucially, both hold identically whether you self-host or run on Oraclous's cloud — the difference between modes is operational, not architectural (ADR-008).

## The honest limits — said out loud

Sovereignty earns trust by naming its exceptions, so here are Oraclous's.

**Name the boundaries, in writing.** In cloud mode, staff cannot decrypt your state by virtue of operating the platform, and every administrative access is audited (ADR-008). The boundary worth naming is at exit: an OHM export carries your harnesses and your knowledge-graph data, but not the ReBAC graph, credentials, or Consciousness records. The disclosure is the credibility: the guarantee you can verify is the one with its boundaries named.

**There is a boundary at exit.** Sovereignty keeps your data yours while you run the platform and when you leave — but raw knowledge-graph data leaves through standard export formats (Neo4j dumps, RDF, JSON-LD), not through the manifest, and credentials never leave the broker at all. The [Portability](/platform/portability) page states exactly what travels and what doesn't.

**Compliance certifications are a roadmap item, not a claim.** ISO 27001 and SOC 2 Type II are *target* certifications for Oraclous's cloud-hosted mode — in-programme, not yet certified. The sovereignty guarantee here is *architectural* (ADR-008, §2), and it stands on its own; we frame the certifications honestly as roadmap rather than as something already achieved.

For the consolidated trust model see the [security page](/security); for how sovereignty maps to a deployment posture, see the [regulated-industries solution](/solutions/regulated) and [data sovereignty in Why Oraclous](/security).

## Frequently asked questions

**Q: What is data sovereignty for AI?**
A: Data sovereignty is the guarantee that your organisation's data stays under your control regardless of who operates the platform. For agentic AI it means knowing exactly what each Agent can reach, that cross-organisation data flow is impossible, and that the vendor cannot decrypt your state. The strongest versions are architectural guarantees, not policy promises.

**Q: Is self-hosting required for data sovereignty?**
A: No. Self-hosting helps but is not sufficient on its own — a self-hosted platform can still leak between teams or cache credentials in plaintext. Sovereignty depends on isolation and who holds the keys. A cloud platform with key-management separation, where the vendor cannot decrypt your state, can offer the same guarantee as self-hosting.

**Q: Can a cloud AI vendor see my data?**
A: Only if the architecture allows it — which is the question to ask. With key-management separation, customer state is encrypted under customer-controlled keys, so the vendor cannot unilaterally decrypt it by virtue of operating the platform. Oraclous documents this in ADR-008; debugging happens with your participation, not in your absence.

**Q: What is the difference between self-hosted and cloud for sovereignty?**
A: The difference should be operational, not architectural. Self-hosted means you run the machines; cloud means the vendor does. If both carry the same isolation and customer-held-key guarantees — as Oraclous's ADR-008 specifies — then choosing between them is about who handles operations, not about giving up control of your data.

**Q: Why does agentic AI raise the sovereignty bar?**
A: Because the actor is an Agent, not a person. An Agent reads, joins, and acts on data across systems at machine speed and often unattended, so an over-broad reach or a vendor that can decrypt your state is exercised at scale. That makes structural isolation and key separation more important than for ordinary SaaS.

---
**Internal links:** [/glossary/data-sovereignty](/glossary/data-sovereignty) (first-use term · primary definition), [/glossary/agent](/glossary/agent), [/glossary/substrate](/glossary/substrate), [/glossary/organisation](/glossary/organisation), [/glossary/credential-broker](/glossary/credential-broker), [/glossary/federation](/glossary/federation), [/glossary/capability](/glossary/capability), [/glossary/rebac](/glossary/rebac); Why-Oraclous [/security](/security); Platform capability [/platform/portability](/platform/portability); Solution [/solutions/regulated](/solutions/regulated); trust hub [/security](/security); ADR mention → [/developers](/platform); related articles [/blog/rebac-vs-rbac-for-ai-agents](/blog/rebac-vs-rbac-for-ai-agents), [/blog/byom-bring-your-own-model](/blog/byom-bring-your-own-model); up-link [/blog](/blog). Every control/sovereignty claim links to /security per internal-linking §6.5.
**Notes for build:** Schema Article + Person (named author + bio, E-E-A-T) + FAQPage + BreadcrumbList. Breadcrumb Home › Blog › Data sovereignty for agentic AI. E-E-A-T: author/byline/dates `[TBD]`. Do NOT render ISO 27001 / SOC 2 as badges — they are *target* certs for hosting (roadmap), explicitly framed as not-yet-achieved; the sovereignty claim is architectural (ADR-008 / §2). Render `organization_id` as inline code throughout. The "honest limits" section is load-bearing for credibility — keep prominent, not fine print. Diagram suggestion: two deployment columns (self-hosted / cloud) sharing one "identical guarantees" bar, with a KMS-separation callout on the cloud side. Primary CTA: Review the trust model → /security; secondary: See the regulated solution → /solutions/regulated.
