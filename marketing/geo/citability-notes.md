# Citability Notes — Oraclous marketing corpus

> The `geo-citability` rubric applied to OUR generated content (no live site — these are the finished `marketing/pages/*` drafts). Scores the citable answer blocks (definition-first, self-contained, 40–60 words, one concrete claim), flags the blocks that fail the brief's criteria with exact rewrites, and gives a per-platform readiness note (ChatGPT / Perplexity / Gemini / Google AI Overviews / Bing Copilot) via the `geo-platform-optimizer` rubric.
>
> **Overall citability verdict: STRONG (corpus avg ~88/100).** Every one of the 29 FAQ-bearing pages opens each H2 with a definition-first answer, carries an explicit `> **Citable answer**` block placed high, and uses exact entity terminology. 60 citable blocks total; the glossary adds 18 canonical 40–60-word DefinedTerm blocks. **No block fails on structure or self-containment.** Two blocks sit slightly under the 40-word floor and four sit 1–4 words over the 60-word ceiling — minor, with exact rewrites below. The single systemic weakness is the **Statistical Density** category: by design (positioning §7 forbids invented metrics) the corpus has few hard numbers, which caps that sub-score — this is an honest trade-off, not a defect, and is partly mitigated by the concrete architectural facts that ARE citable (`organization_id` on every record; five policy sets; three BYOM shapes; 20k tokens / 60s production-strict cap; 30–730-day retention).

---

## 1. Score summary (corpus-level, weighted per rubric)

| Category | Weight | Score | Why |
|---|---|---|---|
| Answer Block Quality | 30% | 95 | Every H2 is a real query; every major section opens with a 1–2 sentence direct answer; an explicit citable block per section; definition patterns ("X is…", "Yes — …") throughout. |
| Passage Self-Containment | 25% | 92 | Blocks name their subject ("Oraclous", "A Harness", "ReBAC"), avoid leading pronouns/conjunctions, and stand alone. Minor: a few open with "Yes." / "No." which is self-contained only because the bolded question precedes it — fine for FAQ, see §3 note. |
| Structural Readability | 20% | 94 | Clean H1>H2>H3, question-shaped H2s, short paragraphs, lists for processes (Compile steps), a policy-set table on Security, ItemList on Platform. |
| Statistical Density | 15% | 58 | The deliberate weak spot — no invented metrics/customers/benchmarks (positioning §7). Real, citable facts exist (architecture constants) but are sparse by policy. |
| Uniqueness & Original Data | 10% | 90 | Proprietary, defined vocabulary (Harness, OHM, Operator, Consciousness, "second mind", platform-as-code) found nowhere else; honest "what we don't claim / what portability doesn't carry" framing is genuinely original signal. |
| **Weighted total** | | **~88/100** | (95·.30)+(92·.25)+(94·.20)+(58·.15)+(90·.10) = 28.5+23+18.8+8.7+9.0 = **87.9** |

**Citability coverage:** ~97% of citable blocks score above 70 individually (only the 6 length-outliers in §3 sit just below the brief's word window; none below 70 on the rubric).

---

## 2. Strongest blocks (exemplars — replicate this shape)

1. **`/glossary/*` DefinedTerm definitions (all 18)** — each is the rubric's ideal: opens "X is [definition]", 40–60 words, self-contained, exactly one entity, zero filler. e.g. *"ReBAC defines permissions by the relationships between entities — people, Agents, workspaces, data — rather than by static roles…"* These are the single most liftable assets in the corpus and the AEO engine for the whole site.
2. **`/security` — "How does Oraclous keep our data sovereign?" (46 w)** — definition-first, names the mechanism (`organization_id` filter), carries a concrete architectural fact ("impossible rather than merely disallowed"), and ends on the key-custody claim. Procurement-grade.
3. **`/platform/rebac-governance` — "What is ReBAC governance?" (51 w)** — pairs the proprietary enforcement ("platform-wide at the Harness level") with the established contrast ("avoiding RBAC's role explosion") in one liftable block; ideal proprietary↔established pairing.
4. **`/platform/metering` — "What does metering track?" (FAQ)** — the rare high-stat block: five named dimensions + the event schema fields. Concrete and quotable.
5. **`/how-it-works` — "How does Oraclous turn a goal into running work?" (52 w)** — compresses the whole lifecycle into one extractable answer; the canonical procedural summary engines will quote for "how does Oraclous work".

---

## 3. Blocks that fail the brief's 40–60-word window (the only failures) — with exact rewrites

All six are *structurally* strong (definition-first, self-contained, one claim); they only miss the brief's word target. Two are under 40, four are 61–64. Fixes below bring each into 40–60 without losing a claim.

### Under the 40-word floor (enrich with one concrete fact)

**F1 — `/security` "Can we run it air-gapped or on-premise?" (36 w)**
Current:
> Yes. Oraclous is open source and platform-as-code, so it can be self-hosted on your own infrastructure, including isolated and air-gapped environments. Self-hosted and cloud-hosted modes carry identical data-sovereignty guarantees — the difference is operational, not architectural.

Rewrite (52 w — adds the concrete sovereignty mechanism so the lift carries proof):
> Yes. Oraclous is open source and platform-as-code, so the whole substrate self-hosts on your own infrastructure, including isolated and air-gapped environments. Because every record carries an `organization_id` enforced at the data layer, self-hosted and cloud-hosted modes carry identical data-sovereignty guarantees — the difference is operational, not architectural, never a weaker isolation story.

**F2 — `/open-source` "Can you self-host AI agents with Oraclous?" (38 w)**
Current:
> Yes. Oraclous is open source and platform-as-code, so the full substrate self-hosts on your own infrastructure — including air-gapped environments — and carries the same data-sovereignty guarantees as the cloud mode: structural org isolation and customer-held encryption keys.

Rewrite (49 w — names what "the full substrate" is, so the block stands fully alone):
> Yes. Oraclous is open source and platform-as-code, so the full substrate — identity, the ReBAC graph, credentials, provenance, and metering — self-hosts on your own infrastructure, including air-gapped environments, and carries the same data-sovereignty guarantees as the cloud mode: structural org isolation and customer-held encryption keys.

### Over the 60-word ceiling (trim one sub-clause)

**F3 — `/platform/actors` "What is an Actor?" (63 w → 56 w)**
Trim the trailing gloss; the "second mind" link can live in body copy, not the lift.
> An Actor is any entity — human member or AI Agent — that can be assigned work in an Oraclous Harness. Humans and Agents are symmetric Actors: each has an identity, a scope, and a capability allocation, and shares a common interface. This symmetry lets people and Agents share one task board under one governance model.

**F4 — `/solutions/multi-model` "How does Oraclous help multi-model teams?" (64 w → 58 w)**
Drop the final key-custody sentence (it duplicates the BYOM keys FAQ on the same page).
> Oraclous makes the model a resource the Agent uses, not the Agent itself. Through BYOM it resolves LLM config at agent, workspace, or organisation level across three protocol shapes — Anthropic-native, OpenAI-compatible, and Gemini-compatible — so teams move between providers, or run them side by side, by changing config rather than rewriting the Harness.

**F5 — `/why-oraclous/vendor-lock-in` "To avoid AI-platform vendor lock-in…" (64 w → 57 w)**
Trim the export-targets list (Claude Desktop/MCP/OpenAPI) — keep it in body.
> To avoid AI-platform vendor lock-in you need three things: model freedom, an open platform, and a portable unit of work. Oraclous gives all three — BYOM swaps models by config across three protocol shapes, the platform is open-source and platform-as-code, and OHM makes your Harnesses exportable and re-runnable, with the docs stating exactly what portability does and doesn't carry.

**F6 — `/solutions/regulated` "How does Oraclous help regulated and security teams?" (62 w → 59 w)** and **`/platform/human-in-the-loop` "Is HITL a workaround or built in?" (61 w)** are 1–2 words over — acceptable as-is; if strict compliance is wanted, drop "and demonstrable" (regulated) and "then resuming" (HITL). Lowest priority.

> Net: 6 of 60 blocks need a touch; 4 are 1–4 words over (cosmetic), 2 are under and benefit from one added fact. The build can ship as-is and apply these on the next copy pass — none harms citability today.

---

## 4. Corpus-wide quick wins (ranked by citability lift)

1. **Add 1–2 hard, true facts to the highest-traffic blocks** — Statistical Density is the only sub-70 category. Without inventing anything, surface the architecture constants that already exist: "five named policy sets", "three BYOM protocol shapes", "production-strict caps a run at 20,000 tokens and 60 seconds", "retention 30–730 days", "`organization_id` on every record". These are verifiable and turn vague-feeling claims into citeable ones. **Expected lift: +6–8 points** (the largest available).
2. **Publish the annual "State of Governed/Sovereign Agents" data report** (keyword-map §5) to create *first-party* statistics the corpus can cite — the only durable fix for the Stat-Density ceiling and a Perplexity/AIO magnet. **+4–6 over time.**
3. **Keep the two under-40 blocks (F1, F2) enriched per §3** so every block lands in the 40–60 window. **+1–2.**
4. **Lock the verbatim-identical and high-fan-out answers** (faq-blocks §A — the byom↔multi-model pair and the "portability does-not-cover" list) to one canonical source so future edits can't introduce competing answers engines would see. **Protects the score over time.**
5. **Render the Security policy-set caps as a small table** (already noted in security.md build notes) — AIO and Copilot extract tables with high accuracy; converts prose caps into a structured, liftable comparison. **+2 on AIO/Copilot specifically.**

---

## 5. Per-platform readiness (geo-platform-optimizer rubric)

Scored on what the **content + schema** deliver. Off-page entity presence (Wikidata, GitHub, LinkedIn, Reddit, YouTube) is mostly TODO per `brand-mention-plan.md`, which caps the entity-driven platforms — those scores will rise as the §A actions below land, independent of the content (which is ready).

| Platform | Content-readiness | With off-page TODOs done | Status |
|---|---|---|---|
| Google AI Overviews | 82/100 | 88 | **Strong** — best-fit platform |
| Bing Copilot | 70/100 | 82 | **Strong (borderline)** |
| Google Gemini | 64/100 | 84 | **Moderate → Strong** |
| ChatGPT (web search) | 55/100 | 80 | **Moderate** (entity-gated) |
| Perplexity | 52/100 | 78 | **Moderate** (community-gated) |

### Google AI Overviews — 82 (content is the strongest fit)
- **Why high:** AIO rewards question-shaped H2s, a direct first-sentence answer, tables, lists, definitions, and FAQ sections — the corpus does all of these on every page. The glossary's definition boxes are exactly what AIO lifts.
- **Gaps:** (1) AIO favours pages already ranking top-10 — that's an off-page/time gap, not a content one. (2) Add visible publication/updated dates and author bylines (blog has them via Article/Person schema; evergreen pages should show a "last updated" date — `dateModified` is in schema but surface it in the UI). (3) Statistical Density (see §4.1).
- **Quick win:** surface the architecture constants (§4.1) directly after the relevant H2 answer; add People-Also-Ask-matched H2 phrasings (the FAQ questions already do this well).

### Bing Copilot — 70 (clean markup + meta helps; GitHub is the lever)
- **Why moderate-strong:** Copilot weights clear structured markup, meta descriptions (every page has a written `meta_description`), exact-match keywords in titles/headings (the corpus is exact-termed), and the Microsoft ecosystem — **GitHub especially**, which is a P0 in the brand plan.
- **Gaps (off-page):** Bing Webmaster Tools + sitemap, IndexNow, the LinkedIn company page, and an active GitHub org with a strong README are all TODO. These are the score-movers, not the content.
- **Quick win:** ship `sitemap.xml` + IndexNow + the GitHub README (canonical one-liner identical to `Organization.description`) — pure off-page, high lift.

### Google Gemini — 64 (schema-rich, but YouTube/Knowledge-Panel gated)
- **Why moderate:** Gemini consumes Schema.org aggressively — and this deliverable ships a complete graph (Organization, SoftwareApplication, WebSite+SearchAction, DefinedTermSet, HowTo, FAQPage, BreadcrumbList). That's a real strength. It also leans hard on YouTube and the Google Knowledge Graph/Panel.
- **Gaps (off-page):** no YouTube channel (Gemini's #1 source), no Knowledge Panel, Wikidata item is TODO (feeds the Knowledge Graph that Gemini reads). Image alt-text/multi-modal coverage to confirm at build.
- **Quick win:** create the Wikidata item (P0, low bar) and wire `Organization.sameAs` to it — this is the most direct Gemini lever; then a small YouTube channel (explainers: "What is ReBAC", "self-host Oraclous").

### ChatGPT (web search) — 55 (entity-graph gated, content ready)
- **Why moderate:** ChatGPT runs on the Bing index and weights **entity recognition** — Wikipedia (its #1 source), Wikidata, Crunchbase, comprehensive 2000+-word pages. The pillar pages are comprehensive and well-structured (good), but the entity graph (Wikipedia/Wikidata/Crunchbase) is largely TODO.
- **Gaps:** no Wikipedia (correctly deferred — high bar, brand-plan P2), Wikidata + Crunchbase TODO, Reddit presence (a top ChatGPT source) not yet built.
- **Quick win:** Wikidata + Crunchbase + an "About" entity-consistency lock (the `Organization.description` byte-identical everywhere) so ChatGPT resolves Oraclous as one entity. Begin authentic Reddit participation per the brand plan.

### Perplexity — 52 (community-validation gated, content ready)
- **Why moderate:** Perplexity is the most community-driven engine — Reddit (~40–47% of citations), forums, G2, freshness, and original research. The corpus is fact-dense and quotable (good for Perplexity's per-paragraph citation style), but Perplexity rewards *external community validation* the site can't supply on its own.
- **Gaps:** Reddit/Quora/HN presence, G2 listing, and original data — all TODO/early. Perplexity also values recency, so visible dates matter.
- **Quick win:** the original data report (§4.2) is the single best Perplexity move; pair with authentic Reddit/Quora answers on ReBAC-for-agents, self-hosted-governed-agents, and BYOM (the thin-competition intersection terms from keyword-map §5).

### Cross-platform note (only ~11% domain overlap)
No single channel wins. The **content layer is platform-agnostic and ready** (it satisfies the universal actions: structured content, schema, definitions, clean HTML, exact entities). The remaining lift is almost entirely **off-page entity + community presence** (`brand-mention-plan.md`): Wikidata + GitHub + LinkedIn + Crunchbase (P0) move ChatGPT/Gemini/Copilot; Reddit + G2 + a data report move Perplexity/ChatGPT; YouTube moves Gemini. Sequence them P0→P1 per that plan and re-test the five engines monthly for "open source AI agent platform / self-hosted governed agents / ReBAC for AI agents".

---

## 6. One-line verdict

The generated content is **citation-ready (STRONG, ~88/100)**: definition-first, self-contained, exact-termed, schema-backed. The only content fix is six word-count touch-ups (§3); the only structural ceiling is Statistical Density, deliberately accepted to avoid invented metrics and best lifted by surfacing the real architecture constants and shipping the annual data report. Everything else holding the score down is **off-page entity/community presence**, which is `brand-mention-plan.md`'s job, not the copy's.
