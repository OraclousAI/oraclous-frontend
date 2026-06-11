---
id: T-002
title: App shell, corpus loaders, layout primitives
status: done
owner: eurail-developer
depends_on: [T-001]
---

> **Result (done):** AppShell (sticky band + centered report column + provenance footer),
> `useCorpus()`, and primitives `Zone` / `ConfidenceBadge` / `DomainTag` / `EvidencePopover`
> (portaled, focus-trapped, bottom-sheet on narrow) + a dependency-free `Icon`. Design per
> DEC-001. Gates: `typecheck` clean · `corpus:validate` green · **axe WCAG-AA 0 violations** ·
> console clean · no overflow @375px · Esc restores focus. Verified in-browser via
> `scripts/verify-ui.mjs` (Playwright `channel:'chrome'`). Lessons L-003…L-007 captured.

## Goal
The structural frame both surfaces share: a routed shell under the `/eurail` basename, the
corpus accessors wired into React, and the handful of reusable layout/provenance primitives
the zones and beats will compose from.

## Inputs
- `src/corpus/` (T-001) + `@oraclous/design-system` tokens.
- Spec: handoff §1 (shared foundation), §2 navigation model.

## Steps
1. Replace the placeholder `App.tsx` with the real route map: `/` (dashboard) and
   `/chat` (onboarder), plus a not-found. Keep `basename="/eurail"`.
2. A `useCorpus()` hook / context exposing the typed corpus (domains, findings, ladder,
   opportunities, phasing, signals, engagement, beats, evidence, conflicts) + lookups.
3. Layout primitives (token-styled, a11y-clean): `Zone` (section wrapper with heading),
   `ConfidenceBadge` (DIRECT/INFERRED/ASSUMPTION × HIGH/MED/LOW), `EvidencePopover`
   (click a claim → its evidence records), `DomainTag` (INT/USR/FED/MKT).
4. A header/orientation band component reused by Zone 1.

## Acceptance criteria
- [ ] Routes resolve under `/eurail`; deep-link + back-button work.
- [ ] `useCorpus()` returns fully-typed data; no `any`.
- [ ] `ConfidenceBadge` + `EvidencePopover` render real evidence from the ledger and meet AA
      (keyboard, focus, labelled).
- [ ] `pnpm typecheck` clean; dev server boots and `/eurail/` renders the shell.
