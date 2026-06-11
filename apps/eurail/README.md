# apps/eurail — Eurail × Oraclous AI Adoption surface

The customer-facing surface for the **Eurail × Oraclous AI-adoption analysis**, served at
`oraclous.com/eurail`. Two surfaces over one evidence corpus:

- **`/` — the dashboard**: a browse-it-yourself report in 11 zones (orientation, executive
  snapshot, the four domain lenses, the 12 findings, the strategy frame, partnership & three
  asks, document library, evidence explorer, conflict log, methodology, chatbot entry). Every
  factual claim drills down to its evidence record.
- **`/chat` — the AI onboarder**: a streaming chat that interviews the reader and answers
  questions about the analysis. See [The onboarder & dev bridge](#the-onboarder--dev-chat-bridge).

The analysis itself (the source corpus) comes from the private repo `Jahankohan/EURail`.

---

## Stack

| | |
|---|---|
| Framework | **Next.js 14** (App Router) |
| Base path | **`/eurail`** (`next.config.mjs` → `basePath`) — so it lives at `oraclous.com/eurail` |
| Language | TypeScript (strict) |
| Styling | `@oraclous/design-system` CSS tokens (`var(--…)`) + inline styles — **no Tailwind** |
| Data | static JSON corpus in `src/corpus/` — **no backend, no API calls** (except the dev chat bridge) |
| Node | **≥ 22.14** (repo root `.nvmrc` pins `22.14.0`) |
| Package manager | **pnpm 11.5.0** (via corepack) — this is a member of the `oraclous-frontend` pnpm workspace |

> Note: the repo `oraclous-frontend` is otherwise a **Vite** monorepo. `apps/eurail` is the one
> app on **Next.js**, chosen so the SSR API route's `console.log` lands in the dev-server stdout
> (used by the dev chat bridge, below). See `DECISIONS.md` D-001 and D-008.

---

## Quick start (for a teammate)

From the **monorepo root** (`oraclous-frontend/`):

```bash
# 1. Node + pnpm (one-time)
nvm use                 # picks up .nvmrc (22.14.0); `nvm install 22.14.0` if missing
corepack enable         # provides pnpm 11.5.0 (the repo pins it)

# 2. Install the workspace
pnpm install

# 3. Run the eurail app
pnpm --filter @oraclous/eurail dev      # → starts Next on the default port

# …or, to pin the port the chat bridge expects:
cd apps/eurail && pnpm next dev -p 5190
```

Then open **http://localhost:5190/eurail** (dashboard) and **/eurail/chat** (onboarder).

The dashboard works fully standalone — no env vars, no backend, no services. (The chat needs the
bridge below.)

### Other scripts

```bash
pnpm --filter @oraclous/eurail typecheck         # tsc --noEmit
pnpm --filter @oraclous/eurail corpus:validate   # provenance gate (see Corpus layer)
pnpm --filter @oraclous/eurail build             # production build
# UI/a11y checks (drive system Chrome via Playwright — the chrome-devtools MCP can't attach
# while another Chrome is open):
node scripts/verify-ui.mjs http://localhost:5190/eurail/      # axe WCAG-AA + interaction probes
node scripts/screenshot-matrix.mjs http://localhost:5190/eurail/ /tmp/eurail-shots   # 3-device shots
```

---

## Project structure

```
apps/eurail/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # the shared shell (sticky header + report column + provenance footer)
│   ├── page.tsx              # '/'      → DashboardPage   ('use client')
│   ├── chat/page.tsx         # '/chat'  → ChatPage        ('use client')
│   ├── not-found.tsx
│   └── api/chat/route.ts     # SSR chat bridge endpoint (dev only — see below)
├── src/
│   ├── corpus/               # THE data layer — typed JSON + index + raw evidence ledger
│   ├── components/
│   │   ├── primitives/       # Zone, ConfidenceBadge, DomainTag, EvidencePopover, Icon
│   │   ├── shell/            # BrandHeader (next/link + usePathname)
│   │   └── zones/            # the 11 dashboard zones
│   ├── pages/                # DashboardPage, ChatPage (composed by the app/ routes)
│   ├── chat/                 # journey.ts + BeatView.tsx (the older deterministic onboarder — UNROUTED)
│   ├── lib/useCorpus.ts      # typed accessor hook over src/corpus
│   └── styles.css            # app-level chrome (skip-link, cta buttons) — tokens only
├── scripts/                  # validate-provenance / verify-ui / screenshot-matrix
├── next.config.mjs           # basePath '/eurail' + webpack extensionAlias (.js → .ts/.tsx)
├── DECISIONS.md              # append-only architectural decision log (D-001 … D-008)
└── tasks/ + .claude/         # the build pipeline (see How the build is driven)
```

> **`.js` import specifiers** point at `.ts`/`.tsx` files (the console convention). Next resolves
> them via the `resolve.extensionAlias` in `next.config.mjs` — don't "fix" the extensions.

---

## Corpus layer (`src/corpus/`)

The single source of factual content. Both surfaces render from it; nothing is hardcoded.

- **Raw ledger** (`raw/`): `evidence.json` (583 records), `conflicts.json` (24), `deliverables.json`,
  `ontology.json`. Each evidence record carries a confidence label (DIRECT/INFERRED/ASSUMPTION ×
  HIGH/MEDIUM/LOW) and a source.
- **Curated narrative**: `findings.json` (12), `domains.json` (4 + the module→domain map),
  `ladder.json` (5 layers), `opportunities.json` (8), `phasing.json` (4), `signals.json` (6),
  `engagement.json` (3 modes + 4 trust primitives + 3 asks), `beats.json` (15), `documents.json`.
- **`index.ts`** exposes typed accessors (`findings`, `evidenceById`, `findingsByDomain`,
  `resolveEvidence`, `conflictsForEvidence`, `corpusStats`, …); `types.ts` has the types.

**Provenance is a hard gate** (DECISIONS D-003). Every curated claim links to real `evidence_ids`:

```bash
pnpm --filter @oraclous/eurail corpus:validate
# checks every evidence id resolves + every count is exact (12/4/5/8/4/6/3/15). Non-zero exit = fail.
```

---

## The onboarder & dev chat bridge

`/chat` is a streaming chat. **In dev it is "fully AI" via a human-in-the-loop bridge where a
Claude Code operator (the maintainer) is the model** — there is no LLM API key and no local model
wired (deliberately, this phase). Here is exactly how it works:

1. The browser POSTs the question to **`app/api/chat/route.ts`** (`/eurail/api/chat`).
2. The route **logs a flagged line to the dev-server stdout** and writes files under `/tmp/eurail-chat/`:
   - console: `[eurail-chat] Q: <id> :: <text>`
   - `inbox/<id>.json`, and appends `questions.log`
3. The Claude operator **watches `questions.log`** (a `tail -F` monitor), reads the question, and
   **writes the answer** to `outbox/<id>.md`, ending it with `%%END%%`. Optional quick-reply
   buttons: end with `%%CHIPS: a | b | c%%`.
4. The route **streams `outbox/<id>.md` back to the browser as it grows** → real token-by-token
   render. It polls ~3 min for an answer, then closes.

**Scope guard:** the operator answers only questions about the Eurail × Oraclous analysis; anything
out of scope gets an honest "that's outside this analysis" reply — never a fabricated answer.

### What a teammate sees

- **The dashboard is fully self-contained** — runs with zero setup.
- **The chat will post questions but won't get answers unless a Claude operator is watching the
  console** (or someone hand-writes `outbox/<id>.md`). It's a dev test harness, not a shipped feature.
  You can hand-answer it yourself to test the UI:
  ```bash
  # after asking something in the UI, grab the id from the console / questions.log, then:
  printf 'your answer here %%END%%' > /tmp/eurail-chat/outbox/<id>.md
  ```
- **To make it a real autonomous AI:** point the route at an LLM — either the **Application
  Gateway** (the canonical Oraclous path, for production) or a **local model via Ollama** (free,
  offline; needs adequate RAM). Swap the outbox-polling `ReadableStream` for the model's SSE stream.

---

## How the build is driven (`.claude/` + `tasks/`)

This app was built (and is extended) by a lean, file-defined agent pipeline — durable in the repo:

- **`.claude/agents/`** — four agents: `task-manager` (sequences work), `ui-ux` (design authority,
  uses `/ui-ux-pro-max` + `oraclous-knowledge/frontend`, self-rates), `developer` (implements),
  `auditor` (provenance → quality/a11y → edge-case gates). Plus `ux-critic` (persona × device pass).
- **`tasks/`** — one markdown file per work unit (`T-NNN-*.md`), with goal / inputs / steps /
  acceptance criteria. The source of truth for what's built and what's left.
- **`.claude/LEARNINGS.md`** — the self-improvement ledger; every agent reads it first, the auditor
  appends lessons after each task.
- **`.claude/design-log.md`** — the ui-ux agent's rated design decisions (`DEC-NNN`).
- **`DECISIONS.md`** — append-only architectural decisions (`D-NNN`). Read it to understand *why*.

---

## Known gaps / TODO

- The **chat page hasn't had the strict UX-critic / axe-AA pass** the dashboard got.
- **Re-run axe-AA on the Next build** (only render + page-errors were spot-checked post-migration).
- **Hosting**: the `oraclous.com/eurail` edge/proxy routing isn't wired — localhost dev only.
- The old deterministic onboarder (`src/chat/journey.ts`, `BeatView.tsx`) is **unrouted dead code**.
- **Nothing is committed yet** — work is on branch `feat/eurail-dashboard`.
