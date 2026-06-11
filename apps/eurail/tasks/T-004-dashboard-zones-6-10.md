---
id: T-004
title: Dashboard Zones 6–10 (library → chatbot entry)
status: done
owner: eurail-developer
depends_on: [T-002]
---

> **Result (done):** Zones 6–10 — Document library (5 docs), Evidence explorer (583 records,
> domain/confidence/source filters + search + paginate + empty-state), Conflict log (24,
> expandable), Methodology legend (label meanings + computed source registry), Chatbot entry.
> Gates: typecheck clean · corpus:validate green · **axe AA 0** · console clean · no overflow.

## Goal
The depth-and-trust half of the dashboard: the original documents, the interactive evidence
ledger, the conflict log, the methodology legend, and the persistent handoff to the chatbot.
This is where the product proves its rigor.

## Inputs
- Corpus (T-001), shell + primitives (T-002). Spec: handoff §2 Zones 6–10.

## Steps
1. **Zone 6 — Document library:** the 5 v2 docs, each with purpose/audience/length and an
   entry to read it (link to the source artifact).
2. **Zone 7 — Evidence explorer:** all 600 records, filterable by domain, confidence label,
   and source type; each record shows claim, source, confidence, verbatim raw text. This is
   the drill-down target from any claim elsewhere (support deep-link by evidence id).
3. **Zone 8 — Conflict log:** the 24 resolved conflicts — topic, what sources said, how
   resolved, synthesis taken. Surfaced as a credibility feature.
4. **Zone 9 — Methodology & how-to-read:** the confidence-label legend, the four-pass method,
   source registry summary, and the honest "what would tighten this" calibration list.
5. **Zone 10 — Guided-journey entry:** a persistent invitation to switch to the chatbot.

## Acceptance criteria
- [ ] Evidence explorer filters across all three axes incl. zero-result combinations; 600
      records perform acceptably (virtualise or paginate if needed).
- [ ] Deep-link to a single evidence id scrolls/opens that record (drill-down target works).
- [ ] Conflict log + methodology render fully from corpus.
- [ ] AA clean; `pnpm typecheck` clean; verified live via chrome-devtools.
