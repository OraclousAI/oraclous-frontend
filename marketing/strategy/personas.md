# Oraclous — Personas

> Five buyer/influencer archetypes, grounded in Platform Architecture v1.1, the ADRs, and the services-reference. These feed the messaging matrix and the brand-mention / channel plan. No invented metrics, no named customers — Oraclous is pre/early; "where they research" is for outreach planning, not a claim of presence.

**Term gloss (first use):** **Harness** = goal-driven assembly of human + agent **Actors** under one policy envelope. **Operator** = the person who states the goal in prose. **OHM** = the portable manifest form of a harness. **ReBAC** = access by relationship, not by role. **BYOM** = bring your own model provider. **Capability** = anything an actor can invoke (Tool, Skill, Agent, Harness, Human role). **Consciousness** = a per-actor learning record. **Portability** = leave-without-rewrite via OHM.

---

## Persona 1 — Operations / automation lead

**Role & context.** Owns operational throughput in a mid-to-large org (RevOps, support ops, finance ops, internal tooling). Has a backlog of repetitive, judgement-laden processes that are "almost automatable" but always need a human at one or two steps. Commands budget for outcomes, not infrastructure. Lives in the gap between "the business wants this" and "engineering can't get to it for two quarters."

**Jobs-to-be-done.**
- Ship process automation without waiting in the engineering queue.
- Keep a human in control of high-stakes steps without breaking the flow.
- Show leadership the work is governed and auditable.

**Top 3 pains.**
1. Every workflow is a 6-month eng project; ops can't self-serve.
2. Existing automation breaks when a step needs human judgement (the tool can't "wait for a person").
3. No clean audit trail when work spans people and tools.

**Top 3 desired gains.**
1. Describe a process in plain language and have it run.
2. Humans and agents on one task board, handing work back and forth.
3. Provenance and audit for free.

**Buying triggers.** A failed/over-budget bespoke automation project; a new compliance requirement for audit trails; leadership mandate to "use AI" without a dev team to do it; a painful manual process hitting volume limits.

**Objections.** "Will it actually keep a human in the loop where it matters?" · "Is this going to need engineers anyway?" · "Can I trust the output enough to put it in production?"

**Oraclous value that lands hardest.** The **HITL flow** ("waiting on a human like waiting on a tool return," §5) plus the **Compile flow** (goal-in-prose → committed harness, ADR-003). The pitch: *write the goal, keep control, ship without the backlog.*

**Where they research / hang out.** Ops and RevOps communities and newsletters; LinkedIn (ops leadership content); no-code/automation communities (the audience graduating from Zapier/Make into agentic work); vertical ops Slack/Discord groups; webinars and case-study-driven content. → *Brand-mention plan: lead with "automation without the engineering backlog" content; partner with ops-influencer newsletters.*

---

## Persona 2 — Platform builder / developer

**Role & context.** Senior engineer, platform/infra lead, or founding engineer building an agentic product or internal platform. Technically opinionated; reads architecture docs and source before trusting a vendor. Has tried (or shipped) a framework-based agent stack and felt the governance/plumbing tax.

**Jobs-to-be-done.**
- Ship agentic capability without rebuilding identity, credentials, audit, and metering each time.
- Keep the architecture clean and portable; avoid lock-in.
- Compose tools and agents from a single source of truth.

**Top 3 pains.**
1. ~60% of effort goes to governance/security plumbing, rebuilt per use case.
2. Framework stacks leave identity, ReBAC, credentials, audit, and metering as DIY.
3. Fear of lock-in to a closed platform or a single LLM vendor.

**Top 3 desired gains.**
1. Substrate that already does ReBAC, the credential broker, provenance, and metering.
2. One descriptor model for all Capabilities (tools, skills, agents, harnesses, human roles).
3. Open formats and an open runtime — portable, forkable, self-hostable.

**Buying triggers.** Starting a new agent project and dreading the plumbing; hitting the governance wall on a framework prototype; a security review blocking a homegrown stack; discovering MCP and wanting a platform that's first-class on both sides.

**Objections.** "Is this just another framework?" · "Will the abstractions get in my way?" · "Can I actually leave?" · "Is the open source real or a teaser?"

**Oraclous value that lands hardest.** **Platform-as-code / actors-as-harnesses** (ADR-003), the unified **Capability Registry** (one descriptor model, MCP importer), and **OHM portability + MCP server/client** (§7). The pitch: *stop rebuilding the platform under your agents; compose capabilities, stay portable.*

**Where they research / hang out.** GitHub (stars, issues, reading the code/ADRs); Hacker News; r/LocalLLaMA and r/MachineLearning; dev-tooling Discords; the MCP / Claude / open-agent ecosystems; technical blogs and conference talks; X/Twitter dev circles. → *Brand-mention plan: ADR-driven technical content, a credible self-host quickstart, MCP-ecosystem presence, and "show the code" honesty (including the trade-offs §7/§9 state).*

---

## Persona 3 — Security & compliance leader

**Role & context.** CISO, security architect, DPO, or compliance lead in a regulated org (finance, health, public sector, regulated SaaS). Holds veto power over adoption. Judges vendors on *provable* control and isolation, not feature lists. Skeptical of "AI" by default because of data-exposure risk.

**Jobs-to-be-done.**
- Prove to auditors that access is controlled and tenants are isolated.
- Keep regulated data sovereign — physically and logically.
- Approve AI tooling without expanding the attack/exposure surface.

**Top 3 pains.**
1. Auditors demand proof of control and isolation; most AI tools offer assurances, not architecture.
2. Closed SaaS means the vendor can, in principle, see the data.
3. Single-LLM dependence creates a third-party data-flow risk.

**Top 3 desired gains.**
1. Isolation that is structural ("cross-organisation data flow is *impossible*," §2).
2. Keys the customer controls — even in cloud mode (ADR-008).
3. Provenance, ReBAC, and versioned policy sets an auditor can read.

**Buying triggers.** An audit finding; a new regulation (data residency, AI governance); a board mandate to adopt AI *safely*; a competitor's breach raising scrutiny; a vendor security review on an existing closed tool that failed.

**Objections.** "Hosted vendors can see my data." · "Self-hosting is operationally heavy." · "Show me the isolation, don't tell me." · "What happens to data when we leave?"

**Oraclous value that lands hardest.** **Data sovereignty by design** — `organization_id` on every record, credential broker, KMS separation so staff "cannot decrypt customer state" (§2, ADR-008, `credential-broker-service`) — plus the **Structured Governance Taxonomy** (five versioned policy sets with audit level + retention) and honest portability docs. The pitch: *prove control, because it's in the architecture — self-host or cloud, identical guarantees, your keys.*

**Where they research / hang out.** CISO/security communities and ISACs; compliance and GRC forums; analyst content (security/AI-governance); RFP/security-questionnaire processes; security conferences; LinkedIn security leadership content; trust-center / security-page evaluation during procurement. → *Brand-mention plan: build a public security/sovereignty trust page consolidating §2/§6/ADR-008 + the policy-set taxonomy; speak the language of audit and isolation; reference ISO 27001 / SOC 2 Type II as *target* certifications for hosting (in-programme, not yet certified).*

---

## Persona 4 — ML / multi-model team lead

**Role & context.** Leads an applied-ML or AI-engineering team. Runs multiple models in production, tunes for cost/quality/latency, and may run local/open-weight models alongside frontier APIs. Allergic to anything that hard-couples the work to one provider.

**Jobs-to-be-done.**
- Route work to the best/cheapest model per task without rewriting the agent.
- Run frontier and local models under one operational model.
- Keep model credentials and choices under the org's control.

**Top 3 pains.**
1. Locked to one LLM vendor; switching means rewriting agent code.
2. No clean separation between "the work" and "the model that does it."
3. Provider credentials scattered and hard to govern.

**Top 3 desired gains.**
1. Swap models by config across providers.
2. Treat the LLM as a resource the agent uses, not the agent's identity.
3. Envelope-encrypted, org-controlled provider credentials.

**Buying triggers.** A price/quality shift from a provider; wanting to add a local/open model to the mix; a procurement push for multi-vendor resilience; an agent stack that bakes in one vendor and now needs to change.

**Objections.** "Three protocol shapes — does my provider fit?" · "Will model-switching really not touch the harness?" · "Where do my model keys live?"

**Oraclous value that lands hardest.** **BYOM with three protocol shapes** (Anthropic-native, OpenAI-compatible, Gemini-compatible, ADR-007), the principle that "the LLM is a *resource* the agent uses" (§2), and **LLM config resolution at agent → workspace → organisation** with envelope-encrypted credentials (`harness-runtime-service`, `credential-broker-service`). The pitch: *change the model, keep the harness.*

**Where they research / hang out.** r/LocalLLaMA, ML Twitter/X, Hugging Face community, model-provider Discords, applied-ML newsletters, AI-engineering conferences, GitHub. → *Brand-mention plan: BYOM-forward technical content; demonstrate provider swaps; engage the local/open-weight community; be explicit about which protocol shapes are supported (don't over-claim beyond the three).*

---

## Persona 5 — Open-source evaluator (brief archetype)

**Role & context.** A cross-cutting influencer rather than a department: the engineer, indie hacker, or technical advocate who evaluates open-source tools on their merits and tells everyone else what's worth using. Often overlaps with the platform builder, but their *motivation* is different — they're evaluating the project's health, honesty, and license, not just its fit for one task.

**Jobs-to-be-done.**
- Decide whether a project is real, maintained, and honest before recommending it.
- Self-host and kick the tyres with zero sales contact.
- Verify the claims against the code and the docs.

**Top 3 pains.**
1. "Open-source" projects that are thin wrappers or marketing teasers.
2. Docs that hide trade-offs and over-promise.
3. Friction to a first running instance.

**Top 3 desired gains.**
1. Real, inspectable code and a documented decision record (ADRs).
2. Docs that state what's deferred and what portability *doesn't* cover (§7, §9).
3. A clean self-host path.

**Buying triggers.** A trending repo; a thoughtful ADR or architecture doc shared in a community; an MCP-ecosystem mention; a "finally, an honest agent platform" angle that earns a closer look.

**Objections.** "Is the open source the whole platform or a loss-leader?" · "Is it maintained?" · "Does the honesty hold up under scrutiny?"

**Oraclous value that lands hardest.** **Open source + honest docs + platform-as-code** (ADR-003) — and crucially, docs that *name their own gaps* (§7 portability limits, §9 deferred scope). The pitch: *read the code, read the ADRs, read what we deliberately left out — then decide.*

**Where they research / hang out.** GitHub, Hacker News, Lobsters, r/selfhosted and r/opensource, awesome-* lists, technical newsletters, X/Twitter. → *Brand-mention plan: optimise the repo and ADRs for first impressions; ensure a frictionless self-host quickstart; lean into the honesty as a differentiator — the trade-off disclosures are an asset to this audience, not a liability.*

---

## Cross-persona notes for the brand-mention plan

- **Honesty is the through-line.** Every persona rewards the docs' refusal to over-claim — preserve it in all copy. No invented metrics, no fake logos.
- **Two front doors, one thesis.** Builders and OSS evaluators enter through GitHub/HN/ADRs; ops and security leaders enter through Solutions/trust content and LinkedIn. Both must land on the same "second mind" thesis (see Home message hierarchy in the messaging matrix).
- **Highest-leverage assets to build** (from the positioning gaps): a self-host quickstart (serves builders + OSS evaluators), a public security/sovereignty trust page (serves security leaders), and a sample-OHM Harness gallery (serves ops + builders).
