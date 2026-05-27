# CLAUDE.md — oraclous-frontend

This file is the working contract for any AI agent (Claude Code, an agent in the harness runtime, or otherwise) operating in this repository. Read it in full at the start of every session.

This repo is **`OraclousAI/oraclous-frontend`** — the TypeScript/React codebase for the Oraclous Platform's customer-facing surfaces: the console, the developer portal, embeddable widgets, and any shared frontend infrastructure. The repo is currently empty by design; the scaffolding work in R0.5 produces its initial shape. The backend repo (`oraclous-backend`) is a separate repository; the two share no code, only the Application Gateway API contract.

---

## 1. Identity and scope

This repo is owned by `frontend-implementer` and reviewed by several others:

| Agent | Activity here |
| --- | --- |
| `frontend-implementer` | Authors all production TypeScript/React code |
| `test-author` | Authors tests *before* implementation in a separate PR (Vitest unit/integration; Playwright E2E) |
| `devops-implementer` | Owns frontend build pipeline, container images, deployment config that lives in this repo |
| `qa-engineer` | Verifies test suite, coverage, accessibility checks, no flaky tests; authors regression tests |
| `code-reviewer` | Always on every PR for craft review |
| `security-architect` | On every security-marked PR (auth flows, CSP, CORS, XSS surfaces, integration-key handling) |
| `solution-architect` | On any PR that affects the API contract, the embed boundary, or design-system structure |
| `docs-writer` | Reads merged PRs; updates Confluence; drafts release notes |

`tech-lead` (the human, Reza Jahankohan) is the final sign-off on every gate that requires human approval. See **§8 Gates** below.

The full agent skill definitions live in Confluence under [Agent Skills Catalogue](https://oraclous.atlassian.net/wiki/spaces/OP/pages/753852). Read your own skill page on session start.

---

## 2. Source of truth

**Confluence is canonical.** This file summarises invariants and points at Confluence for everything that evolves. When this file disagrees with Confluence, Confluence wins; open a `docs-writer` ticket to reconcile this file.

The pages an agent in this repo consults most often:

| Need | Page |
| --- | --- |
| Architecture overview | [Platform Architecture v1.1](https://oraclous.atlassian.net/wiki/spaces/OP/pages/753707) |
| Layer model (where the frontend sits) | [Section 3 — Layered Architecture](https://oraclous.atlassian.net/wiki/spaces/OP/pages/65967) |
| Portability and embed model | [Section 7 — Portability Story](https://oraclous.atlassian.net/wiki/spaces/OP/pages/753728) |
| Application Gateway API (the backend the frontend calls) | [application-gateway-service](https://oraclous.atlassian.net/wiki/spaces/OP/pages/131124) |
| Security threats | [Section 6.5 — Security Threats and Mitigations](https://oraclous.atlassian.net/wiki/spaces/OP/pages/851990) + [Structured Threat Catalogue](https://oraclous.atlassian.net/wiki/spaces/OP/pages/983129) |
| Frontend stack | [Frontend Stack Reference](https://oraclous.atlassian.net/wiki/spaces/OP/pages/852051) |
| Design system | [Design System](https://oraclous.atlassian.net/wiki/spaces/OP/pages/852071) |
| Component conventions | [Component Conventions](https://oraclous.atlassian.net/wiki/spaces/OP/pages/557154) |
| State and data | [State and Data Patterns](https://oraclous.atlassian.net/wiki/spaces/OP/pages/983081) |
| Test approach | [Testing Approach (Frontend)](https://oraclous.atlassian.net/wiki/spaces/OP/pages/294936) |
| Releases | [09. Releases](https://oraclous.atlassian.net/wiki/spaces/OP/pages/164160) |
| **Agent Identity Convention (canonical)** | [09. Releases](https://oraclous.atlassian.net/wiki/spaces/OP/pages/164160) **Section 6** — authoritative for `Agent Owner` and `needs-human` field handling |
| ADRs | [02. ADRs](https://oraclous.atlassian.net/wiki/spaces/OP/pages/589826) |
| Code style | [Code Style Guide](https://oraclous.atlassian.net/wiki/spaces/OP/pages/426037) (TypeScript section) |
| Git workflow | [Git Workflow](https://oraclous.atlassian.net/wiki/spaces/OP/pages/131103) |
| PR conventions | [PR Conventions](https://oraclous.atlassian.net/wiki/spaces/OP/pages/393465) |
| Definition of Done | [Definition of Done](https://oraclous.atlassian.net/wiki/spaces/OP/pages/66010) |

Atlassian cloudId: `1eb21297-5f52-49a0-a303-3436694b148c`. Space key: `OP`. Jira project: `ORA`.

---

## 3. Frontend invariants

These are non-negotiable. A PR that violates any of them is rejected at review regardless of how well the tests pass.

### 3.1 The Application Gateway is the only backend

The frontend talks to **`application-gateway-service`** and nothing else. There is no direct call from the frontend to substrate, the capability registry, the harness runtime, or the execution engine. If the gateway does not expose an endpoint the frontend needs, the answer is to add the endpoint to the gateway, not to bypass it.

Reference: [Section 3 — Layered Architecture](https://oraclous.atlassian.net/wiki/spaces/OP/pages/65967) and [application-gateway-service](https://oraclous.atlassian.net/wiki/spaces/OP/pages/131124).

### 3.2 Use the typed API client

The frontend consumes the gateway through a typed client generated (or hand-curated) against the gateway's OpenAPI spec. Hand-rolled `fetch` calls are forbidden in feature code. If the client is missing an endpoint, the answer is to extend the client and the gateway in a coordinated PR, not to inline a fetch.

### 3.3 WCAG AA is the floor, not a goal

Every UI change ships at WCAG AA baseline:

- Semantic HTML (buttons are `<button>`, headings are `<h1>`…`<h6>`, form controls have labels).
- Keyboard reachable and operable for every interactive element.
- Visible focus indicators; predictable focus order; focus traps where required (modals, sheets).
- Colour contrast at least 4.5:1 for body text, 3:1 for large text and UI components.
- Screen-reader names and roles on every interactive element.
- `axe-core` (or equivalent) is clean on every PR for the AA ruleset.

### 3.4 Design system is the contract

Every visual element either uses an existing design-system component or token, or is the subject of a separate `[impl-design-system]` PR that extends the system. Inventing local colours, spacings, typography choices, or motion in a feature PR is rejected.

Reference: [Design System](https://oraclous.atlassian.net/wiki/spaces/OP/pages/852071) and [Component Conventions](https://oraclous.atlassian.net/wiki/spaces/OP/pages/557154).

### 3.5 Auth tokens never touch persistent storage outside the platform's storage primitives

The integration key, the session token, and the agent credential never go into `localStorage` or unconstrained cookies. The platform's storage primitives handle persistence; feature code calls them. Direct token handling in feature code is rejected.

### 3.6 Embeddable widgets respect the host

Widgets render in customer host pages. They never:

- Read or modify the host page's DOM outside their own root.
- Reach into `window.parent` or `window.top` beyond `postMessage` to a configured target origin.
- Inject styles into the host's stylesheet scope (use Shadow DOM or scoped CSS).
- Make calls to anything other than the configured gateway endpoint.

Reference: [Section 7 — Portability Story](https://oraclous.atlassian.net/wiki/spaces/OP/pages/753728).

### 3.7 No `dangerouslySetInnerHTML` on user-supplied content

If user content needs to render as rich content, it goes through a sanitiser with a strict allowlist. The default is to render as text. Exceptions are reviewed by `security-architect` on every PR that introduces one.

### 3.8 Bundle size is a budget, not a free resource

Every dependency addition is justified in the PR description. PRs that grow the bundle by more than ~5% trigger explicit `code-reviewer` review for whether the addition is worth it.

---

## 4. Working agreement

### 4.1 TDD is the contract

Every story that touches code follows the test-first flow:

1. `test-author` opens a `[tests]` PR with failing Vitest and/or Playwright tests.
2. The `[tests]` PR is reviewed by `solution-architect` (boundaries), `security-architect` (if security-marked), and `code-reviewer` (test code itself).
3. The `[tests]` PR merges.
4. `frontend-implementer` opens an `[impl]` PR with the minimum code that turns the failing tests green and clears accessibility checks.
5. The `[impl]` PR is reviewed by `code-reviewer`, `qa-engineer`, and any architects whose surfaces are touched.
6. `tech-lead` final-approves and the `[impl]` PR merges.

The implementer **never** modifies tests to make them pass. If a test is wrong, that is a discovery: flag it to `test-author` with the specific reason and propose a corrected test.

Reference: [ADR-010 — Test-Driven Development with Test-Author Agent](https://oraclous.atlassian.net/wiki/spaces/OP/pages/557078).

### 4.2 PR naming

| Prefix | Meaning | Author |
| --- | --- | --- |
| `[tests]` | Tests-only PR (failing tests, no implementation) | `test-author` |
| `[impl]` | Implementation PR against merged tests | `frontend-implementer` |
| `[impl-infra]` | Build pipeline, container images, deployment config | `devops-implementer` |
| `[impl-design-system]` | Design-system extension (new token or component) | `frontend-implementer` |
| `[regression]` | Regression test for a discovered bug | `qa-engineer` |
| `[docs]` | Repo-level docs (this file, READMEs) | `docs-writer` |
| `[chore]` | Dependency bumps, version pins, formatting | any implementer |

### 4.3 PR sizing

Target under 300 net lines of code per PR. UI work tends to be diff-heavy because of JSX; the budget is on code paths, not on JSX nodes. If you cross 300 lines of *logic*, justify it or split.

### 4.4 Branch model

`main` is protected; no direct pushes. Branches: `<agent-name>/<story-key>-<slug>`, e.g. `frontend-implementer/ora-67-chat-message-list-virtualisation`.

### 4.5 Commits

```
[ORA-67] [agent:frontend-implementer] Short imperative description

Longer body if needed.
```

The agent prefix is mandatory; see §5 below.

### 4.6 Spikes are explicit

Prototype work that does not follow TDD is a **spike**, marked `[spike]` in the Jira ticket and PR. Spikes do not merge to `main`.

---

## 5. Agent identity convention (operational)

The canonical convention lives in [09. Releases Section 6](https://oraclous.atlassian.net/wiki/spaces/OP/pages/164160). The operational summary for this repo:

### 5.1 The `Agent Owner` Jira custom field

- Field name: `Agent Owner`
- Field ID: `customfield_10074`
- Type: single-select
- Values: the 11 agent persona names plus `human` (option ID `10031`)
- Set this field to your persona's name while you are acting on a ticket. Update it when handing off.

### 5.2 The `needs-human` attention flag

- Field name: `needs-human` (display label may vary)
- Field ID: `customfield_10075`
- Type: **multi-checkbox custom field** (NOT a Jira label)
- Option value: `needs-human`, option ID `10032`
- To flag a ticket: write `customfield_10075: [{id: "10032"}]` via the Atlassian MCP.
- To clear: write `customfield_10075: []`.
- Query for tickets needing human attention: `project = ORA AND cf[10075] = "needs-human"`.

> **Why a multi-checkbox and not a label?** It is controlled (you can't typo it), it can't be removed by someone unfamiliar with the convention, and it is more queryable. This is the deliberate design.

### 5.3 Comment prefix on everything you write

Every Jira comment, Jira worklog, Confluence inline comment, GitHub commit message, GitHub PR description, and GitHub PR review comment you write while acting as agent `NAME` begins with:

```
[agent:NAME]
```

Comments that carry an action end with a structured trailer:

```
---
agent: NAME
action: handoff_to | status_change | escalation | observation | review_request | complete
to: target-agent-name (for handoff_to)
from_status: STATUS (for status_change)
to_status: STATUS (for status_change)
```

### 5.4 Operations

| Operation | Implementation |
| --- | --- |
| `my_tasks` | JQL: `project = ORA AND "Agent Owner" = "<your-name>" AND status != Done ORDER BY priority DESC` |
| `claim_next` | Find highest-priority unassigned ticket where the role matches; set `Agent Owner = $self`; transition to In Progress; post a claim comment |
| `handoff_to` | Set `Agent Owner` to target; transition status; post handoff comment with `action: handoff_to` trailer |
| `escalate_to_human` | (1) Set `Agent Owner = human`. (2) Set `customfield_10075: [{id: "10032"}]`. (3) Post structured escalation comment with `action: escalation` trailer. **All three together.** |
| `complete` | Transition to Done; post completion comment with `action: complete` trailer |
| `observe` | Post comment with `action: observation` trailer; no field or status change |
| `review_request` | Set `Agent Owner` to reviewer; transition to In Review; post `action: review_request` trailer |

Enforced by skill discipline through R6; by Capability Registry entry from R7 onward.

---

## 6. Repository layout

The repo is currently empty. The R0.5 scaffolding work establishes this shape. Deviations require an ADR.

```
oraclous-frontend/
├── CLAUDE.md                       # this file
├── README.md                       # human-facing onboarding
├── package.json                    # monorepo root (pnpm workspaces)
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── tsconfig.base.json
├── .nvmrc
├── .editorconfig
├── .gitignore
├── .eslintrc.cjs
├── .prettierrc
├── vitest.config.ts                # base config; per-package overrides as needed
├── playwright.config.ts            # E2E config
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                  # lint, type-check, unit/integration, build
│   │   ├── e2e.yml                 # Playwright on protected branches and on demand
│   │   └── release.yml             # build + publish on tag
│   └── CODEOWNERS
├── packages/
│   ├── api-client/                 # typed client for application-gateway-service;
│   │                               # the only sanctioned path to the backend
│   ├── design-system/              # tokens, primitives, composed components
│   ├── ui-utils/                   # hooks, accessibility helpers, formatters
│   ├── analytics/                  # privacy-aware telemetry surface
│   └── widget-sdk/                 # the embeddable widget contract (R6 target shape)
├── apps/
│   ├── console/                    # the customer-facing console
│   ├── portal/                     # the developer/documentation portal
│   └── widget-host/                # the sample host page for testing the embed flow
└── tests/
    ├── e2e/                        # Playwright suites across apps
    ├── accessibility/              # axe-core suites; a11y regression tests
    └── visual/                     # screenshot regression (optional, behind a flag)
```

### 6.1 `packages/` is shared

Code in `packages/` is consumed by `apps/` and by other packages. Adding a new package requires `solution-architect` approval.

### 6.2 `apps/` is what ships

Each app is a deployable artifact. Cross-app coupling goes through `packages/`, never through file imports between apps.

### 6.3 The api-client is sacred

`packages/api-client` is the **only** path from frontend to backend. PRs that introduce `fetch()`, `axios`, `ky`, or any other HTTP call outside this package are rejected.

---

## 7. Stack

The expected stack — confirm against [Frontend Stack Reference](https://oraclous.atlassian.net/wiki/spaces/OP/pages/852051) before assuming, since the page may have evolved:

- **TypeScript** (strict mode, no `any` unless inside a typed boundary helper).
- **React 18+** with function components and hooks; no class components in new code.
- **React Router or equivalent** for client routing.
- **TanStack Query** (or named convention from State and Data Patterns) for server state.
- **A state primitive** for cross-page client state (Zustand-class library; confirmed by State and Data Patterns).
- **Vitest** for unit and integration tests.
- **Playwright** for end-to-end tests.
- **axe-core** (via `vitest-axe` or `@axe-core/playwright`) for accessibility tests.
- **Tailwind, CSS Modules, or vanilla-extract** — confirmed by Frontend Stack Reference; do not assume.
- **Vite or Next.js** as build tool — confirmed by Frontend Stack Reference.

If Confluence contradicts this list, Confluence wins. If you discover the stack is undefined for a question that matters, escalate to `solution-architect` rather than picking arbitrarily.

Note from the legacy reference: the old frontend is **Bun + React 18 + Vite**. That fact is informational, not prescriptive — the target stack is whatever Frontend Stack Reference specifies, which may or may not retain Bun.

---

## 8. Gates

| From | To | Owner | What's verified |
| --- | --- | --- | --- |
| Backlog | Ready | `product-planner` + `solution-architect` + `security-architect` | Brief testable; architecture refs present; threat tags set |
| Ready | Tests Authoring | `test-author` | Pickup |
| Tests Authoring | Tests Review | `test-author` | `[tests]` PR with failing tests |
| Tests Review | Implementation | `solution-architect` + `security-architect` (if security-marked) | Tests assert the right boundary; security tests genuinely exercise threats; merge `[tests]` PR |
| Implementation | Code Review | implementer | `[impl]` PR with green tests + clean a11y |
| Code Review | Done | `code-reviewer` + `qa-engineer` + any required architect + `tech-lead` | Craft, coverage, security, accessibility, architecture all signed off |

Reference: [Definition of Done](https://oraclous.atlassian.net/wiki/spaces/OP/pages/66010).

---

## 9. Done means done

1. Tests PR merged; implementation PR merged; both passed full CI including a11y checks.
2. All gates have been transitioned through in order; no skips.
3. Every required reviewer signed off explicitly.
4. `Agent Owner` (`customfield_10074`) is set to whoever last touched it (typically `tech-lead` after merge).
5. Coverage on new code is adequate; no new flaky tests; no a11y regressions in axe-core.
6. Bundle-size impact (if any) is documented and within budget.
7. If a user-visible behaviour changed: `docs-writer` has updated the operator-facing docs or has an open ticket within the sprint.
8. The Jira ticket is transitioned to `Done` by the human (`tech-lead`).

---

## 10. What never to do

- Hand-roll a `fetch`, `axios`, `ky`, or any other HTTP call outside `packages/api-client/`.
- Call any backend service other than `application-gateway-service`.
- Invent a new colour, spacing, typography choice, motion curve, or shadow outside the design system in a feature PR.
- Ship a PR with axe-core AA violations.
- Use `dangerouslySetInnerHTML` on user-supplied content without a sanitiser and a `security-architect` sign-off.
- Persist auth tokens or BYOM credentials to `localStorage`, `sessionStorage`, or unconstrained cookies.
- Read or write the host page's DOM from a widget outside the widget's own root.
- Modify tests during implementation to make them pass.
- Use `latest` for a Docker base image or a peer-dependency version.
- Merge a PR without explicit reviewer sign-off, or while `customfield_10075` (`needs-human`) is ticked.
- Add or modify ADRs directly — propose to `solution-architect`.
- Edit Confluence architecture pages directly — propose to `solution-architect`.
- Treat a flaky test as "noise" — flakiness is a bug.
- Read or write the `legacy-reference/` directory's git state — it is a read-only worktree.

---

## 11. Legacy reference

The previous Oraclous frontend codebase is available **read-only** at:

```
/Users/reza/workspace/OraclousAI/legacy-reference/old-frontend/
```

It is a **git worktree pinned to the `develop` branch** of the previous frontend repository. `develop` is the most current branch of that codebase.

**Rules for the legacy reference:**

- Reference material for **behaviour to preserve**, not patterns to reproduce.
- Target: Confluence (Frontend Stack Reference, Design System, Component Conventions, State and Data Patterns). The legacy code is what we are migrating from.
- When in doubt: Confluence wins, this `CLAUDE.md` wins, legacy is third-place.
- Specifically watch out for: API call patterns (the legacy frontend likely talks to services other than the gateway), token storage (the legacy may persist tokens to `localStorage`), and ad-hoc styling (the new frontend uses the design system exclusively).
- Never write to `legacy-reference/`. It is a read-only worktree by convention.
- If the worktree is on a branch other than `develop`, surface to the human and stop — do not switch branches yourself.

---

## 12. Working with Confluence

Use the Atlassian MCP if available; otherwise the URLs in §2 are direct links.

When you discover a Confluence page is stale, open a `docs-writer` ticket; do not edit architecture, ADR, or design-system pages directly.

---

## 13. Working with Jira

Project key: `ORA`. Cloud ID: `1eb21297-5f52-49a0-a303-3436694b148c`.

| Need | JQL |
| --- | --- |
| My open work | `project = ORA AND "Agent Owner" = "<your-name>" AND status != Done ORDER BY priority DESC` |
| Frontend tickets in current sprint | `project = ORA AND sprint in openSprints() AND labels = frontend` |
| Needs human attention | `project = ORA AND cf[10075] = "needs-human"` |
| Done this week | `project = ORA AND status = Done AND resolved >= -7d` |

Custom fields:

- `Agent Owner` — `customfield_10074`, single-select, values are the 11 persona names plus `human` (option id `10031`).
- `needs-human` — `customfield_10075`, multi-checkbox, option id `10032`. Tick to flag, untick to clear.

---

## 14. Working with this file

Owned by `docs-writer`. Material changes go through a `[docs]` PR with `docs-writer` as author and `tech-lead` as approver. Cosmetic fixes can be batched into a periodic `[chore]` PR.

When you find a gap in this file, open a `docs-writer` ticket. Do not silently add to it; this file is short on purpose.

---

## 15. Resuming after a context reset

1. Read this file.
2. Read your own skill page from [Agent Skills Catalogue](https://oraclous.atlassian.net/wiki/spaces/OP/pages/753852).
3. Read [09. Releases Section 6](https://oraclous.atlassian.net/wiki/spaces/OP/pages/164160) — the canonical Agent Identity Convention. If your skill page's Section 11 disagrees with it on `needs-human`, Section 6 wins (skill pages have known drift on this point pending `docs-writer` reconciliation).
4. Run the "my open work" JQL above; the ticket with `Agent Owner = you` and `In Progress` status is yours.
5. Read the ticket's comments; the last `[agent:NAME]` comment with an action trailer tells you where you are.
6. Read the linked tests PR (if at Implementation stage) or the brief (if at Tests Authoring).
7. Continue.

If the trail is broken or contradictory, escalate via the `escalate_to_human` operation in §5.4.