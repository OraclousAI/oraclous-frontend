---
id: T-005
title: Onboarder chatbot (interview → journey → beats → provenance)
status: todo
owner: eurail-developer
depends_on: [T-001, T-002]
---

## Goal
The guided, personalized surface at `/chat`. It interviews the reader, assembles a unique path
through the corpus as an ordered sequence of beats, and renders each beat with visible
provenance. Deterministic assembly — no LLM call needed.

## Inputs
- Corpus (T-001) incl. `beats.json`; shell + primitives (T-002). Spec: handoff §3 + §4.

## Steps
1. **Opening frame** — what it is, the offer (a tailored short evidence-backed path).
2. **Interview** — Q1 role, Q2 concern (→ domain), Q3 disposition (champion/skeptic/neutral),
   Q4 time budget, Q5 optional free-text. Mutually-exclusive options; do not exceed these.
3. **Journey Architect (pure function)** — profile → ordered beats from `beats.json` by the
   §3.3 rules: opening set by disposition; spine set by concern; depth/language by role;
   length by time (quick ~3 / standard ~6 / deep ~9); the ladder beat (B08) always present;
   a role-appropriate closing CTA (B15). Pin an optional-question beat near the front if Q5
   answered. Must be reproducible from the same profile.
4. **Beat renderer** — each beat as Hook → Evidence (with confidence badge) → So-what →
   Bridge; provenance openable; the macro-arc oscillates "what is" ↔ "what could be".
5. **Journey as artifact** — encode the profile in the URL so a journey is shareable and
   reproducible; allow stepping out to any dashboard zone.

## Acceptance criteria
- [ ] All three worked-example profiles from the spec produce sensible, reproducible paths.
- [ ] B08 (ladder) always appears; length scales with Q4; opening flips with Q3.
- [ ] Every beat's evidence is real (resolves to ledger ids); no unsourced claim shown.
- [ ] Interview + beats are AA clean (keyboard, focus order, labelled options).
- [ ] Rarest profile path (e.g. assurance/skeptic/FED/deep) renders without gaps.
- [ ] `pnpm typecheck` clean; verified live via chrome-devtools.
