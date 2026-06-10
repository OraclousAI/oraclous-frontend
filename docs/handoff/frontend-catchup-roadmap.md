# Frontend catch-up roadmap — make the console the platform's end-to-end smoke

**Audience:** the frontend agent working in `oraclous-frontend`.
**Status:** active handoff. Authored by the coordinator session after the backend reached R7-SEC.
**Shape of the work:** the whole surface, **staged step-by-step** (waves 0→3), each wave ending in a real FE→BE golden-path smoke. Not one big push.

---

## 0. The one-paragraph why

The backend is **complete and real end-to-end** (R3.5 → R4 harness runtime → R5 execution engine → R6 gateway → R7-SEC security), every layer past the §22 "not-a-stub" bar, and **the gateway already proxies every surface you need.** The console is now the platform's real FE→BE→FE smoke: building it exercises the backend for real and surfaces any remaining gaps, which we triage by layer (see §5). Two things block a shippable end-to-end today: (1) the console **drifted off the design system** (page bodies use raw inline px instead of the tokens/components the repo already ships), and (2) the **R4/R5/R6 surfaces have no UI**. This roadmap fixes both, staged.

---

## 1. What you're building against (the backend is done)

- **One ingress.** The console talks **only** to the application gateway (already enforced by the api-client-boundary CI gate). Everything below is reached through the gateway base URL with a **bearer token**.
- **Auth model:** real login. The console signs up / logs in via `/v1/auth/*` (auth-service issues an HS256 JWT) → sends that JWT to the gateway → the gateway validates it (`GATEWAY_AUTH_MODE=jwt`) and forwards a trusted identity to downstream services (ADR-018). You do **not** deal with `X-Principal-*`/internal keys — that's gateway-internal. Just hold the bearer (the existing `packages/api-client` + token-store already do this).
- **Real posture is already configured** in `oraclous-backend/deploy/.env`: `GATEWAY_AUTH_MODE=jwt`, all downstream `*_AUTH_MODE=gateway`, `CAPABILITY_REGISTRY_BROKER_MODE=real` (real credential broker), a real `OPENROUTER_API_KEY` (live LLM for agent runs). Nothing is stubbed in the run path.

### Bring up the backend (clean stack)

From `oraclous-backend/`:

```bash
# fresh DBs (drops all volumes) — only when you want a clean slate:
COMPOSE_PROJECT_NAME=oraclous-backend docker compose -f deploy/docker-compose.yml down -v
# build + start the FULL stack (the app services live behind the `services` profile):
COMPOSE_PROJECT_NAME=oraclous-backend COMPOSE_PROFILES=services \
  docker compose -f deploy/docker-compose.yml up -d --build
```

- The gateway is published on **`http://localhost:8006`** (host) — point the console's gateway base URL there for local dev. Health: `GET http://localhost:8006/health`; aggregated upstreams: `GET http://localhost:8006/health/upstreams`.
- The harness-runtime (R4) and execution-engine (R5) are healthy and proxied (`/v1/harnesses`, `/v1/engine`) even though the aggregated-health list only enumerates the substrate+registry upstreams.
- Harmless noise: the `neo4j-role-setup` one-shot exits 1 on Neo4j **Community** (its `GRANT ROLE` is Enterprise-only). Nothing depends on it and KGS/KRS connect as the `neo4j` admin user in dev, so graph reads/writes work regardless. Ignore it.
- Verified clean slate as of this handoff: all migrations ran on a fresh DB and `organisations` count is 0 — you start from zero data.

---

## 2. The design contract — full restyle from the handoff (the user's explicit direction)

**Source of truth for every screen:** the design-handoff mockups in
`oraclous-frontend/Oraclous AI - Design System/design_handoff_oraclous_v1/04-redesigned-screens/`
(+ `01-design-tokens`, `03-brand-book`, `06-design-system-previews`, and `app.css` / `reshape.css` there for the exact styling). **Map each mockup to its console page and restyle to match** — this is a deliberate restyle, not just a token swap.

### Mockup → console page map

| Mockup                                           | Console page / route                                                                                | Wave     |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------- | -------- |
| `login.html`                                     | `LoginPage` (`/login`, `/signup`)                                                                   | 0        |
| `dashboard.html`                                 | `DashboardPage` (`/app`)                                                                            | 0        |
| `workspace.html`                                 | `WorkspacesPage` / `GraphDetailPage` (`/app/workspaces`, `/app/workspaces/:id`)                     | 0        |
| `explorer.html`, `explorer-v2.html`              | `ExplorerPage` (`/app/workspaces/:id/explorer`)                                                     | 0        |
| `agents.html`                                    | `AgentsPage` (`/app/agents`)                                                                        | 0 then 1 |
| `agent-detail.html`, `agent-detail-stacked.html` | `AgentDetailPage` + the new **agent builder/run** views (`/app/agents/:id`)                         | 1        |
| `members.html`                                   | `MembersPage` (`/app/members`)                                                                      | 0        |
| `billing.html`                                   | `BillingPage` (`/app/billing`)                                                                      | 0        |
| `access.html`                                    | the **developer surfaces** — integration keys / published agents (new route, e.g. `/app/developer`) | 2        |
| `second-mind.html`                               | the **chat console** (replaces the `/app/my-space` placeholder)                                     | 3        |
| `landing.html`                                   | marketing app (already done — reference only)                                                       | —        |

### How to implement it (mechanism)

- Use the design-system **tokens** (`packages/design-system/src/tokens.css|ts`), the **semantic type-classes** (`.t-h1`/`.t-h3`/`.t-body`/`.t-dense`/`.t-caption`…), the `--sp-*` spacing and `--r-*` radius scales, and the **shadcn components** in `packages/design-system` (Card/Button/Badge/Dialog/…). Follow the proven pattern already in `apps/console/src/components/shell/shell.css`.
- **Kill the anti-pattern:** page bodies built as raw `CSSProperties` inline objects with hardcoded px (e.g. `apps/console/src/pages/DashboardPage.tsx` — `fontSize: 24`, `gap: 24`, `borderRadius: 12`). Replace with tokens + semantic classes + components. The shell already proves the pattern; the page bodies regressed off it.
- **Reference, don't copy:** `legacy-reference/old-frontend` for composition/feature richness (it's Tailwind+shadcn — take the _composition ideas_, not the Tailwind).

### The 7 non-negotiables (from the design-system rules)

1. Mint `#10D88A` = **live-signal only** (never decorative, never a CTA, never the brand mark).
2. The `>|` symbol never appears alone (locked with the ORACLOUS wordmark, or as the in-product live cursor).
3. **No emoji** anywhere — Lucide icons only (1.5px stroke, monochrome).
4. No banned marketing words (revolutionize, unleash, supercharge, AI-powered, seamless, leverage, robust, cutting-edge, empower, intuitive, ecosystem, journey…).
5. Cursor blink is `1.06s steps(1, end)` (discrete, not a fade).
6. Respect `prefers-reduced-motion` (`.is-blink`/`.is-pulse` already do).
7. Two-surface system only (ink ⇄ paper swap; mint unchanged). No third surface, no gradients/textures/hero photos.

### Keep the CI gates green (they already exist)

api-client boundary · no-token-in-storage · axe-core **WCAG AA** · bundle budget (≤500 KB gz) · no dangerous `innerHTML`.

---

## 3. The API contract sources (bind to real shapes — don't guess)

| Source                                 | Where                                                                                             | Use it for                                                                                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Postman collection** (authoritative) | `oraclous-backend/postman/oraclous.postman_collection.json` (+ `…_environment.json`, `README.md`) | Every route across the gateway + 7 services with **example request/response payloads** and token auto-capture. This is your primary reference. |
| **Live gateway OpenAPI**               | the gateway's `/v1/openapi.yaml` and `/docs` (served at runtime)                                  | The exact current shapes once the stack is up.                                                                                                 |
| **Proxied prefixes**                   | `oraclous-backend/.../application-gateway-service/.../domain/route_table.py`                      | Which prefix routes to which upstream.                                                                                                         |
| **OHM v1.0 spec**                      | `oraclous-knowledge` (OHM standalone spec)                                                        | The agent (harness) manifest shape for the builder (Wave 1).                                                                                   |
| **Service references**                 | `oraclous-knowledge/services-reference/*.md`                                                      | Per-service behaviour + the gateway/auth model.                                                                                                |

Everything is under the gateway base URL with the bearer; the existing `packages/api-client` is the only path (CI-enforced).

---

## 4. The staged roadmap

Each wave is a vertical slice that ends in a real FE→BE smoke. Order matters: the developer/chat waves build on an agent that the core loop produces.

### Wave 0 — Restyle foundation + existing pages

**Goal:** adopt the handoff as the page-styling spec and bring the _existing_ console up to it — the user's design fix, and the bar for every new page.

- Establish the page-level styling pattern (tokens + semantic classes + components, the `shell.css` way), extracting what you need from the handoff `app.css`/`reshape.css`.
- Restyle: `LoginPage`, `DashboardPage`, `WorkspacesPage`/`GraphDetailPage`, `ExplorerPage`, `AgentsPage`, `ToolsPage`, `RecipesPage`, `MembersPage`, `SettingsPage`, `BillingPage` to their mockups.
- **Smoke:** the existing flows (login → workspaces → ingest → explorer → single-tool run) look like the handoff; axe-core AA + bundle gates green.

### Wave 1 — Core product loop (R4 + R5) — the prerequisite for everything else

**Goal:** build, run, and inspect a _real_ agent.

- **Agent (OHM/harness) builder** — author an OHM manifest. Start **template/form-driven** against the OHM spec (a visual builder is a later refinement); `agent-detail.html` / `agent-detail-stacked.html` are the layouts.
- **Run it durably** via the engine: `POST /v1/engine/jobs` (submit the OHM) → poll `GET /v1/engine/jobs/{id}` to terminal. (Synchronous alternative for a first cut: `POST /v1/harnesses/execute`.) The run uses real registry tools + the knowledge graph under the live LLM, governed.
- **Results + provenance view** — show the run output and the per-step provenance the harness emits.
- **R5 jobs view** — list/status of jobs (schedules/task-board come later).
- **Smoke (the headline golden path):** login → connect a data source (credential) → ingest to a graph → build an agent → run it → see results + provenance — entirely FE→BE, nothing stubbed.

### Wave 2 — Developer / embed loop (R6) — `access.html`

**Goal:** take an agent to the outside world.

- **Published agents** — publish/unpublish/rotate-key (`/v1/agents`; the public invoke surface is `/{slug}/invoke`).
- **Integration keys** — mint/list/rotate/revoke + per-key CORS (`/v1/integration-keys`, `…/{id}/rotate`). Secrets are **display-once** — design for that.
- **Webhook subscriptions** — create/list/delete (`/v1/webhook-subscriptions`, `/v1/webhooks/{id}`); surface the per-provider signature scheme (generic/github/stripe/slack) and the display-once signing secret.
- **Smoke:** publish an agent → mint a key → call it externally through the gateway → receive a signed webhook.

### Wave 3 — Conversational + extensibility — `second-mind.html`

**Goal:** the chat console + tool extensibility.

- **Member chat console** — replace the `/app/my-space` placeholder. The `chat` client already exists in `packages/api-client` (conversations, streaming, message feedback; `/v1/chat` + `/threads`).
- **MCP import** — admin-gated `POST /api/v1/tools/import-mcp` → list the `pending_approval` tools → approve (`POST /api/v1/tools/{id}/approve`). Surface the supply-chain HITL gate (an imported tool isn't executable until an admin approves it).
- **Smoke:** chat with an agent over a graph; import an external MCP server's tools and approve one.

_(R7 "domain defaults" land later as pre-built content on these same surfaces — no FE rework; you'll just render more rows.)_

---

## 5. Gap-log protocol — the smoke is also the integration test

As you build each wave, log anything broken / missing / awkward with a **layer tag**:

- **FE** — a frontend bug/gap → you fix it.
- **BE** — a backend behaviour/shape is wrong or missing → it comes back to the **coordinator session** as backend work (it owns all `oraclous-backend` changes).
- **integration / contract** — a gateway/contract mismatch (the FE needs a shape the API doesn't give cleanly) → coordinator fixes the contract + you adjust the binding.

Keep a running list in `docs/handoff/gap-log.md` (one line each: `[FE|BE|INT] wave-N — surface — symptom — suspected cause`). The coordinator picks up the `BE`/`INT` items. This is how building the FE doubles as the platform's end-to-end integration test.

---

## 6. What is explicitly out of scope here

- R7 (domain defaults) — additive content later, no FE rework.
- Backend hardening follow-ons (auth'd-MCP-import, KMS cutover, etc.) — coordinator-owned, unrelated to this FE work.
- The full **visual** OHM builder — a Wave-1 refinement; start template/form-driven to reach the end-to-end loop sooner.
