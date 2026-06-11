---
id: T-003
title: Dashboard Zones 1–5 (orientation → strategic frame)
status: done
owner: eurail-developer
depends_on: [T-002]
---

> **Result (done):** Zones 1–5 live — Orientation band (scope stats + two-path CTAs),
> Executive snapshot (sourced stat cards), Four domain lenses, Twelve findings (domain filter,
> incl. empty-state), Strategic frame (ladder · 8 opportunities · 4 phases · 6 signals +
> escalation). Every claim drills to evidence. Gates: typecheck clean · corpus:validate green ·
> **axe WCAG-AA 0 violations** · console clean · no overflow @375px. Lessons L-008, L-009 captured.

## Goal
The browse-it-yourself half of the dashboard, top to middle: orientation, the ten-second
verdict, the four-domain spine, the findings index, and the action frame. Lenses onto one body
of evidence, not a forced sequence.

## Inputs
- Corpus (T-001), shell + primitives (T-002). Spec: handoff §2 Zones 1–5.

## Steps
1. **Zone 1 — Orientation band:** title (Eurail × Oraclous, dated), scope in numbers
   (sources, 600 evidence, 24 conflicts, 4 domains, 5 docs), the two-path choice (browse vs
   start the chatbot → `/chat`).
2. **Zone 2 — Executive snapshot:** at-a-glance cards — overall maturity, position on the
   Adoption Ladder, AI-visibility (current 38 vs Day-90 target), per-domain readiness, the
   single headline risk.
3. **Zone 3 — Four domain lenses (primary spine):** INT/USR/FED/MKT panels — covers, current
   state, key finding(s), central risk + opportunity, drill-in to the domain's findings.
4. **Zone 4 — Findings index:** the 12 domain-tagged findings as cards; view all or filter by
   domain; each links to detail + evidence (Zone 7).
5. **Zone 5 — Strategic frame:** the Adoption Ladder (5 layers, why the order is mandatory),
   the 8 opportunities ranked, the 4-phase phasing, the 6 signals with thresholds.

## Acceptance criteria
- [ ] All five zones render from the corpus; no hardcoded facts.
- [ ] Every claim/number is click-through to its evidence (drill-path live).
- [ ] Domain filter on Zone 4 works incl. the empty-combination case.
- [ ] AA clean (headings in order, keyboard, contrast); responsive to narrow viewport.
- [ ] `pnpm typecheck` clean; verified live via chrome-devtools.
