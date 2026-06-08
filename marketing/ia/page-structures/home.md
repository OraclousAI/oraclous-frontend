# Page Structure — Home (`/`)

> Section-by-section wireframe blueprint (structure + intent + target queries), **not** finished copy. Grounded in the Home message hierarchy (`messaging-matrix.md` §3) and the positioning thesis. Type: **Pillar + conversion**. Primary persona: **All** (B + A front doors). Primary target query: *agentic AI platform for enterprise* / *AI agent orchestration platform*. The one job: **land the "second mind" thesis and route each persona to its door.**

---

## Wireframe (in order)

### H1
Brand thesis headline — the "second mind" promise. (Hero never sells a single feature; it sells the *second mind* — hierarchy rule, matrix §3.)
- Target: *agentic AI platform for enterprise*, *AI agent orchestration platform*.

### Hero
- **Headline intent:** "Form your organisation's second mind." — humans + AI Agents as one governed fabric.
- **Subhead intent:** open-source platform where your people and AI **Agents** work side by side, under your own access rules (**ReBAC**), orchestrated by goals you write in plain language; self-host or cloud, you hold the keys.
- **Primary CTA:** Start with the architecture (→ `/platform` or `/developers`). **Secondary CTA:** Book a walkthrough.
- Hero visual: one task board with human + Agent **Actors** (not a chatbot UI).

### Section 1 — Citable answer block (the AEO hook, placed high)
- **H2 (question-shaped):** "What is Oraclous?"
- **Answer block (2–3 sentences, liftable):** Oraclous is an open-source agentic operations platform — a "second mind" where human members and AI **Agents** work as symmetric **Actors** on one governed fabric. **Operators** describe goals in plain language; the platform compiles, governs (with **ReBAC**), and runs them. It is data-sovereign by design, model-agnostic via **BYOM**, and portable through the open **OHM** manifest.
- This is the verbatim definition engines should cite. Links: `/glossary/second-mind`, `/platform`, `/glossary/rebac`.

### Section 2 — The three bad choices (problem framing)
- **H2:** "Why is putting AI agents to work so hard today?"
- Three short panels: Build it in code (brittle) · Buy closed SaaS (lose sovereignty) · Wire frameworks (governance by hand) → "Oraclous is the fourth choice."
- Links out: `/why-oraclous` (hub) + each problem page.

### Section 3 — Pillar 1: One workforce, one fabric
- **H2:** "Can humans and AI agents share one task board?"
- Claim + proof (Actor definition; HITL "waiting on a human like waiting on a tool return"; no privileged code path).
- Links: `/platform/actors`, `/platform/human-in-the-loop`, `/solutions/operations`.

### Section 4 — Pillar 2: Describe the goal, not the pipeline
- **H2:** "How do you build an AI workflow without writing code?"
- Claim + proof (prose-vs-code separation; Compile flow; platform-as-code).
- Links: `/platform/compile`, `/platform/harness-model`, `/glossary/platform-as-code`.

### Section 5 — Pillar 3: Your data, your keys, your exit
- **H2:** "Is an AI agent platform safe for our data?"
- Claim + proof (cross-org flow impossible; staff can't decrypt; BYOM; OHM portability).
- Links: `/security`, `/platform/byom`, `/platform/portability`.

### Section 6 — Proof band
- **H2:** "How do we know this is real?"
- Four chips: Open source (GitHub + ADRs) · Honest docs (incl. what's deferred) · Governance you can read (five versioned policy sets) · Compliance for hosting (ISO 27001 + SOC 2 Type II).
- Links: `/open-source`, `/security`, `/about`. No invented metrics/logos (positioning §7).

### Section 7 — Per-persona doors
- **H2:** "Which problem are you solving?"
- Five cards → Operations · Platform builders · Regulated & security · Multi-model teams · Multi-team federation. Each card re-frames the thesis to that persona's pain.
- Links: the 4 `/solutions/*` pages (federation folds into regulated/developers messaging on the regulated card).

### Section 8 — FAQ (AEO hook)
- **H2:** "Frequently asked questions"
- Candidate questions (from `keyword-entity-map.md` §2):
  1. What is an AI agent orchestration platform?
  2. What is the difference between an AI agent framework and an AI agent platform?
  3. Can you self-host AI agents?
  4. How do I avoid vendor lock-in with AI agents?
  5. Is Oraclous open source and free?
- Each links to the deeper page (Glossary / Why-Oraclous / Open-source / Pricing).

### Section 9 — Final CTA band
- **Primary CTA:** Start free (self-host) → `app.oraclous.com`. **Secondary:** Book a walkthrough / Read the architecture.

---

## JSON-LD schema set
`Organization` (with `sameAs` array — GitHub, LinkedIn, Crunchbase, Wikidata per keyword map §4) + `SoftwareApplication` + `FAQPage` + `WebSite` (with `SearchAction`) + `BreadcrumbList`.

## CTAs
- **Primary:** Start with the architecture / Start free (self-host).
- **Secondary:** Book a walkthrough.

## Key internal links out
`/platform` · `/why-oraclous` · `/security` · `/open-source` · the 4 `/solutions/*` · `/glossary/second-mind` · `/glossary/rebac` · `/pricing`.
