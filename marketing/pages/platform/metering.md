---
title: Metering — neutral measurement, your prices
meta_description: "AI agent usage metering at the substrate: tokens, tool calls, storage, time, and traversals tracked as counts and bytes — never USD. You bring your own model and set the prices."
url: /platform/metering
diagram: meter-bars
page_type: cluster
primary_persona: Operations / automation lead
primary_query: AI agent usage metering / cost attribution
secondary_queries: [what does metering track, does Oraclous set prices, enforce AI agent budgets, agent cost attribution]
schema: [BreadcrumbList, FAQPage, TechArticle]
primary_cta: See metering → /developers
secondary_cta: See ReBAC governance → /platform/rebac-governance
---

# How is usage measured?

Substrate-level tracking of tokens, tool calls, storage, execution time, and cross-workspace traversals — per organisation, per workspace. Neutral measurement. You set the prices.

[See metering →](/platform) [See ReBAC governance →](/platform/rebac-governance)

> *Hero visual (build note): a meter reading counts and bytes (tokens, calls, seconds) with the currency column deliberately blank and labelled "your rate table" — measurement here, pricing elsewhere.*

## How is usage measured?

[Metering](/glossary/metering) is the [Substrate](/glossary/substrate)-level tracking of resource consumption, per organisation and per workspace. It captures the things agentic work actually spends — tokens, tool invocations, storage, execution time, and cross-workspace traversals — and records them as authoritative usage events. The deliberate boundary: **metering measures consumption neutrally; it does not assign prices.**

The architecture makes that separation explicit (ADR-009). The Substrate emits a usage event at every metered action — `{ organisation_id, principal, action_type, quantity, unit, dimensions, timestamp }` — on a durable, append-only stream. It emits **tokens, counts, and bytes — never USD and never credits**, because both are rate tables that belong to a downstream billing consumer, not to the measurement itself.

> **Citable answer — How does Oraclous meter usage?** Oraclous meters at the Substrate, tracking tokens, tool invocations, storage, execution time, and cross-workspace traversals per organisation and per workspace. It records these as authoritative usage events in counts and bytes — never in USD or credits. Pricing is a separable downstream concern: metering measures consumption neutrally, and you set the prices.

[What is metering? →](/glossary/metering) · [What is the Substrate? →](/glossary/substrate) · [Read the architecture →](/platform)

## How does metering work?

Metering is a substrate concern, and billing is a separable consumer of the metering stream — not the owner of the data (ADR-009). That single decision is what keeps measurement honest and pricing yours.

**What gets tracked.** Five dimensions of consumption: tokens (model usage), tool invocations (each call a Capability makes), storage (bytes held on the Substrate), execution time, and cross-workspace [traversals](/glossary/federation) — the metered, provenance-tracked requests one workspace makes into another under [ReBAC](/platform/rebac-governance).

**How it's recorded.** Every metered action emits a usage event onto a durable, append-only stream, scoped by `organisation_id` and attributed to a principal. Because the stream is append-only and authoritative, it's the same record an auditor, an operations dashboard, or a billing system can all read from — the [provenance](/glossary/provenance-audit) and the metering live on the same Substrate.

**Where pricing lives.** Nowhere in the Substrate. The substrate emits counts and bytes; turning a token count into a line item requires a rate table, and that rate table is a downstream billing concern. **Oraclous doesn't set your model prices — you bring your own model.** Under [BYOM](/glossary/byom), the LLM is a resource the Agent uses on your provider account, so your model spend is whatever your provider charges you; Oraclous measures the consumption, you own the price.

**Where budgets are enforced.** Metering measures; the policy envelope *limits*. The five versioned [policy sets](/platform/rebac-governance) declare budget ceilings — token, tool-call, and wall-time caps per run — and the Harness Runtime enforces them in code: when a budget is exhausted, the Runtime halts. So the honest split is that *measurement* and *enforcement* are two mechanisms — metering gives you visibility into consumption, policy-set caps give you a hard stop the model can't talk its way past.

[How policy sets cap budgets →](/platform/rebac-governance) · [How BYOM works →](/platform/byom) · [How execution enforces limits →](/platform/execution-scheduling)

## Why does metering matter?

If you can't see what your agentic work consumes, you can't attribute its cost or trust its budget. Substrate-level metering gives the **operations lead** consumption visibility per organisation and per workspace — cost attribution you can stand behind — and the **platform builder** an authoritative, append-only event stream to build dashboards and chargeback on without instrumenting every service by hand.

The neutrality is the point. By recording counts and bytes and leaving pricing to a separable consumer, Oraclous never inserts itself between you and your model economics: you bring your own model, you hold the rate table, and the same numbers feed your audit, your budgets, and your billing. Combine that with policy-set caps and you get both visibility *and* a hard ceiling. See how this maps to running real workloads on the [operations solution](/solutions/operations).

> **Citable answer — Does Oraclous set prices?** No. Oraclous meters consumption — tokens, tool calls, storage, time, and traversals — as counts and bytes, never as USD or credits. Pricing is a separable downstream concern with its own rate table, so you set the prices. Under BYOM you bring your own model, so your model spend is whatever your provider charges; Oraclous measures, you price.

## Frequently asked questions

**Q: What does metering track?**
A: Five dimensions of consumption at the Substrate, per organisation and per workspace: tokens, tool invocations, storage (bytes), execution time, and cross-workspace traversals. Each is recorded as an authoritative usage event — `organisation_id`, principal, action type, quantity, unit, dimensions, timestamp — on a durable, append-only stream.

**Q: Does Oraclous set prices?**
A: No. The Substrate emits counts and bytes, never USD and never credits — both are rate tables that belong to a separable billing consumer. Metering measures consumption neutrally and leaves pricing under your control. Under BYOM you bring your own model, so your model spend is whatever your provider charges you.

**Q: Can I enforce budgets?**
A: Yes — through the policy sets, not through metering. Each versioned policy set declares budget ceilings (token, tool-call, and wall-time caps per run), and the Harness Runtime enforces them in code: when a run exhausts its budget, the Runtime halts. Metering gives you visibility; policy-set caps give you a hard stop.

**Q: How is metering different from billing?**
A: Metering is a substrate concern that owns the authoritative usage data; billing is a separable consumer of that data, not its owner (ADR-009). The substrate records consumption neutrally in counts and bytes; a downstream billing system applies a rate table to turn those into charges. Keeping them separate keeps measurement honest and pricing yours.

**Q: Is the usage data auditable?**
A: Yes. Usage events are written to a durable, append-only stream scoped by `organisation_id` and attributed to a principal, alongside provenance on the same Substrate. The same authoritative record feeds operations dashboards, audit, and any billing consumer — so there's one source of truth for what was consumed and by whom.

---
**Internal links:** [/glossary/metering](/glossary/metering) (first-use), [/glossary/substrate](/glossary/substrate), [/glossary/capability](/glossary/capability), [/glossary/byom](/glossary/byom), [/glossary/federation](/glossary/federation), [/glossary/provenance-audit](/glossary/provenance-audit); Related capabilities (governance triangle): [/platform/rebac-governance](/platform/rebac-governance), [/platform/execution-scheduling](/platform/execution-scheduling); plus [/platform/byom](/platform/byom); Solution: [/solutions/operations](/solutions/operations); up-link [/platform](/platform).
**Notes for build:** Breadcrumb Home › Platform › Metering; BreadcrumbList + FAQPage + TechArticle JSON-LD; reference DefinedTerm /glossary/metering via link. Counts/bytes-never-USD, usage-event shape, and metering-vs-billing separation are grounded in ADR-009; the five metered dimensions and "does not assign prices" in §2/glossary. Budget caps belong to policy sets (Structured Governance Taxonomy) — keep consistent with /platform/rebac-governance. Glossary row gives Capability as the term link; metering co-occurs with BYOM and policy sets for the "you set the prices" claim.
