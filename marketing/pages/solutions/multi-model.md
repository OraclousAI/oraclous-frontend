---
title: Model-agnostic AI agents — change the model, keep harness
meta_description: Model-agnostic AI agents with BYOM — Anthropic-native, OpenAI-compatible, or Gemini-compatible. Switch providers or run them side by side by config, never rewrite the Harness.
url: /solutions/multi-model
page_type: cluster
primary_persona: ML / multi-model team lead
primary_query: model-agnostic AI agents / multi-model agents
secondary_queries: [BYOM AI agent platform, switch LLM without rewriting agents, run local model with AI agents, where do model API keys live, multi-vendor LLM resilience]
schema: [BreadcrumbList, FAQPage, WebPage]
primary_cta: Configure BYOM → /how-it-works
secondary_cta: Read the BYOM docs → /platform/byom
---

# Change the model. Keep the harness.
You run several models in production and tune for cost, quality, and latency — and you're allergic to anything that hard-couples the work to one provider. Oraclous treats the LLM as a resource the [Agent](/glossary/agent) uses, not the Agent itself: with [BYOM](/glossary/byom) you move between providers, or run them side by side, without touching the work definition.

[See BYOM →](/platform/byom) [Read the BYOM docs →](/platform/byom)

> *Hero visual (build note): one fixed Harness in the centre with three interchangeable model plugs beneath it — Anthropic-native, OpenAI-compatible, Gemini-compatible — swapping in and out while the Harness stays put. A "config change, not a rewrite" label on the swap.*

## Why does switching LLM vendors mean rewriting your agents?

Because most stacks bake the model into the agent. The agent code *is* the vendor — so when a provider shifts on price or quality, or you want to add a local open-weight model to the mix, switching means a rewrite. There's no clean separation between *the work* and *the model that does it*, and your provider credentials end up scattered and hard to govern. That's a poor place to negotiate from, and a worse place to be when a better model ships next week.

Oraclous removes the bind by drawing the line where it belongs: the work is one thing, the model is another. (This is vendor lock-in in full — model, platform, and exit; see [vendor lock-in](/platform/portability).)

## How does Oraclous help multi-model teams?

The model is a dial, not a wall. Oraclous resolves LLM configuration at three levels — agent, [workspace](/glossary/workspace), or [organisation](/glossary/organisation) — across three protocol shapes: Anthropic-native, OpenAI-compatible, and Gemini-compatible. The [Harness](/glossary/harness) describes *what* gets done; the model config describes *which engine reasons over it*. So you switch providers, or run two side by side on the same task, by editing config — the orchestration spec, actor roster, policy envelope, and task board never move. There's no agent code to rewrite, because in Oraclous you describe goals, not agent code.

> **Citable answer — How does Oraclous help multi-model teams?** Oraclous makes the model a resource the Agent uses, not the Agent itself. Through BYOM it resolves LLM config at agent, workspace, or organisation level across three protocol shapes — Anthropic-native, OpenAI-compatible, and Gemini-compatible — so teams move between providers, or run them side by side, by changing config rather than rewriting the Harness.

[What is BYOM? →](/glossary/byom) · [What is an Agent? →](/glossary/agent) · [Vendor lock-in →](/platform/portability)

## How would this work for my team?

Two capabilities carry the multi-model story, each a deeper page on the platform:

- **[BYOM](/platform/byom)** — three protocol shapes (Anthropic-native, OpenAI-compatible, Gemini-compatible) covering Claude, GPT-class models, Gemini, and any local or self-hosted model that speaks one of those wire protocols. Config resolves agent → workspace → organisation, the most local setting winning, so you can run two providers head-to-head in one [Harness](/glossary/harness). Your keys live in the [Credential Broker](/glossary/credential-broker), envelope-encrypted under your organisation's KMS-controlled wrapping key — never in the Harness, never in plaintext, resolved per invocation. In cloud mode, the wrapping key is customer-controlled, so Oraclous cannot unilaterally decrypt your model keys (ADR-008).
- **[MCP & widgets](/platform/mcp-widgets)** — the tool side of openness. Oraclous is an MCP server and an MCP client, so the tools your Agents reach are as portable and vendor-neutral as the models they run on. Model-agnostic *and* tool-agnostic, both governed.

Run frontier and local models under one operational model, route work to the best or cheapest engine per task, and keep every provider credential under the org's control — without the work definition ever knowing which vendor answered.

## How do I know it holds up?

The separation is architectural and documented. ADR-007 specifies the three protocol shapes and the envelope-encryption of provider credentials; §2 of the architecture states the principle that "the LLM is a resource the Agent uses." The `harness-runtime-service` carries the LLM client factory and the agent → workspace → organisation config resolution, and the [Credential Broker](/glossary/credential-broker) holds BYOM credentials, resolved per invocation and never cached outside it. It's open source, so you can verify the model is genuinely decoupled from the work — [read the code](/open-source).

One honest boundary, stated plainly: support is for the **three named protocol shapes**. A provider fits if it speaks the Anthropic-native, OpenAI-compatible, or Gemini-compatible wire protocol — which covers the major frontier APIs and most local runtimes (including Ollama via its OpenAI-compatible endpoint), but we don't claim universal coverage beyond those three. If your provider speaks one of the three shapes, it works; if it doesn't, it's a question of the adapter, and we say so rather than over-claim.

## Frequently asked questions

**Q: What does BYOM mean?**
A: BYOM (Bring Your Own Model) means you supply the model provider and credentials, and Oraclous runs against them, treating the LLM as a resource an Agent uses rather than the Agent itself. Model configuration resolves at agent, workspace, or organisation level — so model choice stays yours, and switching is a config change, not a rewrite.

**Q: Does my provider fit the three protocol shapes?**
A: If it speaks Anthropic-native, OpenAI-compatible, or Gemini-compatible wire protocol, yes. Between them the three shapes cover Claude, GPT-class models, Gemini, and any local or self-hosted model that exposes one of those interfaces. Support is scoped to those three shapes — stated honestly rather than claiming universal coverage.

**Q: Can I run a local model like Ollama?**
A: Yes, if it exposes one of the three supported wire protocols. Local and self-hosted runtimes that expose an OpenAI-compatible endpoint — Ollama among them — work through the OpenAI-compatible shape, so you can run frontier and local models under one operational model, side by side in the same Harness.

**Q: Where do my model keys live?**
A: In the Credential Broker, envelope-encrypted under your organisation's KMS-controlled wrapping key — never in the Harness and never in plaintext. Keys are resolved per invocation and never cached outside the broker. In cloud mode the wrapping key is customer-controlled, so Oraclous cannot unilaterally decrypt your model keys.

**Q: Does switching models change the harness?**
A: No. The Harness describes what gets done; model config describes which engine reasons over it. Switching providers is a configuration change resolved at runtime — the orchestration spec, actor roster, policy envelope, and task board stay unchanged. There is no agent code to rewrite, because you describe goals, not code.

---
**Internal links:** [/glossary/byom](/glossary/byom) (first-use term · primary definition), [/glossary/agent](/glossary/agent), [/glossary/harness](/glossary/harness), [/glossary/workspace](/glossary/workspace), [/glossary/organisation](/glossary/organisation), [/glossary/credential-broker](/glossary/credential-broker) (first-use term links) · capabilities that prove it (internal-linking §2.2): [/platform/byom](/platform/byom), [/platform/mcp-widgets](/platform/mcp-widgets) · problem removed: [/platform/portability](/platform/portability) · trust/convert: [/developers](/platform), [/pricing](/open-source) · up-link [/solutions](/solutions). Control/sovereignty claims (keys, can't-decrypt) → /security (§6.5); "read the code / open source" → /open-source (§6.6). Breadcrumb: Home › Solutions › Multi-model.
**Notes for build:** `WebPage` + `FAQPage` + `BreadcrumbList` JSON-LD. Technical, mechanism-first register (voice guide §7 developer-adjacent). NEVER write "Bedrock" — the v1 third shape is Gemini-compatible (ADR-007 supersedes §2's draft). Source: ADR-007 (three protocol shapes, envelope-encryption), §2 (LLM as resource), harness-runtime LLM client factory + config resolution, credential-broker (BYOM creds, per-invocation resolution), ADR-008 (KMS separation). Honesty rule: support scoped to the three named shapes — do not over-claim universal provider coverage; Ollama works via OpenAI-compatible endpoint. No invented metrics or customers. Primary CTA "Configure BYOM" → console; secondary → /platform/byom.
