# tasks/

The **source of truth for the Eurail dashboard build**. One markdown file per task,
`T-NNN-slug.md`. The `eurail-task-manager` agent reads this folder, sequences tasks by
`depends_on`, and dispatches each through the pipeline:

```
task → [eurail-ui-ux design gate (UI tasks only)] → eurail-developer → eurail-auditor → retro
```

Self-improvement: every agent reads `.claude/LEARNINGS.md` first; the auditor + task-manager
append distilled lessons after each task (see `.claude/agents/` and DECISIONS D-004).

## Task file format

```yaml
---
id: T-001
title: Short imperative title
status: todo        # todo | in-progress | in-review | done | blocked
owner: eurail-developer
depends_on: []      # list of task ids that must be `done` first
---
```

Body sections (all required):

- **Goal** — one paragraph: what "done" means in plain terms.
- **Inputs** — the corpus files, specs, or prior tasks this builds on.
- **Steps** — the concrete work, ordered.
- **Acceptance criteria** — a checklist the auditor verifies. Be specific and testable.

## Status lifecycle

`todo → in-progress → in-review → done` (or `blocked`). Only the auditor's PASS moves a task
to `done`. The task-manager keeps `status` current; a result note is appended on completion.

## Current board

| ID | Title | Depends on |
|----|-------|-----------|
| T-001 | Complete the corpus-context JSON layer + provenance validator | — |
| T-002 | App shell, corpus loaders, layout primitives | T-001 |
| T-003 | Dashboard Zones 1–5 (orientation → strategic frame) | T-002 |
| T-004 | Dashboard Zones 6–10 (library → chatbot entry) | T-002 |
| T-005 | Onboarder chatbot (interview → journey → beats) | T-001, T-002 |
| T-006 | Final strict gate: provenance + a11y + edge-cases | T-003, T-004, T-005 |
