# CLAUDE.md — oraclous-frontend

This file is the working contract for any AI agent (Claude Code, an agent in the harness runtime, or otherwise) operating in this repository. Read it in full at the start of every session.

This repo is **`OraclousAI/oraclous-frontend`** — the TypeScript/React codebase for the Oraclous Platform's customer-facing surfaces: the console, the developer portal, embeddable widgets, and any shared frontend infrastructure. The repo is currently empty by design; the scaffolding work in R0.5 produces its initial shape. The backend repo (`oraclous-backend`) is a separate repository; the two share no code, only the Application Gateway API contract.

---

## 0. Operating Contract (single authority)

All agents operating in this session are governed by the **ORAA-4 Operating Contract** — the canonical PaperClip document (`operating-contract`) for gate→owner maps, run-completion rules, and engineering governance.

**When this file and ORAA-4 diverge, ORAA-4 wins.** File a `docs-writer` issue to reconcile this file.

Key provisions every agent must observe:

- **§7 Linkage invariant:** Every issue must have its `goalId` (release) and `projectId` (epic) set before work begins. Issues missing either are returned to the backlog for enrichment.
- **§4 Run-completion contract:** A run may only end by reassigning the issue to a named next owner, by creating an assigned child issue, or by escalating with a specific question. A run never ends "done, nothing assigned."
- **§5 Mandatory local pre-push gate:** before any `git push`, run the cheap checks CI's `quality` job runs, locally, and push only if clean (see §5 below).
- **§12 Workspace discipline:** per-run git worktrees are OFF; every agent writing this repo shares one checkout (see §5.5 below).

---

## 1. Identity and scope

This is the **frontend execution** repository. Currently exactly one persona lives and acts in this repo session:

| Agent | Activity here |
| --- | --- |
| `frontend-implementer` | Authors all production TypeScript/React code (`[impl]` PRs) |

The **CTO agent** holds full technical authority over this repo: it reviews frontend craft, merges feature PRs after gates pass, and is the standing reviewer the absent FE review agents would otherwise be. The CTO escalates to the human (Reza Jahankohan) only when a decision is ambiguous, blocked, or out-of-policy; Reza is the final human sign-off at release level only.

### The deliberate frontend asymmetry

Frontend currently has **no test-author, no test-review, and no code-review agent**. FE tests are deferred and FE craft review is owned by the **CTO** (per ORAA-4 §2). This is a deliberate, temporary state, to be re-evaluated at the R-Frontend Phase B milestone. Consequences:

- FE issues move READY → IMPLEMENTATION → CODE REVIEW → DONE, skipping the two test columns.
- The invariants that a review agent would otherwise catch — the gateway-only API rule (§3.1), the typed api-client rule (§3.2), no tokens in `localStorage` (§3.5), and WCAG AA (§3.3) — are enforced by **FE-repo CI gates**, not by an agent. The asymmetry removes review *agents*, not *enforcement*. Do not weaken these CI gates.

### Personas that do NOT live here

Planning, architecture, cross-cutting agreement, infra, and documentation happen in the **coordinator** session at the workspace root. `product-planner`, `solution-architect`, `security-architect`, `devops-implementer`, and `docs-writer` all live there. You receive **ready, briefed issues** with lift-tags by being **assigned the issue on the PaperClip board**; you do not plan or architect here. When this session needs an architecture decision, a Contract, a brief fix, or a doc/infra change, it **escalates to the coordinator** by reassigning the issue (or filing a child issue) to the relevant coordinator persona — it does not load that persona here.

Canonical residency map: [Session topology and persona residency](https://oraclous.atlassian.net/wiki/spaces/OP/pages/1736705) (Confluence read-only mirror). Full skill definitions: [Agent Skills Catalogue](https://oraclous.atlassian.net/wiki/spaces/OP/pages/753852) (mirror). Read your own skill page on session start.

---

## 2. Source of truth

**`oraclous-knowledge` is the canonical knowledge base** — a git repository that holds the authoritative architecture, ADRs, contracts, and conventions. **Confluence is now a read-only mirror** of it; the Confluence URLs below are convenience links into that mirror, not the source. **PaperClip** is the master board for all work (Goals → Projects → Issues). This file summarises the invariants that matter most in this repo and points at the knowledge base for everything that evolves. When this file disagrees with the canonical knowledge base, the knowledge base wins; file a `docs-writer` issue to reconcile this file.

The pages an agent in this repo consults most often (Confluence read-only mirror; `oraclous-knowledge` is canonical):

| Need | Page (read-only mirror) |
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
| **Operating governance (canonical)** | **ORAA-4 Operating Contract** (PaperClip document `operating-contract`) — authoritative for run-completion, gates, identity, and workspace discipline |
| ADRs | [02. ADRs](https://oraclous.atlassian.net/wiki/spaces/OP/pages/589826) |
| Code style | [Code Style Guide](https://oraclous.atlassian.net/wiki/spaces/OP/pages/426037) (TypeScript section) |
| Git workflow | [Git Workflow](https://oraclous.atlassian.net/wiki/spaces/OP/pages/131103) |
| PR conventions | [PR Conventions](https://oraclous.atlassian.net/wiki/spaces/OP/pages/393465) |
| Definition of Done | [Definition of Done](https://oraclous.atlassian.net/wiki/spaces/OP/pages/66010) |

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

If user content needs to render as rich content, it goes through a sanitiser with a strict allowlist. The default is to render as text. Exceptions are reviewed by `security-architect` (via the coordinator) on every PR that introduces one.

### 3.8 Bundle size is a budget, not a free resource

Every dependency addition is justified in the PR description. PRs that grow the bundle by more than ~5% trigger explicit CTO review for whether the addition is worth it.

---

## 4. Working agreement

### 4.1 TDD is the contract (when test agents are present)

Frontend test agents are currently deferred (§1), so FE work runs the abbreviated flow in §8. The full test-first flow below applies when FE testing returns at R-Frontend Phase B:

1. `test-author` opens a `[tests]` PR with failing Vitest and/or Playwright tests.
2. The `[tests]` PR is reviewed by `solution-architect` (boundaries), `security-architect` (if security-marked), and the relevant reviewer for the test code itself.
3. The `[tests]` PR merges.
4. `frontend-implementer` opens an `[impl]` PR with the minimum code that turns the failing tests green and clears accessibility checks.
5. The `[impl]` PR is reviewed by a non-implementer and any architects whose surfaces are touched.
6. The CTO final-approves and merges the `[impl]` PR.

The implementer **never** modifies tests to make them pass. If a test is wrong, that is a discovery: flag it to `test-author` (via the coordinator) with the specific reason and propose a corrected test.

Reference: [ADR-010 — Test-Driven Development with Test-Author Agent](https://oraclous.atlassian.net/wiki/spaces/OP/pages/557078).

### 4.2 PR naming

| Prefix | Meaning | Author |
| --- | --- | --- |
| `[tests]` | Tests-only PR (failing tests, no implementation) | `test-author` |
| `[impl]` | Implementation PR against merged tests | `frontend-implementer` |
| `[impl-infra]` | Build pipeline, container images, deployment config | `devops-implementer` |
| `[impl-design-system]` | Design-system extension (new token or component) | `frontend-implementer` |
| `[regression]` | Regression test/fix for a discovered bug in another issue | `qa-engineer` / implementer |
| `[docs]` | Repo-level docs (this file, READMEs) | `docs-writer` |
| `[chore]` | Dependency bumps, version pins, formatting | any implementer |

### 4.3 PR sizing

Target under 300 net lines of code per PR. UI work tends to be diff-heavy because of JSX; the budget is on code paths, not on JSX nodes. If you cross 300 lines of *logic*, justify it or split.

### 4.4 Branch model

`main` is protected; no direct pushes. Branches: `<agent-name>/<issue-key>-<slug>`, where the issue-key is the PaperClip identifier (e.g. `frontend-implementer/ORAA-178-chat-message-list-virtualisation`).

### 4.5 Commits

```
[ORAA-67] [agent:frontend-implementer] Short imperative description

Longer body if needed.
```

**One commit per concern** — never bundle unrelated changes into a single commit. The agent prefix is mandatory; see §5 below. **Forbidden in every commit message:** `Co-Authored-By` (any variant), "Generated with"/"Generated by", `claude.ai`, `paperclip.ing`, any Anthropic attribution, and the robot emoji. These are enforced by `.githooks/commit-msg` wired in via `core.hooksPath`.

### 4.6 Spikes are explicit

Prototype work that does not follow TDD is a **spike**, marked `[spike]` on the PaperClip issue and the PR. Spikes do not merge to `main`.

---

## 5. Agent identity, assignment, and workspace discipline (operational)

The canonical convention lives in the **ORAA-4 Operating Contract**. The operational summary for this repo:

### 5.1 Identity is issue assignment

Your agent identity in any unit of work is the **assignee of the PaperClip issue** you are acting on — there is no Jira custom field. You act as the persona to whom the issue is assigned. When you hand work off, you reassign the issue (see §5.3).

### 5.2 The `needs-human` attention flag

PaperClip issues carry a **needs-human attention flag**. Set it when a decision requires the human; clear it once the human has answered. It is the queryable signal the CTO and Reza use to find escalations; do not substitute an ad-hoc label or comment.

### 5.3 Board operations (PaperClip)

| Operation | How it works on the board |
| --- | --- |
| Find my work | The board shows the issues assigned to you; pick the highest-priority in-progress one. |
| Claim | Take an unassigned ready issue whose role matches, assign it to yourself, move it to in-progress, and post a claim comment. |
| Handoff | **Reassign** the issue to the next owner, set the next state, and post a handoff comment that states the acceptance criteria the next owner must meet. |
| Escalate to human | Reassign to the CTO/Reza, **set the issue's needs-human flag**, and post a structured escalation comment with the specific question. All three together. |
| Complete | Per the run-completion contract (§0): never end a run idle — reassign to a named next owner, create an assigned child issue, or escalate with a specific question. |
| Review request | Reassign the issue to a non-implementer reviewer, move it to review, and post a review-request comment. |

### 5.4 Comment and message prefix

Every PaperClip comment, GitHub commit message, GitHub PR description, and GitHub PR review comment you write while acting as agent `NAME` begins with:

```
[agent:NAME]
```

Comments that carry an action state the action and its target plainly (e.g. "handoff to `frontend-implementer`: <acceptance criteria>", "escalation: <question>", "review-request to CTO").

### 5.5 The mandatory local pre-push gate

Per ORAA-4 §5, before **any** `git push`, run — locally — the cheap checks CI's `quality` job runs, and push only if they are clean. For this frontend repo, those are the lint, type-check, and format-check scripts defined in `package.json` (e.g. the `lint`, `typecheck`, and `format:check` scripts). A push that fails these is **your** responsibility to fix before re-pushing; it does **not** become a separate `[fix]` issue.

### 5.6 Shared-checkout workspace discipline

Per ORAA-4 §12, per-run git worktrees are currently OFF, so every agent that writes this repo shares one checkout. Therefore:

- Writer runs operate at `maxConcurrentRuns=1`; the CTO must not route two concurrent write-tasks at this repo.
- Every writer run **starts clean** — check out the intended base before working — and **ends by committing and pushing all its changes**. Never leave uncommitted changes in the shared checkout.
- Use issue blocking to serialise same-repo work.

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
├── .githooks/
│   └── commit-msg                  # enforces commit policy (wired via core.hooksPath)
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                  # quality (lint, type-check, format), unit/integration, build
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

Code in `packages/` is consumed by `apps/` and by other packages. Adding a new package requires `solution-architect` approval (via the coordinator).

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

If the canonical knowledge base contradicts this list, the knowledge base wins. If you discover the stack is undefined for a question that matters, escalate to `solution-architect` (via the coordinator) rather than picking arbitrarily.

Note from the legacy reference: the old frontend is **Bun + React 18 + Vite**. That fact is informational, not prescriptive — the target stack is whatever Frontend Stack Reference specifies, which may or may not retain Bun.

---

## 8. Gates

Frontend currently runs an **abbreviated gate sequence** because test and review agents are deferred (see §1). FE issues skip the two test columns:

| From | To | Owner | What's verified |
| --- | --- | --- | --- |
| Backlog | Ready | `product-planner` + `solution-architect` + `security-architect` — **all in the coordinator session** | Brief testable; architecture refs present; threat tags set; lift-tag assigned; `goalId`/`projectId` linked |
| Ready | Implementation | `frontend-implementer` (this session) | Pickup of the assigned issue |
| Implementation | Code Review | `frontend-implementer` (this session) | `[impl]` PR with green CI: lint, type-check, api-client boundary rule, axe-core AA |
| Code Review | Done | **CTO** (craft review) | Craft, accessibility, gateway-only boundary, no-token-in-storage — all confirmed; CTO merges the `[impl]` PR |

The CI gate at Implementation → Code Review is the machine floor that replaces the absent review agents. A PR cannot reach CTO review with failing lint, type errors, an api-client boundary violation, or axe-core AA violations. The CTO is the merging reviewer; the PR author is never the sole merger, and there is no self-merge.

Reference: ORAA-4 Operating Contract §2 and the [Definition of Done](https://oraclous.atlassian.net/wiki/spaces/OP/pages/66010) (read-only mirror). The Backlog → Ready gate happens entirely in the coordinator session. Infra (`[impl-infra]`) and docs (`[docs]`) PRs against this repo are opened by `devops-implementer` and `docs-writer` **from the coordinator session**, not here.

When FE testing is reintroduced at R-Frontend Phase B, this table returns to the full seven-state sequence.

---

## 9. Done means done

An issue is `done` only when **all** of the following hold:

1. CI is green on the PR: the `quality` job (lint, type-check, format), unit + integration tests, security checks where applicable, and the a11y (axe-core AA) checks.
2. The PR has been **reviewed by a non-implementer** (the CTO for FE craft) — explicit sign-off, never a self-review.
3. The PR is **merged** by the CTO. "PR opened" is not done; an open or approved-but-unmerged PR is not done.
4. All gates have been transitioned through in order; no skips.
5. Coverage on new code is adequate; no new flaky tests; no a11y regressions in axe-core.
6. Bundle-size impact (if any) is documented and within budget.
7. If a user-visible behaviour changed: `docs-writer` has updated the operator-facing docs or has an open assigned issue for it.
8. The run ended per the run-completion contract (§0) — the issue is reassigned, a child issue exists, or an escalation is open. No idle "done."

The CTO maintains a merge digest of feature merges for Reza's async spot-audit; Reza merges only at release level.

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
- Merge a PR without explicit non-implementer sign-off, while the issue's needs-human flag is set, or as the PR's own author (no self-merge).
- `git push` without first running the local pre-push gate (§5.5) clean.
- Leave uncommitted changes in the shared checkout, or run two concurrent write-tasks against this repo (§5.6).
- Bundle unrelated changes into one commit, or add a `Co-Authored-By` / "Generated with" / attribution trailer (§4.5).
- Add or modify ADRs directly — propose to `solution-architect`.
- Edit the canonical knowledge base or its Confluence mirror directly — propose to `solution-architect` / `docs-writer`.
- Treat a flaky test as "noise" — flakiness is a bug.
- Read or write the `legacy-reference/` directory's git state — it is a read-only worktree.
- Default to a greenfield rewrite when the story carries a `Lift`, `Reshape`, or `Extract` tag — honour the tag and start from the named legacy source (§11).
- Define a gateway request/response shape locally — open a `Contract` issue and stop (§11.4).

---

## 11. Legacy reference and the lift-vs-rewrite default

The previous Oraclous frontend codebase is available **read-only** at:

```
/Users/reza/workspace/OraclousAI/legacy-reference/old-frontend/
```

It is a **git worktree pinned to the `develop` branch** of the previous frontend repository. `develop` is the most current branch of that codebase.

### 11.1 This is a migration, not a rewrite

The previous frontend is a working application (Bun + React 18 + Vite). The default for frontend work is **clone-and-refactor** — the new repo is seeded from the legacy frontend's contents and refactored in place to the target stack, design system, and gateway-only API rule. **Greenfield is the exception, not the default.**

> The legacy codebase is always at minimum the **behavioural specification** — even when its code is not reusable. New code passes when it does what the legacy did, plus the architectural invariants. "Start from scratch" must be justified, not assumed.

### 11.2 The lift-vs-rewrite rubric

You do not decide lift-vs-rewrite yourself per file. The verdict is decided once per deliverable in the release page's **Migration source map** (see [09. Releases](https://oraclous.atlassian.net/wiki/spaces/OP/pages/164160) Section 7, read-only mirror) and arrives in your issue brief as a **lift-tag**: `Lift`, `Reshape`, `Extract`, or `Greenfield`, with the specific legacy source path named. Honour the tag:

- **Lift** — start from the named legacy component/module, light refactor only.
- **Reshape** — start from the named legacy logic, refit it to the target stack, design system, and gateway-only API rule, keep the behaviour.
- **Extract** — lift a piece out of a larger legacy area into its target package/app.
- **Greenfield** — no usable precursor; write fresh against the Frontend Stack Reference and Design System.

If an issue brief lacks a lift-tag for UI that you believe has a legacy precursor, that is a planning gap — flag it to `product-planner` (via the coordinator) rather than silently choosing greenfield.

### 11.3 Rules for the legacy reference

- Reference material for behaviour to preserve, read in light of the lift-tag.
- When in doubt: the canonical knowledge base wins, then this `CLAUDE.md`, then legacy as the behavioural reference.
- Specifically watch out for, when reshaping legacy code: API call patterns (the legacy frontend likely talks to services other than the gateway — the new frontend only talks to `application-gateway-service`), token storage (the legacy may persist tokens to `localStorage` — the new frontend does not), and ad-hoc styling (the new frontend uses the design system exclusively). These are exactly the things a Reshape tag requires you to fix while keeping behaviour.
- Never write to `legacy-reference/`. It is a read-only worktree by convention.
- If the worktree is on a branch other than `develop`, surface to the CTO and stop — do not switch branches yourself.

### 11.4 Cross-repo shapes are not yours to define

If you need a data shape or API response that crosses the repo boundary (any shape the gateway returns or accepts), **you do not define it locally**. You open a `Contract` PaperClip issue assigned to `solution-architect` and stop, per the [Cross-cutting agreement protocol](https://oraclous.atlassian.net/wiki/spaces/OP/pages/1245185) (read-only mirror). The shape is decided by `solution-architect`, recorded canonically (the [Interface Contracts](https://oraclous.atlassian.net/wiki/spaces/OP/pages/1277953) page until R6, the gateway's OpenAPI spec after), and the `api-client` derives from it. Inventing a gateway response shape locally is a process violation of the same class as editing tests to make them pass.

---

## 12. Working with the knowledge base

`oraclous-knowledge` is canonical; Confluence is a read-only mirror reached via the URLs in §2. When you discover a mirror page (or the canonical knowledge base) is stale, open a `docs-writer` issue; do not edit architecture, ADR, or design-system pages directly.

---

## 13. Working with the board (PaperClip)

PaperClip is the master board. Work hierarchy is **Goals (releases) → Projects (epics) → Issues**. There is no Jira board, no sprints. Agents wake on assignment via heartbeats; you act on the issues assigned to you.

- **Find your work:** the board surfaces the issues assigned to you; the in-progress one is yours to continue.
- **Linkage:** every issue must have its `goalId` and `projectId` set before work begins (ORAA-4 §7).
- **needs-human:** set the issue's needs-human flag to request the human; clear it once answered.
- **Handoff / escalation / completion:** follow §5.3 — every run ends by reassigning, filing a child, or escalating; never idle.

---

## 14. Working with this file

Owned by `docs-writer`. Material changes go through a `[docs]` PR with `docs-writer` as author and the CTO as reviewer/merger. Cosmetic fixes can be batched into a periodic `[chore]` PR.

When you find a gap in this file, open a `docs-writer` issue. Do not silently add to it; this file is short on purpose.

---

## 15. Resuming after a context reset

1. Read this file.
2. Read the **ORAA-4 Operating Contract** (PaperClip `operating-contract`) — the canonical governance.
3. Read your own skill page from the [Agent Skills Catalogue](https://oraclous.atlassian.net/wiki/spaces/OP/pages/753852) (read-only mirror).
4. Look at the board: the in-progress issue assigned to you is yours.
5. Read that issue's comments; the last `[agent:NAME]` comment with a stated action tells you where you are.
6. Read the linked `[impl]` PR (if at Implementation/Code Review) or the brief (if just claimed).
7. Continue.

If the trail is broken or contradictory, escalate to the human: reassign the issue to the CTO/Reza, set its needs-human flag, and post a specific escalation question.
