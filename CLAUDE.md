# CLAUDE.md — oraclous-frontend

This file is the working contract for any AI agent (Claude Code or otherwise) working in this repository. Read it in full at the start of every session.

This repo is **`OraclousAI/oraclous-frontend`** — the TypeScript/React codebase for the Oraclous Platform's customer-facing surfaces: the **console** (built), and, planned, a developer portal and embeddable widgets, plus shared frontend packages. The backend (`oraclous-backend`) is a separate repository; the two share no code — only the Application Gateway API contract.

---

## 0. How work is tracked

Work is tracked in **GitHub Issues** and shipped through **GitHub Pull Requests**. There is no external board.

- **Issues** describe the change and its acceptance criteria. Pick up the issue assigned to you (GitHub assignee) or one labelled ready; assignment and triage are done with GitHub assignees and labels. Ad-hoc work directed by a maintainer is fine — capture anything non-trivial as an issue so it has a home.
- **Branches + PRs** are the unit of delivery. Branch off `main`, open a PR, get it reviewed, merge. `main` is protected by a **GitHub ruleset** (no admin bypass): the CI gate jobs + a **non-author review** + an up-to-date base must pass before merge. **No self-merge.**
- **PR-BUNDLING LAW (non-negotiable).** **Never ship a one-commit-per-PR stream.** Bundle related concerns into ONE PR with **one commit per concern** (multiple commits per PR) — CI + non-author review run once per PR, so a separate PR per commit multiplies the cost. An issue with N sub-tasks ships as **one PR with N commits, never N PRs.** Default to fewer, bigger PRs.
- **Reza Jahankohan** is the maintainer — the reviewer and merger, and the final human sign-off. Escalate to him when a decision is ambiguous, blocked, or out of policy.
- **Enforced locally** via `core.hooksPath=.githooks`:
  - `pre-push` runs `lint` + `typecheck` + `format:check`; a failing push is blocked locally (§3).
  - `commit-msg` rejects attribution trailers (§3.2).

---

## 1. Frontend invariants

These are non-negotiable. A PR that violates any of them is rejected at review, and most are enforced by CI gates (§4). Do not weaken the gates.

### 1.1 The Application Gateway is the only backend

The frontend talks to **`application-gateway-service`** and nothing else — never directly to substrate, the capability registry, the harness runtime, or the execution engine. If the gateway does not expose an endpoint the frontend needs, the answer is to add it to the gateway, not to bypass it. *(CI: Gate 1.)*

### 1.2 Use the typed API client

The frontend consumes the gateway through the typed client in `packages/api-client`, curated against the gateway's OpenAPI spec. Hand-rolled `fetch`/`axios`/`ky` calls are forbidden in feature code. If the client is missing an endpoint, extend the client (and the gateway, in coordination) — do not inline a fetch. *(CI: Gate 1.)*

### 1.3 WCAG AA is the floor, not a goal

Every UI change ships at WCAG AA baseline:

- Semantic HTML (buttons are `<button>`, headings are `<h1>`…`<h6>`, form controls have labels).
- Keyboard reachable and operable for every interactive element.
- Visible focus indicators; predictable focus order; focus traps where required (modals, sheets, the mobile nav drawer).
- Colour contrast ≥ 4.5:1 for body text, 3:1 for large text and UI components.
- Screen-reader names and roles on every interactive element.
- `axe-core` is clean on the AA ruleset for every PR. *(CI: Gate 3.)*

### 1.4 Design system is the contract

Every visual element either uses an existing design-system token/component, or extends the system in a **dedicated** PR (e.g. `feat(design-system): …`). Inventing local colours, spacings, typography, motion, or shadows in a feature PR is rejected.

### 1.5 Access tokens never touch persistent storage

The integration key, session/access token, and agent credential never go into `localStorage`, `sessionStorage`, or unconstrained cookies — they live in memory only. *(CI: Gate 2.)*

One deliberate, maintainer-approved exception: the **rotating refresh token** may persist, and only via the session-vault primitive (`apps/console/src/lib/session-vault.ts` — IndexedDB, AES-GCM under a non-extractable key). *(CI: Gate 2 also rejects IndexedDB usage outside the vault; what it cannot check is what you put in the vault — never anything but the refresh token.)* Honest threat model: the non-extractable key prevents on-origin exfiltration and casual storage scraping, but at-rest security equals the browser profile's — a filesystem attacker gets key and ciphertext together. The vault holds the single live copy: every refresh goes through the cross-tab `lockedRefresh` (Web Locks) path in `lib/session.ts`, which rotates the stored token before releasing the lock and discards itself if the session changed mid-flight; logout and a rejected refresh clear it, and logout is broadcast to other tabs. Don't hand-roll any other credential persistence — extend the vault. The strictly-better long-term mechanism is an HttpOnly refresh cookie minted at the gateway (tracked in the gap log as an `[INT]` follow-up); when that lands, this exception goes away.

### 1.6 Embeddable widgets respect the host

Widgets render in customer host pages. They never:

- Read or modify the host page's DOM outside their own root.
- Reach into `window.parent`/`window.top` beyond `postMessage` to a configured target origin.
- Inject styles into the host's stylesheet scope (use Shadow DOM or scoped CSS).
- Call anything other than the configured gateway endpoint.

### 1.7 No `dangerouslySetInnerHTML` on user-supplied content

Default to rendering as text. If user content must render as rich content, route it through a sanitiser with a strict allowlist. Any new use of `dangerouslySetInnerHTML` needs a security-conscious review on the PR. *(CI: Gate 5.)*

### 1.8 Bundle size is a budget

Each JS entrypoint must stay ≤ **500 KB gzipped** *(CI: Gate 4)*. Justify every dependency addition in the PR description; a PR that grows a bundle materially gets explicit review for whether the addition is worth it.

---

## 2. Source of truth (architecture & conventions)

**`oraclous-knowledge`** is the canonical knowledge base (architecture, ADRs, contracts, conventions); Confluence is a read-only mirror of it. This file is the operational contract for *this repo*; when it disagrees with the knowledge base on architecture, the knowledge base wins — open a docs PR here to reconcile.

Pages consulted most often (Confluence read-only mirror):

| Need | Page |
| --- | --- |
| Architecture overview | [Platform Architecture v1.1](https://oraclous.atlassian.net/wiki/spaces/OP/pages/753707) |
| Layer model (where the frontend sits) | [Section 3 — Layered Architecture](https://oraclous.atlassian.net/wiki/spaces/OP/pages/65967) |
| Portability and embed model | [Section 7 — Portability Story](https://oraclous.atlassian.net/wiki/spaces/OP/pages/753728) |
| Application Gateway API | [application-gateway-service](https://oraclous.atlassian.net/wiki/spaces/OP/pages/131124) |
| Security threats | [Section 6.5 — Security Threats](https://oraclous.atlassian.net/wiki/spaces/OP/pages/851990) + [Threat Catalogue](https://oraclous.atlassian.net/wiki/spaces/OP/pages/983129) |
| Frontend stack | [Frontend Stack Reference](https://oraclous.atlassian.net/wiki/spaces/OP/pages/852051) |
| Design system | [Design System](https://oraclous.atlassian.net/wiki/spaces/OP/pages/852071) |
| Component conventions | [Component Conventions](https://oraclous.atlassian.net/wiki/spaces/OP/pages/557154) |
| State and data | [State and Data Patterns](https://oraclous.atlassian.net/wiki/spaces/OP/pages/983081) |
| ADRs | [02. ADRs](https://oraclous.atlassian.net/wiki/spaces/OP/pages/589826) |
| Code style | [Code Style Guide](https://oraclous.atlassian.net/wiki/spaces/OP/pages/426037) |

---

## 3. Working agreement

### 3.1 Branches

`main` is protected; no direct pushes. Branch per change off `main`, named `<type>/<short-slug>` — e.g. `feat/agent-flow-toasts`, `fix/mobile-drawer-a11y`, `docs/claude-md`. Optionally prefix the issue number (`123-agent-flow-toasts`).

### 3.2 Commits — Conventional Commits

```
<type>(<optional scope>): <imperative summary>

Optional body explaining the why.
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`, `chore`.

**One commit per concern.** A _concern_ is a self-standing unit of change — a feature slice, a separable refactor/extraction, or a shared `api-client`/data-layer extension. The rule cuts two ways:

- **Anti-bundling (the ceiling):** never put **unrelated** concerns in one commit. This is _not_ a floor that forces multiple commits — a genuinely single-concern change correctly has **one** commit. Don't manufacture commits to look granular.
- **Split separable layers (within a PR):** when one increment legitimately spans more than one concern, give **each** its own commit, in dependency order. The common case is splitting the data layer from the UI that consumes it:
  1. `feat(api-client): <endpoint/type>` — the data-layer extension
  2. `feat(console): <UI slice>` — the surface that uses it

  A refactor/extraction the increment depends on is likewise its own commit, before the feature. (A design-system change is bigger than a commit — it is a **dedicated PR**, §1.4.) A single-concern increment with no separable layer stays one commit.

Note: `main` shows **one commit per PR regardless**, because PRs are **squash-merged** — so per-concern commits buy *reviewability of the PR*, not `main` history. They do **not** replace the small single-concern increments of §3.6/§3.7: still one focused PR per increment, just committed concern-by-concern inside it.

**Forbidden in every commit message** (and PR body/comments), enforced by `.githooks/commit-msg`: `Co-Authored-By` (any variant), "Generated with"/"Generated by", `claude.ai`, any Anthropic attribution, and the robot emoji (🤖).

### 3.3 The mandatory local pre-push gate

Before **any** `git push`, the cheap checks CI runs must pass locally: `lint`, `typecheck`, `format:check` (the `pre-push` hook runs these). A push that fails them is yours to fix before re-pushing — it does not become a separate ticket.

### 3.4 Pull requests

- **Title** follows the Conventional Commits summary; **body** states what changed, why, and how it was verified (gates run, bundle impact, a11y notes).
- **Open ready:** before opening for review the PR is lint/type/format clean, CI-green, and rebased onto current `main`.
- **Sizing:** target under ~300 net lines of *logic* per PR (JSX nodes don't count against this). If you cross it, justify or split.
- **Review:** a **non-author** reviews and approves; the maintainer (or CTO) merges. No self-merge. For **product-surface** PRs the two agent reviewers are **`experience-architect`** (the product/user lens — does it deliver the journey, match the design, respect the six non-negotiables) and the **CTO** (craft), both approving via the **`johnkennII`** GitHub identity so the approval is a genuine non-author one. Those two reviews are the whole agent check; the automated CI gates (§4) run on their own.

### 3.5 Tests

Frontend has **no unit/component test suite yet** — it is deferred. The invariants are enforced by the CI gates (§4), and a11y is covered by `axe-core` specs in `tests/a11y/`. When the test suite is introduced (Vitest + React Testing Library + Playwright), update this file. Prototype/throwaway work is a **spike** and does not merge to `main`.

### 3.6 Incremental, testable-on-the-app delivery

Product-surface work ships in **small, vertical increments that each run on the live app** — never a big-bang journey in one PR. `experience-architect` slices each journey into the smallest increments that each deliver something a person can **open in the running console and actually use** (against the live gateway), and opens one GitHub issue per increment. Each increment:

- Is one focused PR that builds + runs and leaves the app in a working, testable state (no half-wired screens behind a broken nav).
- States in its PR body **exactly how to test it on the app** (the route to open, the steps to exercise, what you should see) so the maintainer can verify it directly.
- Is reviewed against that — `experience-architect` validates it by driving the running surface, not just reading the diff (§3.4).

Prefer five small increments you can each test over one large PR you can only test at the end. The journey is "done" when its increments add up to the whole flow working end-to-end on the app.

### 3.7 Serial, turn-based delivery (the build ↔ review baton)

Product-surface work is **strictly serial — one increment at a time.** You (the FE agent) and the reviewer (`experience-architect`, acting as the `johnkennII` identity) take turns; **GitHub signals are the baton, and whoever is not acting stays idle and waits for their signal.** Never work ahead.

**Your turn — build — begins on a signal:** an issue **assigned to you (`Jahankohan`) and labelled `ready`** (a new increment), **or** a **"changes requested"** review on your open PR (revise it). Otherwise it is **not** your turn — stay idle.

The protocol, exactly:
1. **One `ready` issue at a time — and you never choose the order.** The **`ready` issue *is* the order**: build the single increment assigned to you and labelled `ready`, and nothing else. Other open `product-surface` issues are *future* increments not yet your turn — **ignore them** until they're readied (do not pick one because it looks next). Do not start a second issue while a PR of yours is open or in review; there is never more than one increment in flight. For where this increment sits and what comes after it, read its **epic issue's ordered checklist** (linked in the issue body) and `oraclous-knowledge/product/roadmap.md` — but you build only what is `ready`.
2. **Build it, open the PR, then STOP.** Open one focused PR with the test-on-the-app steps in the body, request review from the reviewer, and **go idle.** Do **not** pick up the next issue — the next one will not be `ready` until this one merges.
3. **Wait for the baton.** Watch your open PR for the reviewer's signal:
   - **Changes requested** → it's your turn again: address the feedback **on the same PR** (no new issue, no new PR), push, re-request review, then **go idle** again.
   - **Approved + merged** → your turn is over; the reviewer will ready the next increment when it's time. Do not anticipate it.
4. **Stay idle between turns.** When nothing is `ready` for you and no PR of yours has changes requested, you have no work — wait for a GitHub signal; do not invent work or pull a non-`ready` issue.

The reviewer's mirror of this: readies exactly one increment at a time, reviews your PR by driving the running app, posts improvements as a **"changes requested"** review (that is how you're notified), or approves via `johnkennII` and merges — and **immediately readies the next increment as part of that merge** (the maintainer tests merged increments live in parallel; that is **not** a gate on readying the next, so you never wait for a `ready` issue). While you build, the reviewer is idle; while the reviewer reviews, you are idle.

---

## 4. Gates & Definition of Done

CI (`.github/workflows/ci.yml`) is the machine floor. Every PR must pass:

- **Quality** — `lint` (ESLint), `typecheck` (`tsc --noEmit`), `format:check` (Prettier).
- **Gate 1 — api-client-boundary:** no bare `fetch`/`axios` outside `packages/api-client`.
- **Gate 2 — no-token-in-storage:** no direct `localStorage`/`sessionStorage` in feature code.
- **Gate 3 — axe-core AA:** WCAG AA scan (specs in `tests/a11y/`).
- **Gate 4 — bundle-budget:** ≤ 500 KB gzipped per JS entrypoint.
- **Gate 5 — no-dangerouslySetInnerHTML.**
- **Build** — `pnpm -r build` succeeds.

**Verify locally before pushing:** build the workspace libs first (the console imports their built `dist/`), then run the set:

```
pnpm -r build && pnpm -r typecheck && pnpm lint && pnpm format:check
```

A change is **done** only when: CI is green; a non-author has reviewed and approved (no self-review); the PR is **merged** (an open or approved-but-unmerged PR is not done); there are no a11y regressions and bundle impact is within budget/documented; and any user-visible behaviour change has docs updated (or a tracked follow-up issue).

---

## 5. Repository layout

pnpm workspaces (`packages/*`, `apps/*`, `tests/*`). Current shape:

```
oraclous-frontend/
├── CLAUDE.md                  # this file
├── package.json               # workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json · .prettierrc · eslint config · .nvmrc
├── .githooks/                 # pre-push (lint/type/format) + commit-msg (no attribution)
├── .github/workflows/         # ci.yml (quality + Gates 1–5 + build), e2e.yml, release.yml
├── packages/
│   ├── api-client/            # typed client for application-gateway-service — the ONLY path to the backend
│   ├── design-system/         # tokens (tokens.css/tokens.ts/wcag-aa.ts) + a component library
│   └── ui-utils/              # shared hooks, a11y helpers, formatters
├── apps/
│   └── console/               # the customer-facing console (inline styles + design-system tokens)
└── tests/
    └── a11y/                  # axe-core (Playwright) AA specs — Gate 3
```

Planned but not yet present: a developer **portal**, **widget** packages/host, and an **analytics** package. Add them under the established `apps/`/`packages/` shape.

- **`packages/` is shared** and consumed by `apps/` and other packages.
- **`apps/` is what ships**; cross-app coupling goes through `packages/`, never file imports between apps.
- **`packages/api-client` is the only path to the backend** — any HTTP client outside it is rejected (Gate 1).

> Build gotcha: build `@oraclous/api-client` + `@oraclous/design-system` (+ `ui-utils`) before running `pnpm --filter @oraclous/console dev` — the console imports their built `dist/`.

---

## 6. Stack

Confirm against the [Frontend Stack Reference](https://oraclous.atlassian.net/wiki/spaces/OP/pages/852051) if in doubt:

- **TypeScript** (strict; no `any` outside a typed boundary helper).
- **React 18+**, function components and hooks; no class components in new code.
- **react-router-dom** for routing.
- **TanStack Query (v5)** for server state.
- **Vite** as the build tool.
- **axe-core** (`@axe-core/playwright`) for accessibility checks.
- The **console uses inline styles + design-system CSS variables — no Tailwind**, and `.js`/`.jsx` import extensions. `packages/api-client` uses extensionless imports.

---

## 7. Legacy reference and the lift-vs-rewrite default

The previous Oraclous frontend is available **read-only** at `/Users/reza/workspace/OraclousAI/legacy-reference/old-frontend/` — a git worktree pinned to `develop` (the most current branch of the old codebase, Bun + React 18 + Vite).

- This is a **migration, not a rewrite.** The default is **clone-and-refactor**: start from the legacy behaviour and refit it to the target stack, the design system, and the gateway-only API rule. Greenfield is the exception and must be justified — the legacy app is at minimum the **behavioural specification**.
- **Product-surface work is journey-driven, not legacy-driven (overrides the default above for product surfaces).** For any FE **product surface** (pages, nav, routed surfaces — agents, tools, recipes, runs, connections, harness, billing flows, etc.) the design comes from the **journey+IA+UX spec** authored by `experience-architect` (`oraclous-knowledge/product/journeys/<journey>.md`), **not** the legacy app — the legacy IA is a different, older product's skeleton, only a behavioural reference here. `experience-architect` opens the GitHub issue with that design as the brief, you build it, and it reviews/validates the PR from the user's perspective (see §3.4). The clone-and-refactor default still governs *component-level* lifts (the design-system primitives) and non-product-surface work.
- The lift-vs-rewrite decision for a given piece of work is captured in its **GitHub issue** (Lift / Reshape / Extract / Greenfield, naming the legacy source). If an issue lacks that call for UI that plainly has a legacy precursor, flag it on the issue rather than silently choosing greenfield.
- When reshaping, fix these while preserving behaviour: API calls (legacy may talk to non-gateway services — the new app talks only to `application-gateway-service`), token storage (legacy may use `localStorage` — the new app does not), and ad-hoc styling (use the design system).
- **Never write to `legacy-reference/`**; it is read-only. If it is on a branch other than `develop`, surface it and stop — don't switch it yourself.

---

## 8. Cross-repo API shapes

Any data shape the gateway returns or accepts is a **cross-repo contract** — do **not** invent it locally. The shape is the gateway's OpenAPI spec; `packages/api-client` derives from it. If the gateway is missing a shape the frontend needs, raise it with the backend (an issue and a coordinated change), and have the client follow the agreed spec. Inventing a gateway response shape in the frontend is a process violation.

---

## 9. What never to do

- Hand-roll a `fetch`/`axios`/`ky` (or any HTTP call) outside `packages/api-client/`, or call any backend other than `application-gateway-service`.
- Invent a colour, spacing, typography, motion curve, or shadow outside the design system in a feature PR.
- Ship a PR with axe-core AA violations, or weaken any CI gate.
- Use `dangerouslySetInnerHTML` on user-supplied content without a sanitiser and a security review.
- Persist auth tokens or BYOM credentials to `localStorage`, `sessionStorage`, or unconstrained cookies.
- Read or write the host page's DOM from a widget outside the widget's own root.
- `git push` without first running the local pre-push gate clean.
- Bundle unrelated changes into one commit, or add a `Co-Authored-By` / "Generated with" / attribution trailer to any commit, PR, or comment.
- Merge a PR without a non-author approval, or merge your own PR.
- Default to a greenfield rewrite when the work has a legacy precursor (§7).
- Define a gateway request/response shape locally (§8).
- Write to the `legacy-reference/` worktree, or switch it off `develop`.

---

## 10. Working with this file

When you find a gap or staleness here, fix it in a `docs:` PR (or open an issue). Keep it short and accurate — it is the contract every session reads first.

**Resuming after a context reset:** read this file → look at the GitHub issue you're assigned (or the PR you're mid-flight on) → check CI status on that PR → continue. If the trail is broken or contradictory, ask Reza with a specific question.
