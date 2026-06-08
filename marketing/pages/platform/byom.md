---
title: BYOM — bring any model, never get locked in
meta_description: BYOM in Oraclous runs the model provider you choose — Anthropic-native, OpenAI-compatible, or Gemini-compatible. Switch by config, never rewrite the Harness.
url: /platform/byom
diagram: model-swap
page_type: cluster
primary_persona: ML / multi-model team lead
primary_query: BYOM AI agent platform
secondary_queries: [bring your own model AI agent, use Claude GPT Gemini one platform, switch LLM without rewriting agent, where do model API keys live]
schema: [BreadcrumbList, FAQPage, TechArticle]
primary_cta: Configure BYOM → /how-it-works
secondary_cta: Read ADR-007 → /developers
---

# BYOM — bring any model, never get locked in

Bring your own model provider: [BYOM](/glossary/byom) — bring your own model — runs the LLM *you* choose across three protocol shapes. The model is a resource your [Agent](/glossary/agent) uses, not the Agent itself — so you change providers by config and the work definition never moves.

[See BYOM →](/platform/byom) [Read ADR-007 →](/platform)

> *Hero visual (build note): one Harness in the centre with three interchangeable model plugs — Anthropic-native, OpenAI-compatible, Gemini-compatible — swapping in beneath it while the Harness stays fixed.*

## What is BYOM?

BYOM means Oraclous runs the language-model provider you choose, treating the LLM as a resource an [Agent](/glossary/agent) uses rather than the Agent itself. The Agent owns the identity, the role, the [capability](/glossary/capability) allocation, and the policy envelope; the model is just the reasoning engine plugged in underneath it. That separation is the whole point — change the engine without rebuilding the vehicle.

Three protocol shapes are supported in v1: **Anthropic-native** (the Anthropic Messages API shape), **OpenAI-compatible** (the OpenAI Chat Completions shape), and **Gemini-compatible** (the Google Generative Language shape). Between them they reach Claude, GPT-class models, Gemini, and any local or self-hosted model that speaks one of those three wire protocols.

> **Citable answer — What is BYOM?** BYOM (Bring Your Own Model) means Oraclous runs the language-model provider you choose, treating the LLM as a resource an Agent uses rather than the Agent itself. It supports three protocol shapes — Anthropic-native, OpenAI-compatible, and Gemini-compatible — so you can run Claude, GPT, Gemini, or a local model, and switch providers by config without rewriting the Harness.

[What is BYOM? →](/glossary/byom) · [What is an Agent? →](/glossary/agent)

## How does BYOM work?

Model configuration resolves at three levels: the agent, the [workspace](/glossary/workspace), or the [organisation](/glossary/organisation). Set a default for the whole organisation, override it for one workspace, and override that again for a single Agent that needs a specific model for a specific job — the most local setting wins. Because the configuration is resolved at runtime, you can run two providers side by side in the same [Harness](/glossary/harness): one Agent on Claude, another on a Gemini-compatible endpoint, scored against each other on the same task.

Switching providers is a configuration change, not a code change. The Harness describes *what* gets done; the model config describes *which engine reasons over it*. Point an Agent at a different protocol shape and the orchestration spec, the actor roster, the policy envelope, and the task board all stay exactly as they were. There is no agent code to rewrite, because in Oraclous you don't write agent code — you describe the goal and the platform compiles it.

Your provider keys live in the [Credential Broker](/glossary/credential-broker), never in the Harness and never in plaintext. The BYOM credential is envelope-encrypted — stored encrypted under your organisation's KMS-controlled wrapping key — and resolved per invocation, never cached outside the broker. In cloud-hosted mode, the wrapping key lives in customer-controlled key material, so Oraclous-the-company cannot unilaterally decrypt your model keys (ADR-008). You hold the keys, literally.

## Why does BYOM matter?

Most agent platforms bind you to one model vendor: switching means rewriting agent code, and your cost and quality ceiling is whatever that vendor sets. BYOM removes the bind. You tune for cost or quality by moving providers, you adopt a newer or cheaper model the week it ships, and you keep leverage in every vendor negotiation — because leaving is a config edit, not a migration. This is the freedom a [multi-model team](/solutions/multi-model) cares about most: the model is a dial you turn, never a wall you're trapped behind.

BYOM is one third of the openness story. It pairs with [MCP & widgets](/platform/mcp-widgets) — connect to the broader tool ecosystem both ways — and [Portability](/platform/portability) — leave the platform itself without re-implementing — so the model, the tools, and the work are each independently yours to move.

## Frequently asked questions

**Q: What does "bring your own model" mean?**
A: Bring your own model means you supply the LLM provider and credentials, and the platform runs against them rather than forcing one built-in model. In Oraclous the LLM is a resource an Agent uses, configured by you and resolved at agent, workspace, or organisation level — so model choice stays yours, not the platform's.

**Q: Can I use Claude, GPT, Gemini, or a local model?**
A: Yes. BYOM supports three protocol shapes — Anthropic-native, OpenAI-compatible, and Gemini-compatible — which between them cover Claude, GPT-class models, Gemini, and any local or self-hosted model that speaks one of those wire protocols. You can run several side by side in the same Harness.

**Q: Where do my model keys live?**
A: In the Credential Broker, envelope-encrypted under your organisation's KMS-controlled wrapping key — never in the Harness and never in plaintext. Keys are resolved per invocation and never cached outside the broker. In cloud mode, the wrapping key is customer-controlled, so Oraclous cannot unilaterally decrypt them.

**Q: Does switching models change the harness?**
A: No. The Harness describes what gets done; model config describes which engine reasons over it. Switching providers is a configuration change resolved at runtime — the orchestration spec, actor roster, policy envelope, and task board stay unchanged. There is no agent code to rewrite, because you describe goals, not code.

---
**Internal links:** [/glossary/byom](/glossary/byom) (first-use term · primary definition), [/glossary/agent](/glossary/agent), [/glossary/capability](/glossary/capability), [/glossary/harness](/glossary/harness), [/glossary/workspace](/glossary/workspace), [/glossary/organisation](/glossary/organisation), [/glossary/credential-broker](/glossary/credential-broker); Solution: [/solutions/multi-model](/solutions/multi-model); sibling capabilities (openness/interop triangle, internal-linking §2.1): [/platform/mcp-widgets](/platform/mcp-widgets), [/platform/portability](/platform/portability); up-link [/platform](/platform); control/sovereignty claims (keys, can't-decrypt) → [/security](/security) per internal-linking §6.5; ADR mention → [/developers](/platform) + [/open-source](/open-source); console CTA → /how-it-works (followed).
**Notes for build:** `TechArticle` + `FAQPage` + `BreadcrumbList` JSON-LD; breadcrumb Home › Platform › BYOM. Do not restate the canonical BYOM definition as schema — link `/glossary/byom` (DefinedTerm) per template. Source: ADR-007 (three protocol shapes; envelope-encryption), §2 conceptual model (LLM as resource), harness-runtime config resolution (agent → workspace → organisation), credential-broker-service (BYOM credentials, per-invocation resolution), ADR-008 (KMS separation). NEVER write "Bedrock" — the v1 third shape is Gemini-compatible (ADR-007 supersedes §2's draft). Citable answer block is the liftable BYOM definition; keep it 40–60 words.
