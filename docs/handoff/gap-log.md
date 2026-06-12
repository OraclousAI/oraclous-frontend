# Gap log — FE catch-up roadmap

Running log per the roadmap §5 protocol: `[FE|BE|INT] wave-N — surface — symptom — suspected cause`.
`FE` items are frontend follow-ups; `BE`/`INT` items go back to the coordinator session.

## Wave 0

- [INT] wave-0 — auth/register — the gateway collapses the auth-service's 422 validation detail (e.g. `password must contain both upper and lower case letters`) into a generic `MALFORMED_REQUEST` / "The request body could not be parsed." — the console can only show that useless message, so a user failing the password policy gets no actionable feedback. Suspected cause: the gateway's proxied-error envelope mapping discards the upstream 422 detail instead of mapping it to `VALIDATION_FAILED` + message. Verified live: direct in-container register returns the detail; via the gateway it is gone.
- [FE] wave-0 — signup — the password hint reads "At least 8 characters" but the live policy also requires mixed case; once the gateway surfaces validation detail (item above), bind the hint/error copy to the contract instead of hardcoding.
- [INT] wave-0 — dashboard activity feed — `dashboard.html` shows a live activity stream; no cross-workspace activity/events endpoint exists. Shipped as an honest empty state; expected to be fed by the Wave-1 jobs surface (or a dedicated events endpoint if one is planned).
- [BE] wave-0 — spend/usage — no metering/spend read endpoint (ADR-009 posture: substrate emits usage events, billing downstream not built). Cost KPI, sidebar spend, and the billing meters all show placeholders; the mockups' cost-candor strip needs this to be real. **Resolved 2026-06-11** — backend shipped a priced-spend read (`GET /v1/harnesses/spend?since=`, oraclous-backend #252→#256): per-model + total estimated USD of the user's BYOM provider spend (not a platform charge). Bound the three cost surfaces to it (#74): the estimate is labelled as such, unpriced models show tokens only (no fabricated $), and `model:null` pre-metering runs read as "no spend yet".
- [INT] wave-0 — invite receipt — `login.html` state 02 renders per-grant rows ("you will be able to: …"); the invitation peek API exposes only org name + role + status, so the receipt renders without grants.
- [FE] wave-0 — a11y gate coverage — CI Gate 3 (axe-core AA) scans only the marketing static build; there are no console specs, so the Wave-0 "axe AA green" acceptance is not machine-checked. Needs console axe specs (auth pages unauthenticated; app pages behind a test session) — follow-up.
- [FE] wave-0 — components still off-system — `OntologyEditor`, `Skeleton`, and the toast stack keep their inline styles (components, not pages); `AgentDetailPage` deliberately untouched (rebuilt against `agent-detail.html` in Wave 1).
- [FE] wave-0 — shadcn vs no-Tailwind — the roadmap suggests using the shadcn components in `packages/design-system`, but they are Tailwind-classed while the console is contractually no-Tailwind (CLAUDE.md §6). Wave 0 used token-bound CSS classes (the `shell.css` pattern — also how the mockups themselves are built). Decision needed before any wave leans on shadcn: add a Tailwind build to the console, or keep extracting CSS patterns.
- [FE] wave-0 — memory-only session — any full page reload/deep link drops the session and lands on /login (by design, §1.5 — token never persisted). **Resolved 2026-06-10** (maintainer-directed): the session-vault primitive (`lib/session-vault.ts`, IndexedDB + AES-GCM non-extractable key) persists the rotating refresh token; `useSessionHydration` silently re-logs-in on boot via `/v1/auth/refresh`, with cross-tab Web-Lock serialisation (refresh tokens are single-use — reuse kills the token family). Access tokens remain memory-only; CLAUDE.md §1.5 updated.
- [INT] wave-0 — refresh-token custody — the strictly better mechanism is an **HttpOnly refresh cookie minted by the gateway** (scoped to `/v1/auth/refresh`, Secure + SameSite=Strict): it removes the client-side-readable refresh credential entirely and lets the console drop the vault exception. Needs a gateway/auth-service change (coordinator) + a small FE follow-up to stop sending the body token.
- [INT] wave-0 — revoke-on-logout — logout is client-side only today: the rotated refresh token stays valid at the auth-service for its full 14-day sliding TTL because no logout/revoke endpoint exists. A gateway `POST /v1/auth/logout` that revokes the presented token's family (wired into the console's logout best-effort, before the local clear) bounds the blast radius of any stranded credential; cheaper than, and complementary to, the cookie change above.

### Wave-0 smoke (2026-06-10, real posture, gateway @ localhost:8006)

Signup → dashboard → create workspace → ingest text (live LLM extraction: 2 nodes / 1 edge) →
semantic search (real scored chunk) → explorer (dark surface renders the subgraph) → agents /
tools / recipes / members / billing / settings — all green, zero browser console errors.

## Post-merge findings (2026-06-10, maintainer testing)

- [BE] post-wave-0 — **gateway truncates large proxied responses** — the Explorer shows "Couldn't load the graph" for graphs whose subgraph payload exceeds roughly one flush (~25 KB is fine; a 245 KB / 47-node response truncates 3/3). Root cause is in `application-gateway-service`'s generic reverse proxy (`routes/proxy_routes.py`, the success branch): it returns `StreamingResponse(upstream.aiter_raw(), background=BackgroundTask(upstream.aclose))` over a shared `httpx.AsyncClient` opened with `send(stream=True)` — the upstream connection can be reclaimed mid-iteration, so the relay stops without the terminating chunk. Evidence: (1) the same request served complete (245,523 bytes, valid JSON) when called in-container directly against knowledge-retriever with the gateway's trust headers; (2) through the gateway it arrives truncated at a _varying_ byte count (14–65 KB across runs) with curl reporting "transfer closed with outstanding read data remaining"; (3) uvicorn logs "ASGI callable returned without completing response" on each occurrence; (4) browsers/undici treat the missing terminator as a hard network error (`TypeError: terminated`), which is exactly the FE's query error. **curl masks the bug** — it keeps the partial body and prints `200 OK`, which is why it looked like a frontend issue. No FE change is possible (the payload is genuinely incomplete; failing closed is correct). Fix options for the coordinator: buffer non-streaming proxied responses (`await upstream.aread()`), or own the stream lifecycle inside the response generator (`client.stream(...)` as a context manager) — and note the duplicate `date` header from `response_headers()` while there. Regression test must use a payload large enough to span multiple flushes.
- [FE] post-wave-0 — Tools page tiles overlapped — `.cat-tile` sized content-box on the `<li>` (Tools) and `<a>` (Agents) shapes, so `width:100%` + padding/border overflowed the grid track; fixed by sizing the tile border-box. Follow-up worth its own PR: the console has no global `*, *::before, *::after { box-sizing: border-box }` reset (the marketing app has one) — adding it would kill this class of bug but needs a visual-regression pass app-wide.

## Wave-1 findings (2026-06-11, contract investigation + live golden-path proof)

The full build → save → run (sync + durable) → poll → results → provenance path was proven live
through the gateway before any UI was built. Gaps found on the way:

- [BE] wave-1 — **no knowledge-retriever capability in the registry** ([oraclous-backend#245](https://github.com/OraclousAI/oraclous-backend/issues/245)) — the flagship "QA over your graph" agent cannot bind the graph as an in-loop tool; only the 5 credential-gated ingestion readers exist. Retrieval works as a direct gateway call (`POST /v1/search/semantic`). The builder's palette is registry-driven, so the retriever appears automatically once registered — zero FE change.
- [BE] wave-1 — **deployed harness-runtime runs `HARNESS_LLM_MODE=fake`** ([oraclous-backend#246](https://github.com/OraclousAI/oraclous-backend/issues/246)) — every run returns the scripted output and `total_tokens` 0, despite the brief's "nothing stubbed" posture. Wire shapes are identical in live mode, so the UI is built and smoked against fake; the Wave-1 acceptance smoke needs the live flag + a seeded OpenRouter broker credential (live mode requires `models[].config.credential_id`).
- [BE] wave-1 — **engine error taxonomy** — a job whose manifest fails OHM validation surfaces `error_type: "harness_unreachable"` with the real 422 detail buried in `error_message`. The console keys all failure copy off `error_message` and ignores `error_type` until fixed.
- [BE] wave-1 — **no pagination/filter params** on `GET /v1/harnesses/executions` (whole org list) or `GET /v1/engine/jobs` (hard-capped at the 50 newest, not exposed as a param). Fine at Wave-1 volume; needed before lists grow. Per-agent run filtering is client-side (`manifest_ref` match) for the same reason.
- [BE] wave-1 — **per-step audit provenance has no read endpoint** — the harness writes `llm.complete`/`capability.invoke`/`governance.gate` rows to `harness_provenance`, but the only API-visible per-step record is `steps[]` on the execution (sufficient for the Wave-1 results screen) plus the org-level `GET /v1/engine/activity` feed. Audit-grade step trails need a backend read surface.
- [INT] wave-1 — **gateway OpenAPI is incomplete vs live routing** — `GET /v1/harnesses/executions/{id}`, `/v1/engine/activity`, `/v1/engine/usage`, schedules and task routes all proxy fine but are undocumented, and success bodies are typed as opaque passthrough. `packages/api-client` is curated from the upstream service DTOs instead (shapes live-verified); the OpenAPI doc should catch up.
- [INT] wave-1 — **`GET /v1/agents` returns a bare array** (every other list returns `{items/total}`-style envelopes). Publish/invoke (the public agent surface) is Wave-2; the client should normalise when added.

## Wave-2 findings (2026-06-12, developer/embed surfaces — integration keys, published agents, webhooks)

The three developer surfaces were built against the live `application-gateway-service` contracts
(verified in source + smoked end-to-end): integration keys (`/v1/integration-keys`), published
agents (`/v1/agents`), and webhook subscriptions (`/v1/webhook-subscriptions`). The full embed
spine was proven live: **publish an agent → mint a bound integration key → external `/invoke`
(auth verified) → create a webhook subscription → a github-signed delivery to `/v1/webhooks/{id}`
is accepted (202)**. All three display-once secrets (`oak-…` key, `whsec_…` signing secret) are
held in memory for one reveal and never persisted/cached (mutations use `gcTime: 0` + `reset()`).

- [FE] wave-2 — **the named mockup `access.html` is a mismatch.** The roadmap (§4) maps Wave 2 to
  `04-redesigned-screens/access.html`, but that screen is the **ReBAC access-control** surface
  (subjects/resources/relations/grant-explanation + audit log), not the developer/embed surfaces
  the issue (#57) actually enumerates (integration keys, published agents, webhooks). There is no
  developer-keys/agents/webhooks mockup in the handoff. Built **greenfield from the verified
  contracts**, reusing the existing `styles/page.css` system; behavioural precedent is the legacy
  `dash/views/Settings.tsx` keys tab (display-once `IssuedKeyModal`) and `AgentStudio` publish flow.
  `access.html` itself belongs to a future **access/ReBAC** surface, not this wave.
- [BE] wave-2 — **no unpublish endpoint** ([oraclous-backend#280](https://github.com/OraclousAI/oraclous-backend/issues/280)).
  `published_agent_routes.py` has only publish/list/get/invoke; the model honours `status='unpublished'`
  on read/invoke but nothing can flip it. The console publishes but cannot unpublish — `status` is
  rendered read-only with a "not callable" note for non-active agents. Non-blocking.
- [INT] wave-2 — **gateway 422 validation isn't the ORA-56 envelope** ([oraclous-backend#281](https://github.com/OraclousAI/oraclous-backend/issues/281)).
  Request-validation 422s come back as FastAPI `{detail:[{loc,msg,type}]}`, not `{error:{code,…}}`.
  The mint/publish forms hit 422 by design (slug/CORS/binding-XOR). The typed client now maps both
  the `{detail:[…]}` list and a `{detail:"…"}` string onto the envelope (PR #81) so forms show
  field-level errors; the parser retires when the gateway emits the envelope itself.
- [BE] wave-2 — **developer-surface read gaps** ([oraclous-backend#282](https://github.com/OraclousAI/oraclous-backend/issues/282)):
  no member-plane `GET /v1/agents/{slug}` (only the bound-key public projection), so an agent detail
  view hydrates by filtering the list client-side; and `rate_window_seconds` is write-only (accepted
  and enforced but absent from `KeyOut`), so the keys list shows the limit without its window. Low
  priority; worked around client-side.
- [BE] wave-2 — **invoke returns 502-retryable for an unrunnable bound capability**
  ([oraclous-backend#283](https://github.com/OraclousAI/oraclous-backend/issues/283)). `POST /v1/agents`
  accepts any non-empty `bound_capability_ref` without checking it resolves; invoking an agent bound
  to a non-runnable ref returns `502 SERVICE_UNAVAILABLE` with `retryable: true` (an external caller
  would retry a permanent failure forever). Auth + routing are correct (no-auth/wrong-key → 401, bound
  key → past auth); only the harness execution 502s. Likely tied to the deployed harness-runtime
  state (Wave-1 #246). Non-blocking for the FE — it does not make the invoke call.
- [FE] wave-2 — **member vs admin granularity.** The console models org authority as owner (or a
  standalone personal org) vs member; the gateway's developer mutations are `AdminDep` (owner **or**
  admin). A non-owner _admin_ would be treated as a read-only member by the console here. The
  Developer nav + mutations are gated to owner/standalone; revisit if the console gains an explicit
  admin tier. Read endpoints are member-accessible, so the lists work for everyone.

## Post-Wave-2 follow-ups (2026-06-12, backend #279–#283 shipped)

The five backend issues from the Wave-2 build all landed (oraclous-backend #284–#288) and were
re-verified live against the running gateway. The FE follow-ups they unblocked:

- [FE] **rate window shown** ([#86](https://github.com/OraclousAI/oraclous-frontend/pull/86)) — the
  gateway now returns `rate_window_seconds` in `KeyOut` (#282), so the integration-keys list shows
  `100/60s`, not just the count.
- [FE] **entity-resolution approve/reject** ([#87](https://github.com/OraclousAI/oraclous-frontend/pull/87),
  closes #77) — the knowledge-graph HITL endpoint shipped (#279/#288:
  `POST /api/v1/graphs/{id}/resolution/{candidate_id}/{approve,reject}`). The explorer's candidate
  panel is now actionable: Merge (a two-step survivor chooser that disambiguates duplicate names by
  node id) + Not-a-match. `candidate_id = sha256("{min}|{max}")` is computed FE-side to match the
  backend's order-independent formula (verified byte-for-byte).
- [BE→resolved] **unpublish button was CORS-blocked** ([oraclous-backend#289](https://github.com/OraclousAI/oraclous-backend/issues/289))
  — the member-plane `DELETE /v1/agents/{slug}` (#280/#284) was unreachable from the browser because
  the public-plane `AgentCorsMiddleware` owns that path. Fixed in **two phases**: first the `OPTIONS`
  preflight omitted DELETE from `Allow-Methods`; then (caught on re-verification) the **actual** DELETE
  204 was missing `Access-Control-Allow-Origin` while only the preflight had it — browsers enforce ACAO
  on both. The middleware now defers the actual member-plane DELETE response so the gateway-wide ACAO
  survives. Both headers verified live; the **Unpublish button shipped** (admin, two-step confirm,
  terminal → `status: 'unpublished'`). Lesson logged: verify the actual response's CORS headers, not
  just the preflight.
- [INT] **#281 422 envelope landed** — the gateway now emits the ORA-56 `{error:…}` envelope for its
  own 422s (verified: a binding-XOR violation returns `VALIDATION_FAILED`). The client's defensive
  `{detail:[…]}` parser (PR #81) stays as coverage for any raw-FastAPI service but is no longer
  load-bearing for the gateway's own validation.
- [BE→done] **#283 invoke is non-retryable now** — invoking an agent whose bound capability isn't
  runnable returns a non-retryable `422` (was a retryable `502`). No FE change (the console doesn't
  call invoke).
- [BE→done] **#282 member-plane agent read** — added at `GET /v1/agents/{slug}/details` (not
  `/v1/agents/{slug}`, which stays the bound-key public projection). The published-agents page works
  off the list, so no FE change is required yet.

## Wave-3 findings (2026-06-12, the final wave — chat console + MCP supply-chain HITL)

Two surfaces built against the live gateway: the member **chat console** (Second Mind,
`/v1/chat/threads`) and **MCP import + approval** (capability-registry, proxied at `/api/v1/tools`).
Contracts verified in source + smoked end-to-end before any UI.

- [FE] wave-3 — **`second-mind.html` "memory feed" rail dropped** — the mockup's right column (a
  "what I know + how I learned it" feed with inline citations + live sources) has **no backing
  endpoint** (`MessageOut` carries no citations; there is no memory/sources route). Building it would
  invent gateway shapes (§8), so the chat console is a **single-pane** thread-rail + message-stream +
  composer. The mockup's own `@media (max-width:1100px)` already collapses to single-column.
- [FE] wave-3 — **chat send is synchronous, not streaming** — `POST /v1/chat/threads/{id}/messages`
  returns a full `ChatTurnOut` at HTTP 200 (`status: succeeded|pending|failed`); there is no SSE /
  token stream. The composer is honest about this (optimistic user bubble + a "thinking" placeholder,
  no fake typewriter). If token streaming becomes a product requirement it's a gateway/harness change.
- [BE] wave-3 — **no chat message feedback** ([oraclous-backend#313](https://github.com/OraclousAI/oraclous-backend/issues/313))
  — the roadmap wants thumbs up/down, but `MessageOut` has no rating field and there's no feedback
  route (the legacy `MessageFeedbackClient` scaffold targets non-existent paths and is now unexported).
  Maintainer-approved to ship Wave 3 without it; the affordance lands when the endpoint exists.
- [BE] wave-3 — **no MCP reject/decline route** ([oraclous-backend#314](https://github.com/OraclousAI/oraclous-backend/issues/314))
  — `tool_routes.py` has only `/approve`; a pending imported tool can only be approved or left pending.
  The console's pending-approval queue ships **Approve-only** (maintainer-approved); reject lands when
  the route exists. A supply-chain gate that can only approve isn't a complete gate.
- [BE] wave-3 — **scaling follow-ups (low priority):** `GET /v1/chat/threads` + `…/messages` are bare
  arrays with no pagination; there's no thread-rename (`PATCH`); `GET /api/v1/tools` has no status
  filter (the FE filters `pending_approval` client-side). All fine at current volume; flagged for when
  transcripts / catalogues grow.

### Wave-3 smoke (2026-06-12, gateway @ localhost:8006)

Chat: real thread create/list/delete (`204`) + send routing all work; the agent run `502`s only on a
non-runnable bound capability (a backend/env matter, as in Wave 2's invoke). UI: succeeded reply,
pending notice, graceful 502 + unsent-text restore, no failed-turn double-show. MCP: import → 2 tools
land pending → approve → moves to active. Zero browser console errors.

### Wave-3 follow-ups resolved (2026-06-12)

Backend shipped the two endpoints the Wave-3 surfaces were waiting on, and the FE follow-ups landed:

- **Chat message feedback** ([oraclous-backend#313](https://github.com/OraclousAI/oraclous-backend/issues/313)
  resolved) — `MessageOut` gained `rating` and `POST /v1/chat/threads/{tid}/messages/{mid}/feedback`
  (member, idempotent — re-rating replaces) now exists. The console renders 👍/👎 on assistant bubbles,
  highlights the chosen rating in place, surfaces a failed POST as a toast, and disables both thumbs
  while a rating is in flight.
- **MCP reject** ([oraclous-backend#314](https://github.com/OraclousAI/oraclous-backend/issues/314)
  resolved) — `POST /api/v1/tools/{id}/reject` (admin, `204`) moves a pending tool to a terminal
  `rejected` state (retained as an audit record). The pending-approval queue now ships a Reject button
  beside Approve; rejected tools are hidden from both the queue and the runnable catalogue. The
  supply-chain gate is now complete (approve **or** reject).

New low-priority follow-up surfaced building the above:

- [BE] wave-3 — **no per-message "ratable" signal** — the backend persists a generic assistant message
  on a `failed` turn, which the transcript renders as a normal assistant bubble carrying 👍/👎, but
  rating it `404`s ("not a ratable assistant turn"). The FE now surfaces that 404 as a toast, but the
  thumbs shouldn't be offered at all on a non-ratable turn. A `ratable: bool` (or equivalent) on
  `MessageOut` would let the FE hide the affordance. Cosmetic at current volume; filed for polish.
