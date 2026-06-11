# design-log — rated UI/UX decisions

The `eurail-ui-ux` agent's growing, rated memory. One `DEC-NNN` entry per design decision.
Only **APPROVED** decisions (passing the rubric bar) are handed to the developer. This log is
read at the start of every UI task to keep the design coherent over time.

Entry format:

```
## DEC-NNN · [task T-XXX] short title — APPROVED | ITERATING | SUPERSEDED(by DEC-MMM)
**Decision:** the layout/visual/interaction approach, concretely (tokens, grid, states).
**Rating:** hierarchy x/5 · ds-fidelity x/5 · a11y x/5 · provenance x/5 · consistency x/5 · responsive x/5 → avg X.X
**Why approved / what to watch:** one or two lines.
```

Rubric bar: average ≥ 4.0, no dimension < 3, accessibility ≥ 4.

---

<!-- Append decisions below. -->

## DEC-002 · [task T-006] Persona UX-critic pass on the dashboard — PASS (round 1 → converged)
**Method:** 4 corpus personas (board / technical / commercial / assurance) × 3 devices
(390 / 768 / 1280), real screenshots via `screenshot-matrix.mjs`, viewed and judged.
**Round 1 fails:** Board 3.5 (verdict not punchy — had to assemble it from cards); Commercial 2.5
(engagement modes + Three Asks absent from the dashboard entirely).
**Fixes:** added `EngagementZone` (3 modes + 4 trust primitives + Three Asks) after the strategic
frame; added a "BOTTOM LINE" verdict callout leading the Executive snapshot.
**Round 2:** all four personas ≥ 4.3 on all three devices; axe AA still 0. Converged in 1 round.
**Human should still eyeball:** the exact wording/tone of the bottom-line verdict (editorial voice),
and the partnership zone's framing (it's the one place Oraclous is named as vendor).

## DEC-001 · [task T-002] App shell, corpus loaders, layout primitives — APPROVED

**Grounding.** `/ui-ux-pro-max` → archetype **"Data-Dense Dashboard"** (light+dark full,
WCAG AA), pattern **"Real-Time/Operations"** (status colors green/amber/red, "data-dense but
scannable", trust signals), plus its rules: `color-not-only` (never color-alone), explicit
**z-index scale (10/20/30/50)** not arbitrary, `tooltip-keyboard` (drill content keyboard-
reachable, not hover-only), `smooth-scroll` for anchors, `active-state` for current section,
`number-tabular` for ledger ids/counts, `table-handling` (card layout on narrow). Brand
non-negotiables from `design-system.md` enforced: **mint `--accent` is LIVE-SIGNAL ONLY**
(contrast 1.70 on paper → it is physically unusable as a label anyway), no emoji (lucide-react
only), Sora + JetBrains Mono, light is the default surface.

**Token inventory used (only these — all exist in tokens.css/semantic.css).**
Color: `--ink --paper --paper-soft --rule --mute --border-hair --accent` (live-only) ·
semantic `--success/-bg --warning/-bg --error/-bg --info/-bg` · perm `--perm-inherited(/-bg)
--perm-denied(/-bg)`. Type classes: `.t-display .t-h1 .t-h2 .t-h3 .t-h4 .t-body-lg .t-body
.t-dense .t-caption .t-mono .t-eyebrow`. Space: `--sp-1..--sp-24`. Radius: `--r-1..--r-4
--r-pill`. Elevation: `--shadow-1/-2/-3`. Motion: `--motion-hover-* --motion-press-*`,
`.is-blink` (cursor), reduced-motion already handled in semantic.css.

### A. App shell (`/` dashboard, `/chat` chatbot; `basename="/eurail"`)
- **Frame.** Single centered column, `max-width: 1120px`, side gutter `--sp-6` (desktop) /
  `--sp-4` (narrow), on `--bg` (paper). Content is a vertical report, not a multi-pane
  console — editorial reading surface first, dashboard affordances second.
- **Orientation band (sticky header, the `<BrandHeader>` reused by Zone 1).** Height ~56px,
  `background: var(--bg)`, bottom `1px solid var(--border-hair)`, `box-shadow: var(--shadow-1)`
  on scroll only, `z-index: 30`. Left: ORACLOUS lockup (wordmark; never bare chevron) +
  `.t-eyebrow` "EURAIL × ORACLOUS". Right: two-item nav (`role="navigation"`, `<a>`s) —
  **Dashboard** (`/`) and **Onboarder** (`/chat`). Active item: `--ink` text + `2px` bottom
  bar in `--ink`; inactive: `--fg-mute`. `aria-current="page"` on the active route. A
  visually-hidden **skip-link** ("Skip to report") to `#main` is first in tab order.
- **Two-surface relation.** Both are children of one `<AppShell>` (header + `<main id="main">`
  + footer rule). `/` = the long evidence report (Zones stacked). `/chat` = the onboarder; it
  swaps `<main>`'s body but keeps the same band so the two read as one product. NotFound =
  a `Zone`-wrapped message + link home. `html { scroll-behavior: smooth }` for in-page anchors;
  respect `prefers-reduced-motion` (skill `animation-optional`).
- **Footer.** Hairline rule, `.t-caption` `--fg-mute`: corpus provenance line
  (`corpusStats`: "596 evidence records · 24 conflicts · 12 findings") — provenance is
  first-class chrome, not a footnote.

### B. Layout primitives

**`Zone`** — section wrapper. Renders `<section aria-labelledby={id}>` with a generated
`id` (anchor target for deep-link + smooth-scroll). Header row: optional `.t-eyebrow` kicker
(e.g. "DOMAIN · USR") + an `<h2 class="t-h2">` (or `level` prop → correct `h2/h3` for
heading-hierarchy, never skip). A self-link anchor (lucide `link` / `hash`, 16px,
`aria-label="Link to section {title}"`, `--fg-mute`→`--ink` on hover) sits left of the
heading, visible on focus/hover. Vertical rhythm: zones separated by `--sp-16` (desktop) /
`--sp-10` (narrow); header→body gap `--sp-5`; intra-block gap `--sp-3`. Optional top hairline
`--border-hair`. Max measure for prose blocks: `68ch` (skill `line-length-control`).

**`ConfidenceBadge`** — `label` (DIRECT|INFERRED|ASSUMPTION) × `level` (HIGH|MED|LOW).
Treatment (AA-proven, computed): **inline pill, tinted fill + `--ink` text + colored left
hairline + a lucide glyph** — color is an accent, never the load-bearing signal. Text is
always near-black ink on the tint (measured **14.7–15.2 : 1**). `display:inline-flex`,
`gap:--sp-1`, `padding:2px --sp-2`, `border-radius:--r-2`, `border-left:3px solid <accent>`,
`.t-tiny` UPPERCASE label + `.t-mono` level. Per `label` (the kind):
  - **DIRECT** → fill `--success-bg`, accent `--success`, glyph lucide `check-circle`.
  - **INFERRED** → fill `--info-bg`, accent `--info`, glyph lucide `git-branch` (derived).
  - **ASSUMPTION** → fill `--warning-bg`, accent `--warning`, glyph lucide `circle-help`.
`level` modulates *weight, not hue* (avoids a 9-color explosion + the amber/green AA traps):
HIGH = solid 3px accent bar + filled glyph; MEDIUM = 2px bar; LOW = 1px bar + `--fg-mute`
glyph + `border:1px dashed var(--border-hair)`. Renders the level as text too
("DIRECT · HIGH") so it is never color/weight-only. `title`/`aria-label`:
"Confidence: direct, high". Note for dev: do **not** color the *text* with `--warning`
(2.98:1) or `--success` (3.85:1) — those fail AA as text; they are only ever the bar/glyph
(≥3:1 UI-component) on the tinted fill.

**`EvidencePopover`** — wraps a claim; click/Enter/Space reveals its evidence records
(consumes `resolveEvidence(evidence_ids)` → `EvidenceRecord[]`, and `conflictsForEvidence(id)`
to flag disputes). The claim is a real `<button type="button">` (inline, `text-align:left`,
`border:0`, `background:none`, `cursor:pointer`) with a **dotted underline in `--info`** +
a trailing superscript count (`.t-tiny`, e.g. "³") signalling "n evidence" — the drill
affordance is part of the claim's typography, so the path feels native, not bolted-on.
`aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`. Panel: `role="dialog"`
`aria-label="Evidence for: {claim}"`, `--bg` surface, `1px solid --rule`, `--r-4`,
`box-shadow:--shadow-3`, `z-index:50` (above header's 30; per skill z-scale), max-width 420px /
full-width on narrow, anchored to the claim, flips to stay in viewport. Each record row:
`.t-mono` id (tabular) · `ConfidenceBadge(label,confidence)` · `.t-dense` claim · source
`name`+`type` as a link (`source.url`, opens new tab, `rel="noopener"`) · `fetch_date`
`.t-caption`. If `conflictsForEvidence` non-empty: a `--perm-denied`-barred "Disputed —
see conflict" note. **Keyboard/focus (AA):** open moves focus to the dialog (heading/close);
**focus is trapped** while open; **Esc** closes and **restores focus to the trigger**;
close "✕" button is lucide `x` with `aria-label="Close evidence"`; outside-click closes.
Open/close = fade+2px rise `--motion-hover-dur`, disabled under reduced-motion. Long lists
(>~8) scroll inside the panel (`max-height: 60vh`, `overflow:auto`).

**`DomainTag`** — `code` (INT|USR|FED|MKT). Same AA-safe construction as ConfidenceBadge
(tinted fill + `--ink` text + colored dot + 3-letter mono code → never color-alone). Pill,
`--r-pill`, `padding:2px --sp-2`, `.t-tiny` mono UPPERCASE code, a 6px leading dot in the
accent color, fill = the tint. **Four distinct, AA-checked hues from the token set:**
  - **INT** (Internal capability) → dot/border `--info` `#4a6fa8` (4.62:1), fill `--info-bg`.
  - **USR** (User/customer) → dot/border `--success` `#2e8b57` (3.85:1 ≥3 UI), fill `--success-bg`.
  - **FED** (Federation) → dot/border `--perm-inherited` `#6ba0e8` — **2.44:1 fails 3:1 as a
    thin stroke**, so render the dot at **6px filled + a `1.5px` border** and pair with the
    code text (ink) so identity never rests on the stroke; fill `--perm-inherited-bg`.
    (Dev note: if a crisper edge is wanted, darken the *stroke only* to `#3f72b8` via
    `color-mix(in oklab, var(--perm-inherited) 70%, var(--ink))`; the token's own tint stays
    the fill.)
  - **MKT** (Market) → dot/border `--warning` `#b5862a` (2.98:1; same rule as FED — filled
    6px dot + ink code carry it, color is secondary), fill `--warning-bg`.
  In all four the readable text is `--ink` on the tint (≈14.3:1). `aria-label` spells the
  domain ("Domain: Federation"); shape is identical across domains so they're a coherent set.

### C. Type scale, spacing rhythm, responsive
- **Type scale** (existing classes only): page title `.t-display`/`.t-h1`; Zone heads
  `.t-h2`; sub-heads `.t-h3`/`.t-h4`; lede `.t-body-lg`; body `.t-body`; dense rows/cards
  `.t-dense`; ids/counts/dates `.t-mono` (tabular figures for alignment); kickers + tags +
  badges `.t-eyebrow`/`.t-tiny`/`.t-caption`. No raw px.
- **Spacing rhythm** (4px base): page top pad `--sp-12`; zone gap `--sp-16`; header→body
  `--sp-5`; card pad `--sp-4`; intra-row `--sp-2/3`; tag/badge inner `--sp-1`. One ladder,
  no off-scale values.
- **Responsive plan.** Breakpoints 1120 / 768 / 375. **Desktop (≥768)**: centered 1120px
  column; evidence panel anchored/floating; multi-column finding/opportunity grids allowed
  (CSS grid `auto-fit minmax`). **Narrow (<768)**: single column, gutters → `--sp-4`, zone
  gap → `--sp-10`; the sticky band stays (nav = same two links, no hamburger needed for two
  items); **EvidencePopover becomes a bottom-anchored full-width sheet** (still
  `role="dialog"`, trapped, Esc-dismiss) — never an off-viewport popover (skill
  `table-handling`/`horizontal-scroll`). Any tabular evidence reflows to stacked cards. No
  horizontal scroll at 375. All targets ≥44px tap (badges/tags that are buttons get
  `min-height:44px` hit area via padding/`hitSlop`-equivalent on touch).

**Rating:** hierarchy 4.5/5 · ds-fidelity 5/5 · a11y 5/5 · provenance 4.5/5 · consistency
4.5/5 · responsive 4/5 → **avg 4.58**.
**Why approved / what to watch:** Clears the bar (avg ≥4.0, no dim <3, a11y ≥4). The one
load-bearing constraint the developer MUST honor: the strong semantic/perm colors **fail AA
as text** (warning 2.98, success 3.85, inherited 2.44) — they are only ever borders/dots/
glyphs (≥3:1 UI-component); all readable badge/tag text is `--ink` on the *-bg* tint
(verified 14–15:1). Mint `--accent` is forbidden as a label (live-signal only). Watch in the
in-browser pass: FED/MKT dot legibility at 6px, evidence-panel focus-trap + Esc-restore, and
the narrow-width sheet transform.
