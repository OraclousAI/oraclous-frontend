# LEARNINGS — self-improvement ledger

The shared memory that makes this build self-improving. **Every agent reads this file first.**
The **auditor** and **task-manager** append to it after each task; the **ui-ux** and
**developer** agents read it to avoid repeating mistakes and to reuse what worked.

Keep entries short and actionable. Format:

```
## L-NNN · [area] one-line lesson   (from T-XXX, YYYY-MM-DD)
**Saw:** what happened. **Do:** the rule to follow next time.
```

Areas: `corpus`, `provenance`, `ui/ux`, `a11y`, `build`, `process`, `edge-case`.

How the loop closes:
1. Auditor findings on a task → distilled into 1–3 lessons here.
2. Before the next task, developer + ui-ux read these and adjust up front.
3. Recurring lessons get promoted into the relevant agent's own instructions (a `D-NNN`
   DECISIONS entry records the promotion) so the rule becomes permanent, not just remembered.

---

## L-001 · [process] The pipeline is lean by design   (seed)
**Saw:** an early attempt fanned out 16 agents to structure content already in hand — pure
noise and slow. **Do:** only spawn an agent when its perspective is genuinely needed (design,
build, audit). Never parallelise work one agent can do directly. Prefer direct work over
orchestration unless fan-out earns its cost.

## L-002 · [provenance] Evidence ids must resolve   (seed)
**Saw:** the product's core value is auditability. **Do:** every curated claim carries real
`evidence_ids`; `pnpm corpus:validate` must stay green; never invent an id or overstate a
confidence label.

## L-003 · [build] No icon library — use the local inline-SVG Icon   (from T-002, 2026-06-11)
**Saw:** `lucide-react` isn't installed; adding it for ~6 glyphs costs bundle budget.
**Do:** use `src/components/primitives/Icon.tsx` (dependency-free, `currentColor`). Add new
glyphs there, don't add a dep.

## L-004 · [ui/ux] `.t-tiny` does not exist   (from T-002, 2026-06-11)
**Saw:** DEC-001 referenced `.t-tiny`; the smallest design-system type class is `.t-caption`.
**Do:** for badge micro-text use `fontSize: '11px'` inline on a `.t-mono`/`.t-caption` base.
ui-ux: only cite classes verified present in `semantic.css`.

## L-005 · [provenance] The ledger holds non-evidence rows   (from T-002, 2026-06-11)
**Saw:** 18 rows in the ledger have an `id` but no `source` (gap/unfound research notes),
which crashed `index.ts` and would have shown sourceless "evidence". **Do:** corpus evidence
is rows with `id` **and** `source.type`; everything else is a gap. Real evidence count = **583**.
Use that number in UI copy (honesty rule), not "600".

## L-006 · [a11y] Portal any block popover that lives inside a `<p>`   (from T-002, 2026-06-11)
**Saw:** `EvidencePopover`'s dialog (`div/ul/li/p`) nested inside the claim `<p>` → invalid
DOM nesting warnings. **Do:** render dialogs/popovers with block content via `createPortal`
to `document.body`, position `fixed` from the trigger rect; on `<768px` make it a bottom sheet.

## L-007 · [process] Verify UI with Playwright `channel:'chrome'` + axe   (from T-002, 2026-06-11)
**Saw:** chrome-devtools MCP can't attach (user's Chrome is running) and the Playwright
chromium download failed. **Do:** `scripts/verify-ui.mjs` drives the system Chrome
(`chromium.launch({channel:'chrome'})`, fresh profile — no conflict) and runs an axe WCAG-AA
scan + interaction probes. axe needs `browser.newContext()`. This is the standing UI gate.

## L-008 · [a11y] Never use `opacity` (or accent-coloured text) to show state   (from T-003, 2026-06-11)
**Saw:** `opacity:0.72` on the out-of-window ladder card dimmed its text to 2.6–2.8:1 (axe
fail); and colouring micro-labels with `--warning`/`--success` failed AA (33 nodes).
**Do:** show state with a dashed border / explicit label / neutral bg. Carry green-amber-red via
a **swatch/dot** (a UI element, ≥3:1) + neutral `--fg` label text — never colour the text.

## L-009 · [a11y] A section and its heading need distinct ids   (from T-003, 2026-06-11)
**Saw:** `Zone` put the same `id` on `<section>` and its `<h2>` → duplicate-id (invalid) and a
broken anchor target. **Do:** section owns the anchor `id`; heading gets `${id}-h` for
`aria-labelledby`. (Fixed in the `Zone` primitive.)

## L-010 · [process] Every persona's core need must have a home in the UI   (from T-006, 2026-06-11)
**Saw:** `engagement.json` (3 modes + 4 trust primitives + Three Asks) was validated in the corpus
but **never surfaced in a zone** — so the commercial/procurement reader's core need (the engagement
path + what to decide) was absent; persona score 2.5. **Do:** before "done", map each reader
persona → the zone that serves them; validated corpus data that no zone renders is a silent gap.

## L-011 · [ui/ux] Lead with the verdict for time-poor readers   (from T-006, 2026-06-11)
**Saw:** the board reader had to *assemble* the bottom line from snapshot cards (score 3.5). **Do:**
state the one-line verdict first (a "bottom line" callout), then the supporting cards. Don't make
the highest-altitude reader do synthesis.

<!-- Append new lessons below. -->
