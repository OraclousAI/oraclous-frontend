# Gap log — FE catch-up roadmap

Running log per the roadmap §5 protocol: `[FE|BE|INT] wave-N — surface — symptom — suspected cause`.
`FE` items are frontend follow-ups; `BE`/`INT` items go back to the coordinator session.

## Wave 0

- [INT] wave-0 — auth/register — the gateway collapses the auth-service's 422 validation detail (e.g. `password must contain both upper and lower case letters`) into a generic `MALFORMED_REQUEST` / "The request body could not be parsed." — the console can only show that useless message, so a user failing the password policy gets no actionable feedback. Suspected cause: the gateway's proxied-error envelope mapping discards the upstream 422 detail instead of mapping it to `VALIDATION_FAILED` + message. Verified live: direct in-container register returns the detail; via the gateway it is gone.
- [FE] wave-0 — signup — the password hint reads "At least 8 characters" but the live policy also requires mixed case; once the gateway surfaces validation detail (item above), bind the hint/error copy to the contract instead of hardcoding.
- [INT] wave-0 — dashboard activity feed — `dashboard.html` shows a live activity stream; no cross-workspace activity/events endpoint exists. Shipped as an honest empty state; expected to be fed by the Wave-1 jobs surface (or a dedicated events endpoint if one is planned).
- [BE] wave-0 — spend/usage — no metering/spend read endpoint (ADR-009 posture: substrate emits usage events, billing downstream not built). Cost KPI, sidebar spend, and the billing meters all show placeholders; the mockups' cost-candor strip needs this to be real.
- [INT] wave-0 — invite receipt — `login.html` state 02 renders per-grant rows ("you will be able to: …"); the invitation peek API exposes only org name + role + status, so the receipt renders without grants.
- [FE] wave-0 — a11y gate coverage — CI Gate 3 (axe-core AA) scans only the marketing static build; there are no console specs, so the Wave-0 "axe AA green" acceptance is not machine-checked. Needs console axe specs (auth pages unauthenticated; app pages behind a test session) — follow-up.
- [FE] wave-0 — components still off-system — `OntologyEditor`, `Skeleton`, and the toast stack keep their inline styles (components, not pages); `AgentDetailPage` deliberately untouched (rebuilt against `agent-detail.html` in Wave 1).
- [FE] wave-0 — shadcn vs no-Tailwind — the roadmap suggests using the shadcn components in `packages/design-system`, but they are Tailwind-classed while the console is contractually no-Tailwind (CLAUDE.md §6). Wave 0 used token-bound CSS classes (the `shell.css` pattern — also how the mockups themselves are built). Decision needed before any wave leans on shadcn: add a Tailwind build to the console, or keep extracting CSS patterns.
- [FE] wave-0 — memory-only session — any full page reload/deep link drops the session and lands on /login (by design, §1.5 — token never persisted). Fine for now; worth a deliberate UX decision later (e.g. silent re-auth) because it also constrains E2E tooling to client-side navigation.

### Wave-0 smoke (2026-06-10, real posture, gateway @ localhost:8006)

Signup → dashboard → create workspace → ingest text (live LLM extraction: 2 nodes / 1 edge) →
semantic search (real scored chunk) → explorer (dark surface renders the subgraph) → agents /
tools / recipes / members / billing / settings — all green, zero browser console errors.
