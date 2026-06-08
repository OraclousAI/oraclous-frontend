---
title: "BYOM: why an agent platform shouldn't lock your LLM"
slug: byom-bring-your-own-model
url: /blog/byom-bring-your-own-model
meta_description: BYOM explained — bring your own model so your agent platform never locks you to one LLM. The three protocol shapes, LLM-as-resource, no token markup, portability.
primary_query: bring your own model / BYOM LLM
secondary_queries: [BYOM AI agent platform, model-agnostic AI agents, no vendor lock-in AI, use Claude GPT Gemini one platform, switch LLM without rewriting agent]
schema: [Article, Person, FAQPage, BreadcrumbList]
author: "[TBD — author byline; E-E-A-T: needs a named author + bio]"
date_published: "[TBD]"
date_modified: "[TBD]"
category: Models
reading_time: 8
---

# BYOM: why your agent platform shouldn't lock you to one LLM

The fastest-moving part of your stack is the model. A cheaper one ships, a better one ships, your provider changes its terms — and the question is whether adopting the change is a config edit or a rewrite. On most agent platforms it is a rewrite, because the agent is built against one vendor's SDK and the model is welded to the agent. BYOM is the design that pulls them apart, so the model becomes a dial you turn rather than a wall you are trapped behind.

> **Citable answer** — [BYOM](/glossary/byom) (Bring Your Own Model) means the platform runs the language-model provider *you* choose, treating the LLM as a resource an [Agent](/glossary/agent) uses rather than the Agent itself. With BYOM you can run Claude, GPT-class models, Gemini, or a local model and switch providers by configuration — without rewriting your agents — so a fast-moving model market never becomes a migration project.

## What is BYOM?

BYOM, bring your own model, means an agent platform runs the model provider and credentials *you* supply, rather than forcing one built-in model on you. The decisive idea underneath it is that the LLM is a *resource the Agent uses*, not the Agent itself. The [Agent](/glossary/agent) owns the identity, the role, the [capability](/glossary/capability) allocation, and the policy envelope; the model is the reasoning engine plugged in beneath it. Change the engine without rebuilding the vehicle.

This is not a niche term Oraclous invented. BYOM is an established enterprise concept — Palantir, GitLab, UiPath, Salesforce, and Microsoft all use "bring your own model" for connecting your own or self-hosted models for sovereignty and compliance ([palantir.com](https://www.palantir.com/docs/foundry/aip/bring-your-own-model), [about.gitlab.com](https://about.gitlab.com/blog/agentic-ai-enterprise-control-self-hosted-duo-agent-platform-and-byom/)). The pattern is mainstream; what varies is how deeply a platform actually decouples the model from the work.

## The three protocol shapes — and why "Bedrock" is the wrong mental model

A platform supports BYOM by speaking the model providers' wire protocols. Oraclous's [ADR-007](/platform) defines three BYOM **protocol shapes**, and the framing matters: BYOM is about protocol compatibility, not a particular cloud's model marketplace.

| Protocol shape | API shape it speaks | Reaches |
|---|---|---|
| **Anthropic-native** | Anthropic Messages API | Claude models |
| **OpenAI-compatible** | OpenAI Chat Completions | GPT-class models and any endpoint speaking that shape |
| **Gemini-compatible** | Google Generative Language API | Gemini, and compatible endpoints |

Between them, the three shapes cover Claude, GPT-class models, Gemini, and — importantly — any local or self-hosted model that speaks one of those three wire protocols. That is why the mental model is "which protocol does it speak," not "which managed marketplace is it in." A local model behind an OpenAI-compatible server is just as much a BYOM target as a frontier hosted model; the platform does not care, because it resolves the protocol shape at runtime.

## How does BYOM work in practice?

Model configuration resolves at three levels: the [Agent](/glossary/agent), the [workspace](/glossary/workspace), or the [organisation](/glossary/organisation). Set an organisation default, override it for one workspace, override that again for a single Agent that needs a specific model for a specific job — the most local setting wins. Because the configuration is resolved at runtime, you can run two providers side by side in the same [Harness](/glossary/harness): one Agent on Claude, another on a Gemini-compatible endpoint, scored against each other on the same task.

Switching providers is a configuration change, not a code change. The Harness describes *what* gets done; the model config describes *which engine reasons over it*. Point an Agent at a different protocol shape and the orchestration spec, the actor roster, the policy envelope, and the task board stay exactly as they were. There is no agent code to rewrite — because in Oraclous you don't write agent code, you describe the goal and the platform compiles it into a Harness.

Your provider keys live in the [Credential Broker](/glossary/credential-broker), never in the Harness and never in plaintext. The BYOM credential is envelope-encrypted under your organisation's KMS-controlled wrapping key and resolved per invocation, never cached outside the broker. In cloud-hosted mode, that wrapping key is customer-controlled, so the platform cannot unilaterally decrypt your model keys (ADR-008). BYOM and [data sovereignty](/blog/data-sovereignty-for-agentic-ai) are the same story told from two angles: the model is yours, and so are the keys that run it.

## Why BYOM matters: cost, quality, and the exit

Locking an agent platform to one LLM costs you on three fronts, and BYOM addresses each.

- **Cost.** When the model is welded to the platform, your cost ceiling is whatever that vendor sets, and some platforms add a markup on top of token spend. With BYOM you use your own provider keys, so the platform never sits between you and your token bill — it doesn't touch your model spend. (Competitors like Vellum already advertise "no markup on tokens" as a trust signal; BYOM makes the same point structurally — the spend is on *your* account.)
- **Quality.** Model quality leapfrogs constantly. BYOM lets you adopt a better model the week it ships, A/B two providers on the same task, and route different Agents to different models — without a migration each time.
- **The exit.** Model lock-in is one of three lock-ins (the others are the platform and the day you try to leave). BYOM removes the model lock-in: leaving a provider is a config edit, which keeps you with leverage in every vendor negotiation. The other two are removed by an open platform and [OHM portability](/platform/portability) — together that is what [avoiding vendor lock-in](/platform/portability) actually requires.

A note on governance, because model freedom without it is half a feature: *which* model an Agent may use is itself a [ReBAC](/glossary/rebac)-and-policy decision. The versioned policy sets can constrain BYOM per environment — the production-strict set, for instance, permits Anthropic-native only. So BYOM is freedom *within* governance: you choose the model, and the platform still enforces which choices are allowed where.

## Where Oraclous fits

BYOM is one third of Oraclous's openness story. It pairs with [MCP](/glossary/mcp) (connect to the broader tool ecosystem both ways) and [Portability](/platform/portability) (leave the platform itself without re-implementing) so the model, the tools, and the work are each independently yours to move. For the full mechanism see the [BYOM platform page](/platform/byom); for the definition, the [BYOM glossary entry](/glossary/byom); for the model market caveat — none of these competitors combine BYOM with ReBAC, customer-held keys, and a portable manifest — see the [multi-model solution](/solutions/multi-model).

## Frequently asked questions

**Q: What does "bring your own model" (BYOM) mean?**
A: BYOM means you supply the LLM provider and credentials, and the platform runs against them instead of forcing one built-in model. The LLM is treated as a resource an Agent uses, configured by you and resolved at agent, workspace, or organisation level — so model choice stays yours, not the platform's.

**Q: Can I use Claude, GPT, Gemini, or a local model?**
A: Yes. BYOM supports three protocol shapes — Anthropic-native, OpenAI-compatible, and Gemini-compatible — which between them cover Claude, GPT-class models, Gemini, and any local or self-hosted model that speaks one of those wire protocols. You can even run several side by side in the same Harness.

**Q: Does switching LLMs mean rewriting my agents?**
A: Not with BYOM. The Harness describes what gets done; model config describes which engine reasons over it. Switching providers is a configuration change resolved at runtime — the orchestration spec, actor roster, policy envelope, and task board stay unchanged. In Oraclous there is no agent code to rewrite, because you describe goals, not code.

**Q: Does the platform mark up my token costs?**
A: With BYOM you use your own provider keys, so your model spend is on your own account and the platform does not sit between you and your token bill. Your keys live encrypted in the Credential Broker, resolved per invocation; in cloud mode, key-management separation means the platform cannot unilaterally decrypt them.

**Q: How does BYOM help avoid vendor lock-in?**
A: BYOM removes the model lock-in — leaving an LLM provider is a config edit, not a rewrite. It is one of three pieces; an open, self-hostable platform removes platform lock-in, and a portable manifest (OHM) removes exit lock-in. Together they let you change model, tools, and platform independently.

---
**Internal links:** [/glossary/byom](/glossary/byom) (first-use term · primary definition), [/glossary/agent](/glossary/agent), [/glossary/capability](/glossary/capability), [/glossary/harness](/glossary/harness), [/glossary/workspace](/glossary/workspace), [/glossary/organisation](/glossary/organisation), [/glossary/credential-broker](/glossary/credential-broker), [/glossary/mcp](/glossary/mcp), [/glossary/rebac](/glossary/rebac); Platform capability [/platform/byom](/platform/byom), [/platform/portability](/platform/portability); Why-Oraclous [/platform/portability](/platform/portability); Solution [/solutions/multi-model](/solutions/multi-model); ADR mention → [/developers](/platform); related articles [/blog/data-sovereignty-for-agentic-ai](/blog/data-sovereignty-for-agentic-ai), [/blog/what-is-a-second-mind](/blog/what-is-a-second-mind); up-link [/blog](/blog) and pillar [/platform](/platform). External entity citations (BYOM as established term): palantir.com, about.gitlab.com — `rel="noopener"`, not nofollow. "No lock-in / leave anytime" mention → /platform/portability + /glossary/ohm per internal-linking §6.7.
**Notes for build:** Schema Article + Person (named author + bio, E-E-A-T) + FAQPage + BreadcrumbList. Breadcrumb Home › Blog › BYOM. E-E-A-T: author/byline/dates `[TBD]`. CRITICAL: NEVER write "Bedrock" — the v1 third shape is Gemini-compatible (ADR-007 supersedes §2's draft); the article deliberately reframes the "Bedrock" mental model as wrong. Do not restate the canonical BYOM definition as schema — link /glossary/byom (DefinedTerm). The "no token markup" point is competitive-true (Vellum) framed as structural; keep it as a claim about BYOM economics, not an Oraclous pricing promise (no pricing numbers invented). Diagram suggestion: one fixed Harness with three interchangeable model plugs (Anthropic-native / OpenAI-compatible / Gemini-compatible) swapping beneath it — reuse from /platform/byom. Primary CTA: Configure BYOM → /platform/byom (or /how-it-works); secondary: See how to avoid vendor lock-in → /platform/portability.
