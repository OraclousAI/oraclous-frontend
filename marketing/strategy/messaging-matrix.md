# Oraclous — Messaging Matrix

> Per-persona and per-capability messaging, plus the Home-page message hierarchy. Grounded in Platform Architecture v1.1 (§§1, 2, 5, 6, 7), ADR-003/007/008, the Structured Governance Taxonomy, and the services-reference. Audience strategy is **balanced / multi-persona**: the Home page leads with the "second mind" thesis; Solutions pages speak per persona.

**Term gloss (first use):** **Harness** = a goal-driven assembly of human + agent **Actors** with a policy envelope. **OHM** = the portable manifest form of a harness. **ReBAC** = access by relationship, not by role. **BYOM** = bring your own model provider. **Operator** = the person who states the goal. **Consciousness** = a per-actor learning record. **Portability** = leave-without-rewrite via OHM.

---

## 1. Per-persona matrix

### Persona A — Operations / automation lead (Enterprise ops)

| | |
|---|---|
| **Primary pain** | Agentic workflows need a 6-month engineering sprint; ops can't ship automation without standing in the dev queue. |
| **Oraclous answer** | Describe goals in prose; the Compile flow turns them into governed Harnesses where humans and agents share the work (§5 flow 1; ADR-003). |
| **Differentiator** | No code, full control, complete audit — governance and provenance are built in, not bolted on. |
| **Headlines (3)** | 1. "Automate the work, not the engineering backlog." 2. "Write the goal. Ship the workflow." 3. "Your team and your agents, on one task board." |
| **Subhead** | Operators describe what needs doing in plain language; Oraclous compiles it into a governed harness — humans and AI agents working side by side, every step audited. |
| **CTA** | "See the Compile flow" → guided demo / book a walkthrough. |
| **Proof points** | §1 "separates *what work needs doing* (prose) from *how the runtime enforces it* (code)"; §5 Compile flow; HITL flow makes human review a first-class step, not a workaround. |

### Persona B — Platform builder / developer

| | |
|---|---|
| **Primary pain** | 60% of effort goes to governance/security plumbing — identity, credentials, audit, metering — rebuilt per use case. |
| **Oraclous answer** | The substrate handles ReBAC, credentials, audit, and metering once; you compose Capabilities instead of re-wiring infrastructure. |
| **Differentiator** | Build faster, stay portable, no lock-in — platform-as-code with an open manifest (ADR-003, §7). |
| **Headlines (3)** | 1. "Stop rebuilding the platform under your agents." 2. "Governance, identity, audit — already in the substrate." 3. "Compose capabilities. Don't wire plumbing." |
| **Subhead** | ReBAC, the credential broker, provenance, and metering are substrate services — so you build on capabilities instead of re-implementing security per project, and you keep it portable through OHM. |
| **CTA** | "Read the architecture" → ADRs + services-reference + GitHub. |
| **Proof points** | ADR-003 platform-as-code / actors-as-harnesses; `capability-registry-service` (one descriptor model, five kinds, MCP importer); §7 OHM + MCP server/client; `credential-broker-service`. |

### Persona C — Security & compliance leader (Regulated orgs)

| | |
|---|---|
| **Primary pain** | Auditors demand provable control and isolation; "trust us" doesn't pass review. |
| **Oraclous answer** | Data-sovereign architecture + OHM manifests + provenance: control is structural and demonstrable. |
| **Differentiator** | Self-host or cloud with *identical* guarantees — the customer holds the keys (ADR-008). |
| **Headlines (3)** | 1. "Prove control — because it's built into the architecture." 2. "Self-host or cloud. Same guarantee. Your keys." 3. "Cross-org data flow isn't restricted. It's impossible." |
| **Subhead** | Every record carries an `organization_id`, credentials never leave the broker in plaintext, and in cloud mode Oraclous staff cannot decrypt your state — with ReBAC and provenance giving auditors the proof they ask for. |
| **CTA** | "Review the trust model" → security/sovereignty page + ADR-008. |
| **Proof points** | §2 "cross-organisation data flow is structurally impossible"; ADR-008 "staff cannot decrypt customer state"; Structured Governance Taxonomy (five versioned policy sets, audit level + retention); ISO 27001 + SOC 2 Type II are *target* certifications for hosting (in-programme, not yet certified — frame as roadmap). |

### Persona D — ML / multi-model team lead

| | |
|---|---|
| **Primary pain** | Locked to one LLM vendor; switching means rewriting agent code. |
| **Oraclous answer** | BYOM across three protocol shapes; the model is a resource the agent uses, not the agent itself. |
| **Differentiator** | Switch models without rewriting harnesses — Anthropic, OpenAI-compatible, or Gemini-compatible by config. |
| **Headlines (3)** | 1. "Change the model. Keep the harness." 2. "BYOM: Claude, GPT, Gemini — your choice, your keys." 3. "The LLM is a resource, not a lock-in." |
| **Subhead** | Oraclous resolves LLM config at agent, workspace, or organisation level across three protocol shapes — so you move between providers (or run them side by side) without touching the work definition. |
| **CTA** | "Configure BYOM" → BYOM docs + ADR-007. |
| **Proof points** | ADR-007 three protocol shapes; §2 "the LLM is a *resource* the agent uses"; `harness-runtime-service` LLM client factory + config resolution (agent → workspace → organisation); credentials envelope-encrypted under customer-controlled key material. |

### Persona E — Multi-team org / federation owner

| | |
|---|---|
| **Primary pain** | Teams can't safely collaborate across workspace boundaries without leaking access. |
| **Oraclous answer** | ReBAC federation — controlled cross-workspace requests under relationship-based policy. |
| **Differentiator** | Governance is enforced at the platform level, so cross-team work is *governed*, not improvised. |
| **Headlines (3)** | 1. "Collaborate across teams without collapsing the walls." 2. "Federation that an auditor would sign off." 3. "Cross-workspace work, under your relationships." |
| **Subhead** | The Traversal flow lets workspaces request each other's capabilities under ReBAC, with cross-workspace traversals metered and provenance-tracked — federation without a free-for-all. |
| **CTA** | "See federation under ReBAC" → governance docs. |
| **Proof points** | §5 Traversal flow (cross-workspace federation under ReBAC); `knowledge-retriever-service` "federation traversal across workspaces under ReBAC"; `policy-set:production-federated` (allows `federated:*` registries under full audit); metering captures cross-workspace traversals (§2). |

---

## 2. Per-capability messaging

| Capability | Feature (what it is) | Benefit (what you get) | "So what" (why it matters) | Persona who cares most |
|---|---|---|---|---|
| **Harness model** | Goal-driven assembly of human + agent Actors with one policy envelope; every executable thing is a harness (ADR-003). | One governance, audit, and budget surface for all work. | You stop managing agents and workflows as separate things — there's one unit, and it's governed. | Ops lead · Platform builder |
| **BYOM** | Three protocol shapes (Anthropic-native, OpenAI-compatible, Gemini-compatible); model is a resource, not the agent (ADR-007, §2). | Use any model; switch by config. | No vendor lock-in; cost/quality tuning without a rewrite. | ML / multi-model lead |
| **Knowledge graph + retrieval** | Write side (`knowledge-graph-service`: multi-modal ingest, analytics, provenance) + read side (`knowledge-retriever-service`: semantic, full-text, hybrid, graph traversal, all returning one `NodeResult` envelope). | A queryable, provenance-tracked org memory. | The "second mind" actually *remembers* — retrieval is ReBAC-bounded and traceable to source. | Platform builder · Ops lead |
| **ReBAC governance** | Access by relationship, enforced at the harness level; five versioned policy sets (Governance Taxonomy). | Fine-grained, provable access control. | Auditors get proof, not promises; access scales with relationships, not role sprawl. | Security & compliance · Federation owner |
| **HITL (human-in-the-loop)** | "Waiting on a human like waiting on a tool return — same primitives, different latency" (§5 flow 7). | Humans review/approve inside the same flow agents run in. | Oversight is structural, not a manual side-channel — critical for regulated and high-stakes work. | Ops lead · Security & compliance |
| **Execution / scheduling** | Durable, checkpointed execution; schedule firing per OHM `triggers`; pause/resume/cancel; timeout + retry enforcement (`execution-engine-service`). | Reliable long-running and recurring work. | Agents that wake on schedule and survive restarts — operations you can depend on, with declared retry limits (no runaway loops). | Ops lead · Platform builder |
| **Widgets + MCP** | Embeddable widgets + MCP server (expose capabilities, ReBAC-scoped) + MCP client (import external tools as OHM) via the Application Gateway (§7). | Reach the work from anywhere; plug into the MCP ecosystem both ways. | Oraclous fits your existing tools (Claude Desktop, Cursor, Continue) and embeds in your product — without bypassing governance. | Platform builder · Ops lead |
| **Portability** | OHM as canonical hub; reference runtime open; inbound adapters for SKILL.md, MCP, OpenAPI 3.x; documented export limits (§7). | Leave or migrate without re-implementing. | No lock-in — and the docs say exactly how far portability goes, so there are no exit surprises. | Security & compliance · Platform builder |
| **Data sovereignty** | `organization_id` on every record; credential broker; KMS separation in cloud mode (§2, ADR-008, `credential-broker-service`). | Your data stays yours, self-host or cloud. | The single biggest blocker for regulated adoption — solved architecturally, identically across deployment modes. | Security & compliance |
| **Metering** | Substrate-level tracking of tokens, tool calls, storage, time, cross-workspace traversals; metering does *not* set prices (§2). | Visibility into consumption per org and workspace. | Cost attribution and budget enforcement you control — neutral measurement, your pricing. | Ops lead · Platform builder |

---

## 3. Home-page message hierarchy

```
PRIMARY THESIS (hero)
└─ "Form your organisation's second mind."
   Subhead: An open-source platform where your people and AI agents work side by side —
   under your own access rules, orchestrated by goals you write in plain language.
   Self-host or cloud; you hold the keys.

   THREE SUPPORTING PILLARS (the body, one section each)
   ├─ Pillar 1 — One workforce, one fabric
   │    "Humans and agents are symmetric Actors on the same task board."
   │    Proof: §2 actor definition · §5 HITL flow · harness-runtime "no privileged code path"
   │
   ├─ Pillar 2 — Describe the goal, not the pipeline
   │    "Operators write what needs doing; the platform compiles, governs, and runs it."
   │    Proof: §1 prose-vs-code separation · §5 Compile flow · ADR-003 platform-as-code
   │
   └─ Pillar 3 — Your data, your keys, your exit
        "Data-sovereign by design, model-agnostic via BYOM, portable through open OHM."
        Proof: §2 cross-org flow impossible · ADR-008 staff-can't-decrypt · ADR-007 BYOM · §7 OHM + MCP

   PROOF BAND (below the pillars)
   ├─ Open source — read the code, the ADRs, the trade-offs (link: GitHub + ADRs)
   ├─ Honest docs — Platform Architecture v1.1, including what's deferred and what portability omits (§7, §9)
   ├─ Governance you can read — five versioned policy sets (Structured Governance Taxonomy)
   └─ Compliance for hosting — ISO 27001 + SOC 2 Type II *targeted* (cloud-hosted mode; in-programme, not yet certified)

   PER-PERSONA DOORS (Solutions nav → §1 of this matrix)
   Operations · Platform builders · Security & compliance · Multi-model teams · Multi-team federation

   PRIMARY CTA: "Start with the architecture" (read) · SECONDARY CTA: "Book a walkthrough" (talk)
```

**Hierarchy rule:** the hero never sells a single feature — it sells the *second mind*. Features earn their place only as proof under a pillar. Every persona door inherits the thesis and re-frames it to that persona's pain (Section 1).
