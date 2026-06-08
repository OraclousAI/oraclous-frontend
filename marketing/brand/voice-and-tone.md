# Oraclous — Voice & Tone

> A practical guide a copywriter can apply on the next line they write. Grounded in the positioning, the messaging matrix, the personas, and the competitive landscape. The north star: Oraclous's own docs are deliberately precise, honest, and free of marketing-speak — the marketing voice must earn the same trust. **Confident, clear, technically credible, and quietly bold — never hypey.**

---

## 1. Brand personality

Pick a fixed position on each axis. These are not aspirations — they are the dial settings every piece of copy is checked against.

| Axis | Position | One-line justification |
|---|---|---|
| **Formal ↔ Casual** | **Lean formal** (professional, not stiff) | The buyers with veto power are security, compliance, and platform leaders; they trust measured language over banter. We are conversational in tone, precise in substance. |
| **Serious ↔ Playful** | **Mostly serious**, with dry wit | This is governed, sovereign infrastructure for regulated work — the stakes are real. Wit is allowed in the turn of a sentence, never in the claim. |
| **Technical ↔ Simple** | **Technical, made legible** | Our differentiators (ReBAC, OHM, platform-as-code) *are* technical; dumbing them down forfeits credibility. We keep the precise term and gloss it once, rather than swapping it for a vague one. |
| **Reserved ↔ Bold** | **Quietly bold** | The boldness is in the claims themselves ("cross-org data flow is structurally impossible"), stated flatly — not in exclamation marks or superlatives. We let architecture do the bragging. |

**The one-sentence personality:** *The senior engineer who has actually read the spec, tells you the trade-offs before you ask, and is quietly certain because the architecture backs every word.*

---

## 2. Voice principles

### 2.1 Claim, then prove — never claim and run
**Why:** Every persona rewards evidence over assertion; the docs already cite the architecture for each claim.
- ✅ "Cross-organisation data flow isn't restricted — it's structurally impossible. Every record carries an `organization_id`, enforced at the substrate."
- ❌ "Enterprise-grade security you can trust."

### 2.2 Name the trade-off out loud
**Why:** Honest scoping is our sharpest differentiator against hype-heavy competitors — and it's already how the docs read.
- ✅ "Portability covers your harnesses via OHM. It does not carry accumulated Consciousness records — and we say so up front, so there are no surprises at exit."
- ❌ "Total portability. Zero lock-in. Leave anytime with everything."

### 2.3 Keep the precise term; gloss it once
**Why:** Swapping "ReBAC" for "smart permissions" forfeits the exact thing that makes us different. Legibility comes from a one-time gloss, not from vagueness.
- ✅ "Access is governed by ReBAC — relationship-based access control, where permissions follow the relationships between people, agents, and data, not static roles."
- ❌ "Access is role-based, but smarter."

### 2.4 Symmetry: humans and Agents are one workforce, in the grammar too
**Why:** The core thesis is that humans and Agents are symmetric Actors. The sentences should treat them that way.
- ✅ "Your people and your Agents share one task board, one governance model, one source of truth."
- ❌ "Let our AI bots handle the busywork so your humans can focus on what matters."

### 2.5 Show the mechanism, not the magic
**Why:** "Magic" and "just works" are exactly the hand-waving our buyers distrust; we win by showing the wiring.
- ✅ "You write the goal in plain language; the Compile flow surveys the workspace, plans the topology, and emits a governed Harness you review before it commits."
- ❌ "Describe what you want and watch the magic happen."

### 2.6 Verbs of control, not verbs of hype
**Why:** Our promise is *control retained*, not *power unleashed*. The verbs should reinforce sovereignty.
- ✅ "You hold the keys. You set the policy. You can walk away with the manifest."
- ❌ "Unlock unlimited power. Supercharge your team. Revolutionise operations."

### 2.7 Concrete over abstract; one idea per sentence
**Why:** Abstraction reads as evasion to a technical buyer; concreteness reads as competence.
- ✅ "Swap from Claude to an OpenAI-compatible model by changing config — the Harness doesn't change."
- ❌ "Leverage best-in-class model flexibility to optimise your AI strategy end-to-end."

---

## 3. The honesty rule

Oraclous states its trade-offs and limitations in writing — the architecture docs have an explicit "deferred and out-of-scope" section and a portability section that names its own gaps. **Marketing inherits this as a rule, not a footnote.** Credibility is the product of admitting the boundary.

How to keep it in copy:

1. **Pair every strong claim with its boundary** when the boundary is material. "Self-host or cloud, identical data-sovereignty guarantees — *the support model and isolation tier are your choice, not a hidden default.*"
2. **Never imply traction we don't have.** Oraclous is pre/early. No invented metrics, no fake logos, no "trusted by thousands." Frame proof from the open code, the ADRs, and the honest docs — that is the proof.
3. **Disclose scope limits where the buyer will hit them.** Portability does not export Consciousness records or the ReBAC graph; say so on the portability page, not only in the fine print.
4. **Prefer "here's exactly how far it goes" to "it does everything."** The OSS evaluator and the security leader both reward the disclosure and punish the over-claim.
5. **If a feature is architecture-true but demo-thin, say "by design / on the roadmap," not "available now."** Don't let the architecture's ambition read as a shipped guarantee.

The test: *Could a skeptical CISO or a senior engineer read this line, check it against the ADRs, and find it exactly true?* If not, soften the claim until it is.

---

## 4. Lexicon

### Words and phrases we use (and capitalise as product terms)

| Use | Why |
|---|---|
| **Agent** | The platform's term for a non-human Actor. Always "Agent," never "bot/chatbot." |
| **Actor** | Humans and Agents alike — reinforces symmetry. |
| **Operator** | The person who states the goal in prose. |
| **Harness** / **OHM** | The unit of work and its portable manifest form. |
| **Capability** | Anything an Actor can invoke — keep the precise word. |
| **ReBAC** | Always ReBAC (gloss once). Use "RBAC" *only* when explicitly contrasting. |
| **BYOM** | Bring Your Own Model provider. |
| **Consciousness** | The per-Actor learning record — capitalised, distinctive term. |
| **second mind** | The category thesis. Lowercase in prose, in quotes on first hero use. |
| **your keys**, **your data**, **your exit**, **no lock-in** | The sovereignty vocabulary — plain, possessive, reassuring. |
| **structurally impossible**, **by design**, **at the substrate** | Architectural-certainty phrases; use where literally true. |
| **governed**, **provenance**, **policy envelope**, **portable** | The control vocabulary. |

### Words and phrases we avoid

| Avoid | Use instead / why |
|---|---|
| **bot**, **chatbot** | **Agent**. "Chatbot" is the category we reframe away from ("not a chatbot problem"). |
| **RBAC** (as our model) | **ReBAC**. RBAC appears only in an explicit contrast. |
| **magic**, **magical**, **just works**, **effortless** | Show the mechanism. Magic is the hand-waving our buyers distrust. |
| **revolutionary**, **game-changing**, **disrupt**, **next-gen**, **cutting-edge** | Empty superlatives. Let the claim be specific instead. |
| **AI employee**, **AI workforce** (as a replacement frame) | We augment a human + Agent fabric; we don't sell head-count replacement. |
| **unlimited**, **seamless**, **frictionless**, **supercharge**, **unlock** | Hype verbs/adjectives. Prefer concrete, bounded claims. |
| **trusted by thousands**, invented metrics, fake logos | Pre/early. Honesty rule §3.2. |
| **military-grade**, **bank-grade** | Vague trust theatre. Cite the actual mechanism (KMS separation, per-org keys, ISO 27001 / SOC 2 Type II for hosting). |
| **AGI**, **sentient**, anthropomorphic over-reach | Agents are governed software Actors, not minds. (Consciousness is a *learning record*, not literal sentience — see glossary.) |

---

## 5. Sentence-level mechanics

- **Headings:** Sentence case, not Title Case. Headlines may be short and declarative ("Change the model. Keep the harness."). A period at the end of a hero line is allowed and on-brand — it reads as certainty, not excitement.
- **Sentence length:** Vary it. Lead a section with a short, flat claim; follow with one or two longer sentences that supply the mechanism. Avoid the three-long-sentences-in-a-row wall.
- **Active voice, present tense.** "Oraclous compiles the goal," not "the goal is compiled by Oraclous." Present tense for what the platform does ("the Runtime enforces the gate").
- **Active subject = the customer where it concerns control.** "You hold the keys," not "keys are held by the customer."
- **CTAs:** Verb-first, specific, low-pressure. We invite reading and evaluation, not signups under duress. ✅ "Read the architecture." · "Review the trust model." · "See the Compile flow." · "Configure BYOM." ❌ "Get started now!" · "Unlock your free trial!" · "Don't miss out."
- **Jargon:** Keep the precise term; gloss it in-line on first use (an em-dash gloss is the house style): "ReBAC — relationship-based access control — …". After first use, the bare term is fine within the same page.
- **Capitalisation of product terms:** Capitalise the platform nouns when used as the defined concept: **Agent, Actor, Operator, Harness, Capability, Consciousness, Compile flow, HITL flow, Application Gateway, Capability Registry, Harness Runtime, Execution Engine, Substrate.** Acronyms stay uppercase: **OHM, ReBAC, BYOM, MCP, HITL.** Lowercase "second mind" in body prose. Lowercase generic uses ("the agents on your team" when speaking loosely is still discouraged — prefer the capitalised defined term).
- **Numbers & metrics:** Only cite measured, sourced numbers (e.g. competitive-landscape stats with their source). Never invent a percentage, a customer count, or a benchmark.
- **No exclamation marks** in body or headline copy (rare, deliberate exceptions only). Certainty is conveyed by the claim, not the punctuation.

---

## 6. Before → after rewrites

**1. Generic SaaS feature line**
- ❌ Before: "Our revolutionary AI bots work seamlessly with your team to supercharge productivity!"
- ✅ After: "Your people and your Agents work as symmetric Actors on one task board — handing work back and forth, escalating to each other, under one governance model."

**2. Generic security line**
- ❌ Before: "Bank-grade security keeps your data safe with enterprise-grade encryption you can trust."
- ✅ After: "Cross-organisation data flow is structurally impossible — every record carries an `organization_id`, and in cloud mode KMS separation means we cannot decrypt your state. You hold the keys."

**3. Generic flexibility / model line**
- ❌ Before: "Unlock the power of any LLM with our cutting-edge, magical model-agnostic platform."
- ✅ After: "Bring your own model. Anthropic-native, OpenAI-compatible, or Gemini-compatible — the LLM is a resource the Agent uses, so you switch providers by config without touching the Harness."

---

## 7. Voice per persona / context

The dial settings in §1 hold everywhere; what shifts is **register and proof type**, never honesty or precision.

- **Developer & open-source pages (GitHub, ADRs, self-host, BYOM docs):** Most technical register. Lead with the mechanism and the code; link the ADRs and the services-reference. Dry wit is welcome. Proof = "read the code, read the trade-offs." Keep every defined term; assume the reader wants the precise word, not the gloss-heavy version.

- **Compliance & security pages (trust model, sovereignty, governance):** Most formal register, zero playfulness. Lead with the structural guarantee and the mechanism that enforces it (per-org `organization_id`, KMS separation, ReBAC, versioned policy sets, provenance). Speak the language of audit and isolation. Cite ISO 27001 / SOC 2 Type II only for hosting, and only as stated. Every claim must survive a procurement security review verbatim.

- **The blog & thought-leadership:** Most room to breathe — narrative, opinion, the "second mind" idea, category reframes ("governance, not just orchestration"). Slightly more casual and bold, but the honesty rule is unchanged: opinions are fine, invented facts are not. This is where dry wit and a strong point of view earn their keep.

- **Ops / automation pages (Solutions):** Plain-language, outcome-first register — "write the goal, keep control, ship without the backlog." Less jargon on the surface (gloss generously), but never swap the real term for a fake-friendly one. Proof = the Compile flow and the HITL flow made concrete.

- **The home page:** The balance point — leads with the "second mind" thesis, supports with three pillars, and never sells a single feature in the hero. Confident and clear, quietly bold; the boldest line on the page is a flat architectural fact, not a superlative.
