---
title: What Oraclous doesn't do — the honest scope | Oraclous
meta_description: An honest map of what Oraclous deliberately leaves out, what's coming as customers need it, and the commitments it will never break — so there are no surprises.
url: /honest-roadmap
page_type: utility
primary_persona: F — Open-source evaluator (with C — Security & compliance leader)
primary_query: what does Oraclous not do
secondary_queries: [Oraclous limitations, agentic AI platform scope, AI agent platform honest limits]
schema: [WebPage, FAQPage, BreadcrumbList]
primary_cta: Review the trust model → /security
secondary_cta: Read the source → /open-source
---

# What Oraclous doesn't do — on purpose

Most platforms tell you what they do. This page tells you what Oraclous **doesn't** — what's deliberately out of v1, what's coming when a customer actually needs it, and the lines it will never cross. The disclosure is the point: the guarantee you can verify is the one with its boundaries named.

> **Citable answer** — Oraclous publishes its scope openly: a focused v1 (text, documents, structured data, and code; three model-provider protocol shapes; per-harness task boards), a clear "later, on real demand" list, and permanent commitments it won't break — never removing human approval for consequential agent actions, never hidden behaviour, never mining customer data. Honesty about limits is treated as a credibility asset, not a gap to hide.

## Coming later — when a customer actually needs it

These are things Oraclous should have eventually. They're named so they're built on real demand, not speculatively:

- **More data modalities.** v1 covers text, documents, structured data, code, and time-series. Images, audio, video, and design files come when a customer has the concrete use case — the architecture already allows for them.
- **Higher-fidelity export to other runtimes.** Today your work exports to the open OHM format, to Claude Desktop and Claude Code, and over MCP. Deeper exporters for specific external agent frameworks arrive on real demand.
- **More model providers.** v1's three protocol shapes — Anthropic-native, OpenAI-compatible, and Gemini-compatible — cover the large majority of needs (the OpenAI-compatible shape alone reaches many providers and local runtimes). More vendor-native integrations are added as customers ask.
- **Cross-team task boards.** v1 gives each Harness its own task board; boards that span an entire workspace are a later read-side addition.
- **Pricing model + chargeback tooling.** The platform meters usage today (tokens, tool calls, storage, time); the specific cloud pricing model and pre-built internal-chargeback reports come as the offering matures.

## Probably never — deliberate non-goals

Not on the roadmap, by design — documented so the answer is unambiguous:

- **A drag-and-drop workflow editor.** Oraclous is **prose-first**: you describe the goal and the platform compiles the Harness. A visual node editor would reintroduce exactly the framework-style modelling the platform avoids.
- **Real-time collaborative manifest editing.** OHM is small and versioned; single-author editing with version control is enough.
- **Framework-compatibility layers.** Interop is at the protocol level (MCP, OHM, OpenAPI), not by impersonating another framework's interface.
- **A long list of first-party SDKs.** The platform speaks REST, MCP, and standard formats; any language with HTTP can integrate.

## Never — commitments it won't break

These are architectural commitments. The answer to "could the platform do X?" is a firm no:

- **No unbounded agent autonomy.** Consequential changes — an Agent expanding its own access, rewriting its own limits — always route through human approval. There is no setting that removes the gate, and no path to one.
- **No hidden behaviour or "platform magic."** Everything is either inspectable open-source code or a capability you own and control. "The platform does it silently" is treated as a bug, not a feature.
- **No platform-imposed content moderation.** Your policies govern your workspace, not the vendor's. Oraclous gives you the mechanisms (redaction, human gates, custom skills); it doesn't impose its own.
- **No vendor-accessible credential store.** Your credentials live in your own credential broker under per-organisation encryption — even in cloud mode, Oraclous-the-company cannot decrypt them. There is no shared secret pool.
- **No cross-customer data sharing or data-mining.** Data sovereignty is absolute in both modes. The platform improves through community contributions and feedback — never by reading across organisations.
- **No pretending Agents are people.** Agents are software that use a model as a resource. "Second mind" is a metaphor for human + AI working together — not a claim that an Agent is a mind or a legal person.

## Frequently asked questions

**Q: Why publish what you don't do?**
A: Because honest scope is how serious teams evaluate infrastructure. Naming the limits up front — what's deferred, what's a non-goal, what's a permanent commitment — lets you decide with full information, and means there are no surprises at adoption or exit. The disclosure is the credibility.

**Q: Will Oraclous ever run agents without human approval?**
A: Not for consequential actions. Bounded learning with human-in-the-loop approval on changes that expand access or rewrite limits is the platform's safety floor. The most permissive setting lets an Agent *propose* changes that a human reviews — there is no setting that removes the review.

**Q: Does Oraclous train on or aggregate customer data?**
A: No. Data sovereignty is absolute in both self-hosted and cloud modes. Oraclous-the-company has no code path that reads across organisation boundaries and does not mine customer workflows. The platform improves through open-source contributions and feedback, not customer data.

**Q: Is there a visual workflow builder?**
A: No, by design. Oraclous is prose-first: you write the goal in plain language and the platform compiles a governed Harness you can review. You can edit the resulting OHM manifest directly; a drag-and-drop editor would reintroduce the framework-style modelling the platform deliberately avoids.

---
**Internal links:** `/security` (trust model), `/open-source` (read the code), `/platform/portability` (OHM + export limits), `/platform/human-in-the-loop` (the approval gate), `/glossary/ohm`, `/glossary/data-sovereignty`. Breadcrumb: Home › Honest roadmap.
**Notes for build:** `WebPage` + `FAQPage` + `BreadcrumbList`. Sourced from Platform Architecture §9 (Deferred & Out-of-Scope), scrubbed for public use — no internal phase codes, threat IDs, service names, or provider names beyond the three canonical protocol shapes. Honesty/credibility page; keep the "Never" commitments prominent.
