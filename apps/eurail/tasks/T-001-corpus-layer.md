---
id: T-001
title: Complete the corpus-context JSON layer + provenance validator
status: done
owner: eurail-developer
depends_on: []
---

> **Result (done):** corpus layer complete — 4 domains · 12 findings · 5 ladder layers ·
> 8 opportunities · 4 phases · 6 signals · 3 modes · 4 trust primitives · 3 asks · 15 beats ·
> 596 evidence · 24 conflicts. `pnpm corpus:validate` green (57 curated links, all resolve);
> `pnpm typecheck` clean. Domain map logged as D-005.

## Goal
A typed, evidence-linked corpus layer under `src/corpus/` that both surfaces render from —
the single source of factual content. Plus a provenance validator that fails the build if any
curated claim references an evidence id that doesn't exist in the ledger.

## Inputs
- Raw corpus already copied to `src/corpus/raw/` (evidence.jsonl 600, conflicts.json 24,
  deliverables.json 31, ontology.json).
- Curated narrative already extracted from the `Jahankohan/EURail` v2 docs.
- `src/corpus/types.ts` (written).

## Steps
1. Write the remaining curated JSON: `phasing.json` (4 phases), `signals.json` (6 + escalation),
   `engagement.json` (3 modes + 4 trust primitives + 3 asks), `beats.json` (15 beats),
   `documents.json` (the 5 v2 docs metadata). [findings/domains/ladder/opportunities done]
2. Convert `raw/evidence.jsonl` → an importable form and write `src/corpus/index.ts` that
   loads + types every artifact and exposes typed accessors (by id, by domain, evidence-for-claim).
3. Write `scripts/validate-provenance.mjs`: assert every `evidence_ids[].id` across all curated
   files exists in the ledger; assert counts (12/4/5/8/4/6/3/15); exit non-zero on any failure.
4. Log the module→domain map as decision **D-005** in `DECISIONS.md` (note the judgment-calls).

## Acceptance criteria
- [ ] All curated JSON files present and parse; counts exact (12 findings, 4 domains, 5 ladder
      layers, 8 opportunities, 4 phases, 6 signals, 3 modes, 15 beats).
- [ ] `src/corpus/index.ts` exports typed accessors; `pnpm typecheck` clean.
- [ ] `pnpm corpus:validate` exits 0; every evidence id resolves to a real ledger record.
- [ ] D-005 logged with the module→domain map and its judgment-calls.
