# Oraclous — Positioning & Messaging

> Source-grounded in Platform Architecture v1.1 (Sections 1, 2, 5, 7), ADR-003, ADR-007, ADR-008, the services-reference, and the Structured Governance Taxonomy. No invented metrics, no fabricated customers — Oraclous is pre/early, and proof is framed from the architecture, the open source, and honest docs.

**Terminology gloss (used throughout, exact platform terms):**

- **Harness** — a workspace artifact describing how a goal gets done across humans and agents (goal statement, actor roster, orchestration spec, triggers, task board, policy envelope, provenance).
- **Actor** — any entity, human member or AI **Agent**, that can be assigned work in a harness. Humans and agents share one interface.
- **Operator** — the person who states the goal in prose that compiles into a harness.
- **OHM** (Oraclous Harness Manifest) — the serialised, portable form of a harness; the canonical hub all portability routes through.
- **ReBAC** — Relationship-Based Access Control: permissions defined by *relationships* between entities, not static roles. (Never "RBAC".)
- **BYOM** — Bring Your Own Model provider: Anthropic-native, OpenAI-compatible, or Gemini-compatible.
- **Capability** — anything an actor can invoke; five kinds: Tools, Skills, Agents, Harnesses, Human roles.
- **Consciousness** — a per-actor record of accumulated learning, recorded and consulted via the Learn flow.
- **Portability** — the property that OHM and the reference runtime let customers leave without re-implementing.

---

## 1. Positioning statement (formal)

**For** organisations that want humans and AI agents to do real work together under their own access rules,
**who** today must choose between bespoke code, closed SaaS, or framework wiring,
**Oraclous is** an open-source agentic operations platform — a "second mind" for the organisation —
**that** lets Operators describe goals in natural language and have the platform compile, govern, and run them across human and agent Actors.
**Unlike** closed agent SaaS that takes your data sovereignty and single-vendor frameworks that make you wire governance by hand,
**Oraclous** is data-sovereign by design, enforces ReBAC at the platform level, runs any model under BYOM, and stays portable through the open OHM manifest — so you never trade control for capability.

---

## 2. The category

**Category we play in (and reframe): the *agentic operations platform*.**

The default mental model for "AI agents at work" today is either a *chatbot* bolted onto a product or a *framework* an engineering team assembles. Oraclous reframes the category along three axes the incumbents leave open:

1. **From orchestrating bots → forming a second mind.** The unit of value is not a clever agent; it is *the organisation's combined human + agent capacity*, governed as one fabric. Section 1 states the thesis directly: "form a **second mind** — a unified operational fabric where human members and AI agents work side by side, governed by the organisation's own access rules."
2. **From code-per-workflow → platform-as-code, actors-as-harnesses.** The *platform* is code, versioned by normal engineering practice; the *actors* are not code — they are Harnesses described in OHM and interpreted by the runtime (ADR-003). The category boundary shifts from "build the agent" to "describe the goal."
3. **From access-by-role → access-by-relationship.** Governance is ReBAC, not RBAC, applied at the harness level — so the same fabric that runs the work also proves who could touch what, and why.

The category one-liner: **Oraclous is where your people and your agents share one task board, one governance model, and one source of truth — and where the work is written in prose, not code.**

---

## 3. Elevator pitches (three lengths)

**One-liner (≤15 words):**
> Oraclous is the open-source second mind where your people and AI agents work as one.

**Tweet (≤40 words):**
> Oraclous is an open-source platform for forming a "second mind": humans and AI Agents share one task board under your own access rules (ReBAC), orchestrated by goals you write in plain language. Self-host or cloud — you hold the keys. BYOM, portable via OHM.

**Paragraph (≤80 words):**
> Organisations that want agentic work face three bad choices: build bespoke pipelines (slow, brittle), adopt closed SaaS (lose data sovereignty), or wire frameworks together (engineering per use case). Oraclous is the open-source alternative — a "second mind" where human members and AI Agents are symmetric Actors on one governed fabric. Operators describe goals in natural language; the platform compiles, governs with ReBAC, and runs them. Data-sovereign by design, model-agnostic via BYOM, and portable through the open OHM manifest.

---

## 4. Messaging pillars

Each pillar is a claim plus proof points cited to the architecture. These are the load-bearing messages; everything downstream (Home, Solutions, ads) maps back to one of them.

### Pillar 1 — Humans and agents are one workforce, not two systems

**Claim:** Oraclous treats the merger of human and AI work as the design target — Actors share a common interface, hand work back and forth, and escalate to each other on one task board.

**Proof points:**
- Conceptual Model (§2): "An **actor** is any entity — human member or AI agent — that can be assigned work in a harness. Actors share a common interface: they have an identity, a scope, a capability allocation."
- The **HITL flow** (§5, flow 7): "The Runtime treats waiting on a human like waiting on a tool return — same primitives, different latency." Humans are first-class, not an exception path.
- `harness-runtime-service` dispatches "agents → tool-use loop; humans → task board assignments" through one runtime with "no privileged code path."

### Pillar 2 — Describe the goal, don't build the pipeline

**Claim:** Operators write *what* needs doing in prose; the platform owns *how* the runtime enforces it. No 6-month engineering sprint per workflow.

**Proof points:**
- §1: Oraclous "separates **what work needs doing** (prose, written by operators) from **how the runtime enforces it** (code, written once by the platform)."
- The **Compile flow** (§5, flow 1): "state goal → compiler harness → workspace survey → clarifying questions → topology planning → manifest emission → review dialogue → commit."
- ADR-003: "Every executable thing on the platform is a harness… Composition is expressed by a harness referencing other capabilities, not by a separate workflow concept."

### Pillar 3 — Your data, your keys — self-host or cloud, identical guarantees

**Claim:** Data sovereignty is architectural, not a plan or a promise. Cross-organisation data flow is structurally impossible, and in cloud mode Oraclous staff cannot decrypt your state.

**Proof points:**
- §2: "Cross-organisation data flow is structurally impossible. Every node, relationship, query, cache entry, and audit log carries an `organization_id`."
- ADR-008: "Oraclous staff cannot decrypt customer state by virtue of operating the platform"; "support and debugging happen with the customer's participation, not in lieu of it."
- `credential-broker-service`: "Credentials never leave the broker in plaintext"; cloud-mode "KMS separation ensures Oraclous-the-company cannot unilaterally decrypt."

### Pillar 4 — Governance is the platform, not a checkbox (ReBAC, audit, metering)

**Claim:** Access is defined by relationships, not roles; every harness execution runs under a versioned policy envelope, with provenance and metering built into the substrate.

**Proof points:**
- §2: ReBAC — "Permissions are defined by *relationships* between entities, not by static roles."
- Structured Governance Taxonomy: five versioned policy sets (development → production-strict → production-federated) declaring trust tier, budget ceilings, signature requirements, BYOM constraints, capability allow/deny, audit level and retention.
- §6 + services-reference: the Runtime enforces "capability allocation, budget caps, HITL gates, output redaction"; metering captures tokens, tool invocations, storage, execution time, and cross-workspace traversals (§2). Provenance is a universal sink on the substrate.

### Pillar 5 — Bring any model; never get locked in (BYOM + OHM portability + MCP)

**Claim:** Swap models without rewriting harnesses, import/export through open formats, and connect to the broader MCP ecosystem both ways.

**Proof points:**
- ADR-007 / §2: BYOM in three protocol shapes — Anthropic-native, OpenAI-compatible, Gemini-compatible — with the LLM as "a *resource* the agent uses," not the agent itself.
- §7: "Oraclous publishes a manifest format (OHM) and a reference runtime, but does not lock customers into either." Every portability operation routes through OHM.
- §7: Oraclous is **both an MCP server** (exposes workspace capabilities, ReBAC-scoped) **and an MCP client** (imports external tools into the Capability Registry as native OHM tools). Inbound adapters cover SKILL.md, MCP, and OpenAPI 3.x.

### Pillar 6 — Open source and honest about trade-offs

**Claim:** The platform is open source and the docs state trade-offs plainly — you can read exactly what is and isn't covered before you commit.

**Proof points:**
- §7 names what portability does **not** cover (knowledge-graph data via standard exports; ReBAC graph platform-internal; credentials never leave the broker; consciousness records not exported). Honest scoping, in writing.
- ADR-008 documents the lower-isolation opt-in as an "explicit, audited opt-in," not a hidden default.
- Platform-as-code (ADR-003) means the substrate itself is "deployed and versioned through normal engineering practice" — inspectable, forkable, self-hostable.

---

## 5. The "three bad choices" narrative (marketing copy)

> **There used to be three ways to put AI agents to work. All three asked you to give something up.**
>
> **Build it in code.** Stand up a team, wire the pipelines, and own the maintenance forever. Six months later you have one brittle workflow and a backlog of twelve more. Every change is an engineering ticket.
>
> **Buy the closed platform.** Faster to start — until you realise your data, your governance, and your exit all belong to someone else's roadmap. The moment your auditors ask "prove you control this," you can't.
>
> **Wire the frameworks.** LangChain and friends give you reusable parts, but governance, identity, credentials, audit, and metering are still yours to assemble — per use case, by hand. You're building a platform without admitting it.
>
> **Oraclous is the fourth choice.** Describe the goal in plain language; the platform compiles it into a governed Harness where your people and your agents work side by side. ReBAC, credentials, audit, and metering come built in. Run it on your own infrastructure or let us host it — the data-sovereignty guarantees are identical, and you hold the keys either way. It's open source, model-agnostic, and portable through an open manifest. You stop trading control for capability.

---

## 6. Objection → response

| Objection | Response |
|---|---|
| "Open source means unsupported / risky." | Open source is the *proof*, not the product gap. You can read the architecture, the ADRs, and the trade-offs before committing — and self-host with no vendor in the loop. For teams that want operations off their plate, the **cloud-hosted mode** carries identical data-sovereignty guarantees (ADR-008), with ISO 27001 and SOC 2 Type II as *target* certifications for the hosting (in-programme, not yet certified — state this honestly). You choose support model and isolation tier; you're never forced into either. |
| "Self-hosting is hard." | It's the *option*, not the *obligation*. Cloud-hosted mode gives you the same architecture and the same guarantee that Oraclous staff "cannot decrypt customer state by virtue of operating the platform" (ADR-008). When you're ready to bring it in-house, the platform is platform-as-code (ADR-003) and your work is portable via OHM (§7) — no rewrite, no lock-in penalty for moving. |
| "Isn't this just another agent framework?" | A framework hands you parts and leaves governance, identity, credentials, audit, and metering for you to wire per use case. Oraclous makes those *substrate* — built once by the platform, enforced at the harness level (§1, §6). And it inverts the unit of work: in a framework you write code per agent; in Oraclous Operators write goals in prose and the compiler emits the harness (ADR-003, §5 Compile flow). |
| "Is this just LangChain plus governance?" | No — three structural differences. (1) **Humans are first-class Actors**, not an afterthought; the runtime "treats waiting on a human like waiting on a tool return" (§5). (2) **ReBAC, not RBAC** — access by relationship, enforced platform-wide, with provenance and metering on the substrate. (3) **Data-sovereign and portable by design** (ADR-008, §7). LangChain has none of these as a platform guarantee; they'd be yours to build. |
| "We're locked to our LLM vendor / we can't switch." | BYOM supports three protocol shapes — Anthropic-native, OpenAI-compatible, Gemini-compatible (ADR-007). The LLM is "a *resource* the agent uses" (§2), so you change the model config without rewriting the harness. |
| "How do I trust a hosted vendor with regulated data?" | The guarantee is architectural: cross-organisation data flow is "structurally impossible" (§2), credentials "never leave the broker in plaintext," and in cloud mode KMS separation means Oraclous "cannot unilaterally decrypt." Debugging happens *with your participation*, and any lower-isolation tier is an explicit, audited opt-in (ADR-008). |
| "Will I be able to leave?" | Yes, and the docs say exactly how far portability goes. OHM is the canonical export hub; the reference runtime is open. §7 also states plainly what portability does *not* carry (knowledge-graph data goes via Neo4j/RDF/JSON-LD exports; consciousness records don't travel) — so there are no surprises at exit. |

---

## 7. Proof / credibility assets

**Available today (frame proof from these — not from traction we don't have):**

- **The open-source codebase** — platform-as-code, inspectable and forkable (ADR-003).
- **The ADR record** — decisions documented with status, date, and human approver (e.g. ADR-003, ADR-007, ADR-008). Shows reasoning, not just claims.
- **Honest documentation** — Platform Architecture v1.1 with an explicit "deferred and out-of-scope" section and a portability section that names its own gaps (§7). This is a credibility asset *because* it states trade-offs.
- **The services-reference** — one page per service, with layer, port, status, and responsibilities. Concrete, not hand-wavy.
- **The Structured Governance Taxonomy** — five named, versioned policy sets a prospect can read line by line.
- **Compliance posture for hosting** — ISO 27001 and SOC 2 Type II are *target* certifications for cloud-hosted mode (compliance programme; not yet certified). Always frame as roadmap, never as achieved.

**Gaps to fill (be honest internally; do not paper over externally):**

- **No customers / case studies yet** — pre/early. Lean on architecture and open source; do not invent logos or metrics.
- **No benchmarks** — no published performance/cost numbers; avoid quantified claims until measured.
- **OpenAPI / api-client maturity** — the gateway contract and typed client are still firming up; "MCP first-class" is architecture-true but demo coverage is partial.
- **Quickstart / "deploy in N minutes"** — a credible self-host quickstart is a high-value asset to build before pushing the self-host story hard.
- **A reference Harness gallery** — sample OHM manifests would make the "describe the goal" pillar tangible.
- **A public security page** — consolidate the §2/§6/ADR-008 guarantees into one customer-facing trust document.
