# Page Structure — How it works (`/how-it-works`)

> Section-by-section blueprint — structure + intent + target queries, **not** finished copy. Type: **Pillar**. Primary persona: **A (Operations) + B (Platform builder)**. Primary target query: *how to orchestrate multiple AI agents* / *how to build an AI workflow without code*. The one job: **walk the goal→harness→run lifecycle end to end** so a visitor understands the whole loop in one page. This page carries `HowTo` schema — it is the canonical procedural narrative.

---

## Wireframe (in lifecycle order)

### H1
"How Oraclous works" — from a goal in plain language to governed work running across people and Agents.
- Target: *how to orchestrate multiple AI agents*, *how does an AI agent platform work*.

### Hero
- **Headline intent:** "Write the goal. The platform does the rest — and proves it." A one-glance view of the lifecycle.
- **Subhead intent:** five steps — describe, compile, govern, run, learn — across human and Agent **Actors**, every step audited.
- **Primary CTA:** See it in the console (→ `app.oraclous.com`). **Secondary:** Read the architecture (→ `/developers`).

### Section 1 — Citable answer block (AEO hook)
- **H2:** "How does Oraclous turn a goal into running work?"
- **Answer block (liftable, 2–3 sentences):** An **Operator** states a goal in prose; the **Compile flow** surveys the workspace, asks clarifying questions, plans the topology, and emits an **OHM** manifest for review; once committed, the runtime runs the **Harness** across human and Agent **Actors** under a **ReBAC** policy envelope, with provenance and metering on every step.
- Links: `/platform/compile`, `/glossary/harness`, `/glossary/ohm`.

### Section 2 — Step 1: Describe the goal
- **H2 (question-shaped):** "Step 1 — How do you start a workflow?"
- The Operator writes *what* needs doing in prose. Links: `/platform/compile`, `/glossary/operator`.

### Section 3 — Step 2: Compile into a Harness
- **H2:** "Step 2 — How does prose become a runnable harness?"
- Compile flow: workspace survey → clarifying questions → topology planning → manifest emission → review dialogue → commit. Links: `/platform/compile`, `/platform/harness-model`, `/glossary/ohm`.

### Section 4 — Step 3: Govern it (ReBAC + policy envelope)
- **H2:** "Step 3 — How is the work governed?"
- ReBAC, the versioned policy set, capability allocation, budget caps, HITL gates. Links: `/platform/rebac-governance`, `/security`, `/glossary/rebac`.

### Section 5 — Step 4: Run it across Actors
- **H2:** "Step 4 — How does the work actually run?"
- One runtime dispatches agents → tool-use loop, humans → task-board assignments; durable, checkpointed, scheduled; HITL = waiting on a human like a tool return. Links: `/platform/actors`, `/platform/human-in-the-loop`, `/platform/execution-scheduling`.

### Section 6 — Step 5: Learn and remember
- **H2:** "Step 5 — Does the platform get better over time?"
- The Learn flow records to **Consciousness**; knowledge graph stores provenance-tracked org memory. Links: `/platform/knowledge-graph`, `/glossary/consciousness`, `/glossary/second-mind`.

### Section 7 — The whole loop (recap diagram) + portability note
- **H2:** "What do I own at the end?"
- Recap diagram of the five steps; "your work is portable via OHM, your model is yours via BYOM." Links: `/platform/portability`, `/platform/byom`.

### Section 8 — FAQ (AEO hook)
- **H2:** "Frequently asked questions"
- Candidates (keyword map §2): How to orchestrate multiple AI agents? · Do I need to write code? · How do you keep a human in the loop? · Can agents run on a schedule? · Can I review the harness before it runs?
- Links to the relevant capability pages.

### Section 9 — CTA band
- Primary: See it in the console / Start free. Secondary: Pick your team (→ `/solutions`).

---

## JSON-LD schema set
`HowTo` (the five steps as `HowToStep`s — this is the page's signature schema) + `FAQPage` + `BreadcrumbList`.

## CTAs
- **Primary:** See it in the console (→ `app.oraclous.com`).
- **Secondary:** Read the architecture / Pick your team.

## Key internal links out
`/platform/compile` · `/platform/harness-model` · `/platform/rebac-governance` · `/platform/actors` · `/platform/human-in-the-loop` · `/platform/execution-scheduling` · `/platform/knowledge-graph` · `/platform/portability` · `/platform/byom` · `/solutions` · `/security` · Glossary: harness, ohm, operator, rebac, consciousness, second-mind.
