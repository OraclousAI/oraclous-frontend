# DECISIONS — `apps/eurail`

The append-only decision log for the Eurail × Oraclous dashboard surface served at
`oraclous.com/eurail`. Every non-obvious architectural or content choice gets a numbered
entry here, with its rationale and (where relevant) the evidence basis. This file is the
durable "why" — it travels with the code and is reviewable in PRs.

> Convention (mirrors `oraclous-knowledge/DECISIONS.md`): append, never rewrite history.
> Each entry: **context → decision → rationale → consequences**. Supersede with a new
> entry that references the old one; do not edit a shipped decision in place.

---

## D-001 — Surface lives as a new SPA `apps/eurail` in the frontend monorepo

**Context.** The deliverable is a highly interactive surface (onboarder chatbot, evidence
explorer with filtering, bidirectional drill-down). `oraclous.com` is the planned (not-yet-
built) Astro marketing site; the console SPA is `app.oraclous.com`.

**Decision.** Build a dedicated **Vite + React 18 SPA** at `apps/eurail`, reusing
`@oraclous/design-system` tokens, with Vite `base: '/eurail/'` and router
`basename="/eurail"`. It mounts at `oraclous.com/eurail` via an edge/proxy rule resolved at
deploy time.

**Rationale.** The interactivity argues against a static-first Astro app; a standalone repo
would re-create the design system and lose shared tooling. A monorepo SPA reuses tokens +
conventions and stays independent of the marketing-site build. Follows `oraclous-frontend`
`CLAUDE.md` conventions (token-first styling, **no Tailwind**, `.js`/`.jsx` import
extensions).

**Consequences.** Content-only, **no backend calls** — the corpus ships as static JSON, so
the gateway-only rule (Gate 1) and no-token-in-storage rule (Gate 2) pass by construction.
Hosting path routing (`oraclous.com/eurail` → this build) is a separate deploy decision.

## D-002 — Corpus-context JSON layer is built first (the foundation)

**Context.** The dashboard/chatbot spec is organized around a curated narrative layer
(4 domains INT/USR/FED/MKT, 12 findings, 5-layer Adoption Ladder, 8 opportunities, 4-phase
phasing, 6 signals, 3 engagement modes, 15 beats) that exists only as prose inside the
`Jahankohan/EURail` v2 HTML docs. The evidence (600 records) + conflicts (24) are already
machine-readable.

**Decision.** Milestone 1 extracts the curated layer into typed, evidence-linked JSON under
`src/corpus/`, plus a provenance validator, **before** any UI is built. Nothing renders
correctly without it.

**Rationale.** Both surfaces (dashboard + chatbot) are pure functions of this JSON. Building
UI against un-extracted prose would hardcode claims and break the provenance rule.

**Consequences.** A one-time authored **module/dimension → domain** mapping is required
(see D-003 once authored) — the single real judgment call, since evidence is tagged by
`module`/`dimensions`, not by the 4 domains.

## D-003 — Provenance is a hard gate, not a guideline

**Context.** The product's core value is auditability: every factual claim shown to a reader
must trace to ≥1 evidence record carrying its confidence label (DIRECT/INFERRED/ASSUMPTION
× HIGH/MEDIUM/LOW).

**Decision.** A build-time **provenance validator** (`scripts/validate-provenance.mjs`)
asserts every curated claim references real evidence IDs with a confidence label; orphan
claims fail the build. The same rule governs both surfaces (the "Evidence Provenance
Guardian" from the handoff, implemented as code).

**Rationale.** Honesty rule from the corpus: no invented metrics, customers, prices, or
certifications. A machine gate is the only reliable enforcement.

**Consequences.** Curated JSON entries must each carry an `evidence_ids[]` field; the build
is red until they do.

## D-004 — Lean four-agent pipeline with a self-improvement loop

**Context.** The build should be fully automated with zero manual involvement, but an early
attempt over-orchestrated (16 throwaway agents to structure content already in hand) — noise
and slow.

**Decision.** Drive the build with exactly **four** repo-defined agents in `.claude/agents/`,
each genuinely distinct, coordinated by `tasks/` as the source of truth:
- **eurail-task-manager** — reads `tasks/`, sequences by dependency, dispatches, tracks status.
- **eurail-ui-ux** — design authority; uses the `/ui-ux-pro-max` skill + `oraclous-knowledge/
  frontend/` conventions; self-rates each decision against a rubric and only hands APPROVED
  specs downstream; verifies built UI in-browser via chrome-devtools.
- **eurail-developer** — implements one task to its acceptance criteria.
- **eurail-auditor** — three staged gates (provenance → quality/a11y → edge-cases).

**Self-improvement spine:** `.claude/LEARNINGS.md` is shared memory — every agent reads it
first; the auditor + task-manager append distilled lessons after each task; recurring lessons
get promoted into an agent's instructions and recorded as a new `D-NNN`. The ui-ux agent keeps
a rated `.claude/design-log.md`. The loop closes per task, so the pipeline gets smarter as it
runs.

**Rationale.** Only-needed agents (no noise), file-based + durable (committed with the app),
and a feedback loop that compounds quality instead of repeating mistakes.

**Consequences.** Work units live in `tasks/T-NNN-*.md`; nothing is `done` without an auditor
PASS (and a ui-ux in-browser pass for UI tasks).

---

## Process — how this build runs

Per D-004: `tasks/` → task-manager → (ui-ux design gate) → developer → auditor → retro into
`LEARNINGS.md`. UI verified via the chrome-devtools MCP; design quality via `/ui-ux-pro-max`
grounded in `oraclous-knowledge/frontend/`. Autonomous decisions are logged here as `D-NNN`.
Work proceeds on branch `feat/eurail-dashboard`; `main` is untouched.

## D-005 — Module → domain mapping (the one authored judgment call)

**Context.** Evidence is tagged by 20 `module`s, not by the 4 dashboard domains
(INT/USR/FED/MKT). The spine needs a deterministic rollup. Per D-002 this is the single real
judgment call in the corpus layer.

**Decision.** The full map lives in `src/corpus/domains.json` (`module_domain_map`). Clear
assignments: company-intel/tech-stack-forensics → **INT**; customer-voice/cust-journey/
breach-aftermath/trip-planner-sunset → **USR**; cooperative-governance/federation-moat/
gap-silent-operators/gap-05-silent-pilots → **FED**; industry-market/competitor-ai-benchmark/
distribution-disruption/third-party-surrogates → **MKT**.

**Judgment calls (flagged `judgment-call` in the data):**
- `geo-aeo-state` → **USR** (AI-search findability of the customer-facing surface; defensible as MKT).
- `mcp-ecosystem` → **USR** (agent-callable customer distribution channel).
- `gap-01-b2b` → **INT** (internal B2B/ops capability; defensible as USR).
- `regulatory-landscape` → **FED** (TEL TSI drives cross-operator data-sharing).
- `disruption-resilience` → **FED** (cross-operator disruption rebooking is the federation capability).
- `adoption-scenario` → **MKT** (cross-cutting, anchored to the market-position outcome).

**Rationale.** Map by what the evidence is *about* for a reader navigating by concern, not by
which team produced it. Judgment-calls are marked in-data so they can be revisited.

**Consequences.** `evidenceByDomain()` and `domainForEvidence()` derive from this map; changing
a row reclassifies evidence across the dashboard's domain spine.

## D-006 — Experiential UX gate via a persona critic (lean, end-of-build)

**Context.** axe proves mechanical a11y, not whether the product is good to *use*. We want a
strict "act as a target user and judge satisfaction" loop, but the full matrix (4 personas × 5
devices × 10 zones × N loops) is over-engineering.

**Decision.** Add one `eurail-ux-critic` agent that role-plays the **4 corpus reader personas**
(board / technical / commercial / assurance), looks at real screenshots (via vision), and
judges satisfaction (1–5) **per surface × 3 devices** (mobile 390 · tablet 768 · desktop 1280).
It runs **once at the end** (after the dashboard + chatbot are built), inside a converge-loop
(critique → fix → re-shoot → re-judge) with a **hard ceiling of 3 rounds**. Bar: every persona
≥4 on every device. Verdicts logged to `design-log.md`; lessons to `LEARNINGS.md`.

**Rationale.** ~90% of the experiential value at ~30% of the full-matrix cost. The personas are
corpus-grounded, not invented. The critic is a strong pre-filter, not a substitute for a human
eye — the maintainer still does the final spot-check.

**Consequences.** Needs `scripts/screenshot-matrix.mjs` (per-surface × 3-device capture). Runs
as task T-006.

## D-007 — The onboarder is a streaming AI chatbot (deterministic journey set aside)

**Context.** The handoff's deterministic onboarder (interview → `journeyArchitect` → `BeatView`)
was built but judged "too static — not a chatbot." The maintainer wants a real AI chat that
streams word-by-word like Claude.

**Decision.** `/chat` becomes a **streaming AI chatbot**. The deterministic journey/beats code
(`src/chat/journey.ts`, `src/chat/BeatView.tsx`) stays in the repo as corpus-grounding material
but is **no longer routed**; `ChatPage` is a placeholder until the AI chat lands.

**Testing bridge (dev-only, [[project-eurail-chatbot-testbridge]]):** since `apps/eurail` is a
Vite SPA with no backend, a **Vite dev middleware** logs each question to the port console +
an inbox file; Claude watches it, writes a reply to an outbox file; the UI streams it word-by-word.
This makes Claude the live "model" for testing without an LLM API. A production chatbot would call
an LLM via the Application Gateway (gateway-only rule).

**Consequences.** Build order: dashboard polish (UX-critic pass) first, then the chat bridge.

## D-008 — Migrated from Vite SPA to Next.js 14 (App Router) for the dev chat bridge

**Context.** The onboarder was to be "fully AI" in dev via a human-in-the-loop bridge (a Claude
operator answers, the UI streams it). That needs a server process whose `console.log` lands in the
port stdout the operator watches. The original `apps/eurail` was a static Vite SPA (D-001) with no
server runtime.

**Decision.** Migrate `apps/eurail` to **Next.js 14 (App Router)**, `basePath:'/eurail'`, served on
port 5190 → `localhost:5190/eurail`. The chat is an **SSR route** (`app/api/chat/route.ts`) that
logs the flagged question to stdout and streams the operator's reply from an outbox file. Dashboard
+ chat are client components; `app/layout.tsx` is the shell. `.js`-extension imports resolve via a
`next.config.mjs` webpack `extensionAlias` (no import rewrites). This supersedes D-001's "Vite SPA".

**Rationale.** SSR gives the server-console channel the bridge needs; the migration was mechanical
(routing + `'use client'` + `next/link`), and the dashboard rendered pixel-identical with zero page
errors. Diverges from the rest of `oraclous-frontend` (Vite) — accepted for this app, this phase.

**Consequences.** The chat "AI" is the Claude-operator bridge (no LLM API/local model this phase —
maintainer constraint: no paid services). The provenance + corpus layer (D-002/D-003/D-005) and the
agent pipeline (D-004/D-006) are unchanged. For production, the chat would call an LLM via the
Application Gateway (gateway-only rule). See `README.md` for run + bridge details.

<!-- Append new decisions below this line. -->
