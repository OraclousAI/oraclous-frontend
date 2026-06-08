# Page Structures — Solutions hub (`/solutions`) + per-persona template & 4 variants

> Blueprint — structure + intent + target queries, **not** finished copy. Covers the Solutions pillar hub, the shared per-persona template, and the 4 persona variants. Grounded in `messaging-matrix.md` §1 (per-persona matrix) and `personas.md`. Audience strategy: Home leads with the thesis; **Solutions speak per persona**.

---

# PART 1 — Solutions hub (`/solutions`)

Type: **Pillar**. Persona: **All**. Primary target query: *AI agents for [team]*. The one job: **route a visitor to the persona page that matches their pain.**

## Wireframe
- **H1:** "Solutions — Oraclous for your team."
- **Hero:** "One platform, framed for your problem." Subhead: the same second mind, four doors.
- **Citable answer block — H2:** "Who is Oraclous for?" → liftable: Oraclous serves operations leads (automate without the eng backlog), platform builders (stop rebuilding the platform under your agents), regulated/security teams (prove control), and multi-model teams (change the model, keep the harness). Links: each persona page.
- **Persona card grid — H2:** "Which team are you on?" → 4 cards (Operations · Developers · Regulated & security · Multi-model). Federation messaging folds into Regulated and Developers cards.
- **FAQ — H2:** "Frequently asked questions" → Who uses Oraclous? · Is it for technical or non-technical teams? · Can ops ship automation without engineers? · Is it suitable for regulated industries?
- **CTA band:** Pick your team / Book a walkthrough.

## JSON-LD
`CollectionPage` (or `WebPage`) + `ItemList` (the 4 solutions) + `FAQPage` + `BreadcrumbList`.

## Key links out
The 4 `/solutions/*` · `/platform` · `/why-oraclous` · `/pricing`.

---

# PART 2 — Per-persona Solution template (shared by all 4)

Type: **Cluster + conversion**. Intent: C. Every variant follows this skeleton; the variant table fills the slots.

## Shared wireframe

### H1
The persona's lead headline (from matrix §1) — e.g. "Automate the work, not the engineering backlog."

### Hero
- **Headline intent:** the persona's #1 headline. **Subhead intent:** the persona's subhead from matrix §1.
- **Primary CTA:** the persona's CTA (table). **Secondary:** Read the architecture / See how it works.

### Section 1 — The pain (recognition)
- **H2 (question-shaped):** the persona's pain as a question (e.g. "Why does every workflow need a 6-month engineering sprint?").
- Names the persona's top pains (personas.md). Links: the matching Why-Oraclous problem page.

### Section 2 — Citable answer block (AEO hook)
- **H2:** "How does Oraclous help {persona}?"
- **Answer block (liftable, 2–3 sentences):** the persona's "Oraclous answer" + differentiator from matrix §1, exact-termed.

### Section 3 — How it works for this persona
- **H2:** "How would this work for my team?"
- The persona's relevant capabilities, each linking to its `/platform/*` page (per `internal-linking.md` §2.2).

### Section 4 — Proof / why trust it
- **H2:** "How do I know it holds up?"
- The persona's proof points (matrix §1) — open source, architecture, ADRs, compliance as relevant. Links: `/open-source`, `/security`, `/about`. No invented metrics.

### Section 5 — FAQ (AEO hook)
- **H2:** "Frequently asked questions" — 3–5 from the keyword map, persona-specific (table).

### Section 6 — CTA band
- Primary + secondary CTA (table). Cross-link to Pricing.

## JSON-LD (every persona page)
`WebPage` + `FAQPage` + `BreadcrumbList`. (Service-style `Service` schema optional if framed as an offering.)

## The 4 variants — slot fills

### Variant 1 — `/solutions/operations` (Persona A — Operations lead)
| Slot | Value |
|---|---|
| H1 / hero | "Automate the work, not the engineering backlog." |
| Pain Q | "Why does every workflow need a 6-month engineering sprint?" |
| Citable answer | Operators describe goals in prose; the Compile flow turns them into governed Harnesses where humans and Agents share the work — no code, full control, complete audit. |
| Capabilities | compile, human-in-the-loop, harness-model, execution-scheduling |
| Why-Oraclous link | bespoke-code-is-brittle |
| Target query | AI agents for operations |
| FAQ | Can ops ship automation without engineers? · How do you keep a human in the loop? · Is the work audited? · Do I need to write code? |
| Primary CTA | Book a walkthrough · Secondary: See the Compile flow |

### Variant 2 — `/solutions/developers` (Persona B — Platform builder)
| Slot | Value |
|---|---|
| H1 / hero | "Stop rebuilding the platform under your agents." |
| Pain Q | "Why does 60% of agent work go to governance plumbing?" |
| Citable answer | ReBAC, the credential broker, provenance, and metering are substrate services — you compose Capabilities instead of re-implementing security per project, and stay portable through OHM. |
| Capabilities | harness-model, mcp-widgets, byom, portability, knowledge-graph |
| Why-Oraclous link | framework-wiring-overhead |
| Target query | AI agents for developers / internal tooling |
| FAQ | Is this just another framework? · Can I self-host? · Does it support MCP? · Can I actually leave (portability)? · Is the open source real? |
| Primary CTA | Read the architecture · Secondary: Read the code on GitHub |

### Variant 3 — `/solutions/regulated` (Persona C/E — Security/compliance + Federation)
| Slot | Value |
|---|---|
| H1 / hero | "Prove control — because it's built into the architecture." |
| Pain Q | "How do you prove to auditors that AI agents are controlled and isolated?" |
| Citable answer | Every record carries an organization_id, credentials never leave the broker in plaintext, and in cloud mode Oraclous staff cannot decrypt your state — with ReBAC and provenance giving auditors proof, not promises. Self-host or cloud, identical guarantees, your keys. |
| Capabilities | rebac-governance, human-in-the-loop, portability, metering |
| Why-Oraclous link | data-sovereignty, agent-governance-audit |
| Target query | AI agents for regulated industries |
| FAQ | What is the most secure AI agent platform for regulated industries? · Can hosted vendors see my data? · Can agents run air-gapped / on-premise? · Can teams collaborate across workspaces safely (federation)? · What happens to data when we leave? |
| Primary CTA | Review the trust model · Secondary: Book a security walkthrough |

### Variant 4 — `/solutions/multi-model` (Persona D — ML/multi-model lead)
| Slot | Value |
|---|---|
| H1 / hero | "Change the model. Keep the harness." |
| Pain Q | "Why does switching LLM vendors mean rewriting your agents?" |
| Citable answer | Oraclous resolves LLM config at agent, workspace, or organisation level across three protocol shapes (Anthropic-native, OpenAI-compatible, Gemini-compatible) — so you move between providers, or run them side by side, without touching the work definition. |
| Capabilities | byom, mcp-widgets |
| Why-Oraclous link | vendor-lock-in |
| Target query | model-agnostic AI agents / multi-model agents |
| FAQ | What does BYOM mean? · Does my provider fit the three protocol shapes? · Can I run a local model (Ollama)? · Where do my model keys live? · Does switching models change the harness? |
| Primary CTA | Configure BYOM · Secondary: Read the BYOM docs |

> Every persona page links up to `/solutions`, carries its breadcrumb, links its first-use terms into the Glossary, and links its problem→solution→capability chain per `internal-linking.md` §2.2 and §6.
