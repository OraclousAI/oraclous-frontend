# Oraclous — Launch-phase content calendar (30 days / 4 weeks)

> Editorial + social plan for the launch phase, applying the `market-social` rubric (5 pillars, week-by-week schedule, 1-to-many repurposing, cadence/ownership, KPIs) and grounded in `strategy/messaging-matrix.md`, `strategy/personas.md`, `research/brand-mention-plan.md`, `research/competitive-landscape.md`, and `brand/voice-and-tone.md`. Terminology is exact throughout — **Harness, OHM, ReBAC (never RBAC), BYOM, Operator, Agent (never "bot"), Capability, Consciousness, Portability, second mind**. Voice is confident, precise, honest — no invented metrics, no fake logos, no hype (voice-and-tone §3). Author/date fields on all assets are `[TBD]` until a named human owner is assigned (E-E-A-T; positioning §7).

---

## 1. Brand context

- **Brand:** Oraclous (exact casing; the GitHub org handle is `OraclousAI`, public-facing name is `Oraclous` per brand-mention-plan §5).
- **One-liner (canonical, used identically everywhere):** "Oraclous is an open-source platform for forming an organisation's second mind — a governed fabric where human Operators and AI Agents work side by side under the organisation's own ReBAC rules."
- **Audience:** the five personas — Operations/automation lead (A), Platform builder/developer (B), Security & compliance leader (C), ML/multi-model lead (D), Open-source evaluator (F), plus federation owner (E) as a secondary.
- **Voice:** the senior engineer who has read the spec, names the trade-offs before you ask, and is quietly certain because the architecture backs every word. Lean formal, mostly serious with dry wit, technical-made-legible, quietly bold.
- **Primary launch goal:** make Oraclous resolvable as an *entity* to AI answer engines for the category, and earn the first wave of developer + security trust — measured by AEO citation checks, not vanity reach.

---

## 2. Content pillars (mapped to messaging pillars + personas)

Five pillars anchor everything. Each maps to a messaging pillar (messaging-matrix), a primary persona, the keyword-entity-map pillar(s) it serves, and the off-page channels that engine it. Mix ratio adapts the market-social default to a B2B/dev-trust launch.

| # | Pillar | Maps to messaging pillar | Primary persona | Keyword-map pillar | Lead channels | Share |
|---|---|---|---|---|---|---|
| **P1** | **Governance & ReBAC** ("governance, not just orchestration") | Pillar 4 — governance is the platform | C, E | D (governance/access), G | LinkedIn, Reddit (r/devops, r/sysadmin), Blog, YouTube explainer | 25% |
| **P2** | **Sovereignty** ("your data, your keys, your exit") | Pillar 3 — your data, your keys | C | C (sovereignty/security) | LinkedIn, Security trust page, Reddit (r/selfhosted), G2 | 20% |
| **P3** | **Model-freedom / BYOM** ("change the model, keep the harness") | Pillar 5 — bring any model, no lock-in | D, B | E (BYOM), F (MCP) | X, Reddit (r/LocalLLaMA), Hugging Face, YouTube demo | 20% |
| **P4** | **Concepts / second mind** (the category reframe) | Pillar 1 + 2 — one workforce; describe the goal | A, all | A (orchestration), J (glossary) | LinkedIn, Blog, X threads, Glossary/FAQ snippets | 20% |
| **P5** | **Open-source / build** ("read the code, read the trade-offs") | Pillar 6 — open and honest | B, F | B (open-source/self-host) | GitHub, Show HN, X, Reddit (r/opensource), Product Hunt | 15% |

**Honesty through-line (all pillars):** every strong claim is paired with its boundary where material (voice-and-tone §2.2/§3). The trade-off disclosures (what Portability omits; ISO 27001 / SOC 2 Type II as *target* hosting certs, not achieved; pre/early with no customers) are assets to the OSS evaluator and security buyer — never hidden.

---

## 3. The 7 seed blog posts (slotted across the 4 weeks)

Three are finished this cycle (★); four are in the seed list (`ia/page-structures/blog.md`) and drafted/scheduled across the month. Each names its pillar, primary persona, lift-tag default, and target query.

| # | Post | Pillar | Persona | Target query | Status |
|---|---|---|---|---|---|
| B1 ★ | Platform-as-code: separating governance from agent behaviour | P1 | C/B | platform-as-code | **Finished** (`/blog/platform-as-code-governance-vs-behaviour`) |
| B2 ★ | OHM: a portable manifest format for AI agents | P5/P2 | B/F | portable manifest for AI agents | **Finished** (`/blog/ohm-portable-manifest-for-ai-agents`) |
| B3 ★ | Human-in-the-loop as a first-class primitive (not a workaround) | P1/P4 | A/C | human in the loop AI agents | **Finished** (`/blog/human-in-the-loop-first-class-primitive`) |
| B4 | ReBAC vs RBAC for AI agents | P1 | C | ReBAC vs RBAC | Seed — draft Wk1, publish Wk2 |
| B5 | What is data sovereignty for AI? | P2 | C | data sovereignty AI | Seed — draft Wk2, publish Wk3 |
| B6 | BYOM: run Claude, GPT, Gemini, or a local model | P3 | D | BYOM AI agent platform | Seed — draft Wk2, publish Wk3 |
| B7 | The best open-source LangChain alternative | P5 | B/F | open source LangChain alternative | Seed — draft Wk3, publish Wk4 |

> Cadence: ~2 posts/week. B4 (ReBAC vs RBAC) is the wedge piece — own the ReBAC-for-agents intersection before competitors (keyword-entity-map §1 Pillar D). B7 (comparison/alternative) carries the highest commercial intent; keep it fair, no straw-manning (competitive-landscape §7; blog template terminology guard).

---

## 4. Off-page sequencing (do this before the social cadence spins up)

Per `brand-mention-plan.md` §2/§6, the entity graph must resolve *before* launch-day citation spikes. **P0 first, in the first 30 days, in this order:**

1. **Wikidata item** (P0) — label `Oraclous`, one factual description, `instance of`, official website, country; add GitHub/Crunchbase/LinkedIn/site identifiers (these become the `sameAs` web). Feeds Gemini / Google Knowledge Graph.
2. **GitHub org + flagship repo** (P0) — public `OraclousAI`, strong README (canonical one-liner + quickstart + links), topics `agentic-ai`/`multi-agent`/`rebac`/`mcp`/`byom`/`self-hosted`/`data-sovereignty`/`open-source`, and an **MCP server published to the public registry**. Feeds Copilot + OSS trust.
3. **LinkedIn company page** (P0) — identical name/description/logo/URL; founders posting on governance, ReBAC, sovereignty. #1 cited domain for professional queries across engines.
4. **Crunchbase** (P0) — category = agentic AI / multi-agent orchestration platform; founders, HQ, year — all matching §5 identity.
5. **Organization JSON-LD with `sameAs`** on the site linking all of the above; lock the §5 identity doc (byte-identical everywhere).

Only after P0 resolves do P1 channels turn on (Reddit/Quora authentic participation, G2 claim, Show HN + Product Hunt prep). P2 (YouTube, eventual Wikipedia) is earned over time — Wikipedia is **not** attempted yet (bar too high; a deletion hurts).

---

## 5. Week-by-week schedule

Channels per item are tagged with the **pillar** and **persona** they serve. Times are placeholders; the owner sets local slots. Reddit/HN rule: **authentic participation only** — answer questions, share builds, never spam (brand-mention-plan §2.5). Engagement engines: ChatGPT + Perplexity favour Reddit; Gemini favours YouTube + Knowledge Graph; Copilot favours GitHub; LinkedIn is cited across all.

### Week 1 — "Lay the entity graph + the concept" (theme: second mind + open source)
*Off-page focus: complete all P0 nodes (Wikidata, GitHub, LinkedIn, Crunchbase, `sameAs` JSON-LD). Blog: B1 + B2 live; draft B4.*

| Day | Channel | Pillar / Persona | Item |
|---|---|---|---|
| Mon | Blog | P1 / C-B | **Publish B1** (platform-as-code) |
| Mon | LinkedIn | P4 / all | Launch post: "Forming a second mind" — the category reframe + one-liner (links Glossary `second-mind`) |
| Tue | X (thread) | P5 / B-F | "Why we built an agent platform as *code* and the agents as *prose*" — 6-tweet thread from B1 |
| Tue | GitHub | P5 / F | Repo goes public; README + pinned MCP server; topics set |
| Wed | Blog | P5/P2 / B-F | **Publish B2** (OHM portable manifest) |
| Wed | Reddit r/opensource | P5 / F | Genuine intro post: "Open-source governed agent platform — here's the architecture + the trade-offs we don't hide" |
| Thu | LinkedIn | P2 / C | "Self-host isn't sovereignty — here's what actually is (your keys, KMS separation, `organization_id`)" |
| Thu | X (single) | P3 / D | Quotable line: "The LLM is a resource the Agent uses, not the Agent itself." (links Glossary `byom`) |
| Fri | YouTube (concept) | P4 / all | Script + record explainer: "What is a second mind? (Oraclous in 4 minutes)" — publish Wk2 |
| Fri | Reddit r/selfhosted | P2 / F | Answer 2–3 existing "self-hosted AI agents" threads with substance + a link where it genuinely helps |

### Week 2 — "Own the ReBAC wedge" (theme: governance & ReBAC)
*Blog: publish B4; draft B5 + B6. Off-page: begin G2 claim; start Quora answers on ReBAC.*

| Day | Channel | Pillar / Persona | Item |
|---|---|---|---|
| Mon | Blog | P1 / C | **Publish B4** (ReBAC vs RBAC for AI agents) — the wedge piece |
| Mon | LinkedIn | P1 / C | "RBAC has a role-explosion problem. For AI agents, ReBAC is the answer." (cite the industry's own RBAC-vs-ReBAC framing; link Glossary `rebac`) |
| Tue | X (thread) | P1 / C-B | "ReBAC for AI agents, explained in 7 tweets" from B4 |
| Tue | YouTube | P1 / C | **Publish** "What is ReBAC for AI agents?" explainer |
| Wed | Blog | P1/P4 / A-C | **Publish B3** (human-in-the-loop first-class primitive) |
| Wed | Reddit r/devops | P1 / B | "How do you actually govern what an AI agent can access?" — answer-led, ReBAC angle |
| Thu | LinkedIn | P1 / A | "Waiting on a human should be like waiting on a tool return" — HITL post from B3 |
| Thu | Quora | P1 / C | Answer "What is ReBAC and how is it different from RBAC?" with the Glossary definition + link |
| Fri | X (single) | P1 / C | "Code wins over prose. That's not a slogan — it's why the audit holds." |
| Fri | Reddit r/AI_Agents | P4 / B | Share a sample Harness / the HITL-as-primitive idea; engage genuinely |

### Week 3 — "Model freedom + sovereignty proof" (theme: BYOM + data sovereignty)
*Blog: publish B5 + B6; draft B7. Off-page: prep Show HN + Product Hunt assets (coordinate same week as Wk4 launch).*

| Day | Channel | Pillar / Persona | Item |
|---|---|---|---|
| Mon | Blog | P3 / D | **Publish B6** (BYOM: Claude, GPT, Gemini, or local) |
| Mon | LinkedIn | P3 / D | "Change the model. Keep the Harness." — three protocol shapes, model-as-resource |
| Tue | X (thread) | P3 / D | "BYOM done right: Anthropic-native, OpenAI-compatible, Gemini-compatible — and your keys" |
| Tue | Reddit r/LocalLLaMA | P3 / D | Demo a provider swap incl. a local/Ollama model; honest about the three supported shapes (don't over-claim) |
| Wed | Blog | P2 / C | **Publish B5** (What is data sovereignty for AI?) |
| Wed | LinkedIn | P2 / C | "Cross-organisation data flow isn't restricted — it's structurally impossible." (link Security) |
| Thu | YouTube (concept) | P5 / F | Record "Self-host Oraclous" walkthrough — publish Wk4 alongside launch |
| Thu | Quora | P2 / C | Answer "How do you keep company data private when using AI agents?" |
| Fri | X (single) | P2 / C | Honesty asset: "Here's exactly what our Portability does *not* carry." (links Portability page) |
| Fri | Reddit r/MachineLearning | P3 / D | Thoughtful comment on a model-choice/lock-in thread; link only where it adds value |

### Week 4 — "Launch surface" (theme: open-source / build + comparison)
*Blog: publish B7. Off-page: coordinated **Show HN + Product Hunt** (entity graph already resolved from Wk1 P0). Start the monthly AEO citation check.*

| Day | Channel | Pillar / Persona | Item |
|---|---|---|---|
| Mon | Blog | P5 / B-F | **Publish B7** (best open-source LangChain alternative) — fair comparison |
| Mon | LinkedIn | P5 / B | "Open framework ≠ no lock-in. Here's the difference OHM makes." |
| Tue | **Show HN** | P5 / B-F | "Show HN: Oraclous — open-source, ReBAC-governed, BYOM agent platform" — engage in comments genuinely |
| Tue | **Product Hunt** | P5 / all | Launch with the canonical one-liner + open-source/sovereignty hook |
| Wed | YouTube | P5 / F | **Publish** "Self-host Oraclous" walkthrough |
| Wed | Reddit r/LangChain (+ framework subs) | P5 / B | "We built an open-source alternative — here's the architecture, AMA-style" (genuine, link the comparison) |
| Thu | LinkedIn | P4 / all | Recap: "What we shipped this month + what we deliberately left out" (honesty as the close) |
| Thu | X (thread) | P5 / B-F | Launch-week thread: the 4-way whitespace (self-host + ReBAC + BYOM + OHM) |
| Fri | All | — | **Run month-1 AEO citation check** across the 5 engines (see §8); log results |
| Fri | G2 | P2 / C | Ensure listing claimed + description matches §5; begin seeding honest early reviews |

---

## 6. 1-to-many repurposing map (per pillar blog post)

Each pillar blog post becomes a LinkedIn post, an X thread, a Reddit/HN angle, a short-video concept, and a glossary/FAQ snippet. Pattern (market-social §6):

| Pillar (example post) | LinkedIn post | X thread | Reddit / HN angle | Short-video concept | Glossary / FAQ snippet |
|---|---|---|---|---|---|
| **P1 — Governance & ReBAC** (B1, B4) | "RBAC has a role-explosion problem; for AI agents, ReBAC is the answer" — insight + link | "ReBAC for AI agents in 7 tweets" / "code wins over prose: why" | r/devops, r/sysadmin: answer "how do you govern what an agent can access?" — substantive, ReBAC-led | "What is ReBAC for AI agents?" (90-sec explainer, Gemini/YouTube) | Glossary `rebac` definition block (40–60 words) → also a `/security` FAQ Q&A |
| **P2 — Sovereignty** (B5) | "Self-host isn't sovereignty — here's what is" — your keys, KMS separation | "Cross-org data flow: structurally impossible, not restricted" thread | r/selfhosted, r/opensource: answer "keep data private with AI agents?" | "Your keys, your data, your exit" (2-min trust explainer) | Glossary `data-sovereignty` block → `/security` FAQ |
| **P3 — Model-freedom / BYOM** (B6) | "Change the model. Keep the Harness." — three protocol shapes | "BYOM done right" thread (Anthropic-native / OpenAI-compatible / Gemini-compatible) | r/LocalLLaMA, r/MachineLearning: a real provider-swap demo + local model | "Swap Claude → a local model, live" (screen-record demo) | Glossary `byom` block → `/platform/byom` FAQ |
| **P4 — Concepts / second mind** (B3) | "Form your organisation's second mind" — the category reframe | "Humans and Agents as symmetric Actors" thread | r/AI_Agents, r/artificial: share the HITL-as-primitive idea + sample Harness | "What is a second mind?" (4-min explainer) | Glossary `second-mind` / `actor` blocks → Home FAQ |
| **P5 — Open-source / build** (B2, B7) | "Open framework ≠ no lock-in — what OHM changes" | "The 4-way whitespace: self-host + ReBAC + BYOM + OHM" thread | **Show HN** + r/opensource / r/LangChain: architecture-first, honest trade-offs | "Self-host Oraclous in X minutes" walkthrough | Glossary `ohm` / `portability` blocks → `/platform/portability` FAQ |

> Repurposing schedule per post (market-social §6.2): Day 1 publish blog + LinkedIn/X key insight; Day 3 the explainer/short-video; Day 5 the Reddit/HN angle; Day 7 a second-angle take; Day 14 "in case you missed it" reshare. The glossary/FAQ snippet ships *with* the post (it is the article's citable answer block, reused as the canonical Glossary entry — record once, link many; internal-linking §7).

---

## 7. Cadence + ownership (placeholders)

| Workstream | Cadence | Owner |
|---|---|---|
| Blog posts | ~2 / week (7 across the month) | Content/Blog Writer `[TBD]` (named human for E-E-A-T author byline) |
| LinkedIn | 3–5 / week | `[TBD]` (founder/marketing) |
| X / Twitter | 1–2 / day (threads + singles) | `[TBD]` |
| Reddit / HN / Quora | Authentic, 3–5 substantive touches / week | `[TBD]` (technical voice — must engage genuinely, not post-and-leave) |
| YouTube | 1 / week (explainer or demo) | `[TBD]` |
| Off-page entity nodes (P0) | One-time, Week 1, then maintained | `[TBD]` (owns the §5 `sameAs` identity doc) |
| AEO citation check | Monthly | `[TBD]` (GEO owner) |
| Approvals (honesty/terminology guard) | Per asset, pre-publish | `[TBD]` reviewer — checks: exact terms, no invented metrics/logos, trade-offs paired (voice-and-tone §3) |

**Pre-publish guard (every asset):** exact terminology (ReBAC not RBAC; Agent not bot; BYOM shapes, never "Bedrock"; Operator; Harness; OHM; Consciousness; Portability); first-use term links to `/glossary/{term}`; no fabricated customers/metrics/benchmarks; ISO 27001 / SOC 2 Type II referenced only as *target* hosting certs; pre/early framing honest.

---

## 8. KPIs to watch

The launch's success is **entity resolution + citation presence**, not vanity reach. Track monthly.

- **AEO citation check (the headline KPI).** Monthly, re-test all five engines — **ChatGPT, Claude, Perplexity, Gemini, Copilot** — for the category queries and record which engines mention Oraclous and which channel moved the needle (expect divergence: only ~11% cross-engine domain overlap, per brand-mention-plan §1). Priority queries:
  - "open source AI agent platform"
  - "ReBAC for AI agents"
  - "self-hosted governed agents"
  - plus secondary: "BYOM AI agent platform", "portable manifest for AI agents", "open source LangChain alternative", "what is a second mind (AI)".
- **Entity-graph completeness.** Wikidata item live with `sameAs` web; Organization JSON-LD validates; GitHub/LinkedIn/Crunchbase/G2 identity byte-identical (§5 checklist).
- **Community-mention volume** per platform (Reddit/Quora especially — community mentions correlate ~4× with AI citation likelihood; brand-mention-plan §1). Quality over quantity: organic, on-topic threads.
- **GitHub signals** — stars, issues, MCP-server registry presence (Copilot's source + OSS trust).
- **Engagement depth** (not raw reach) — LinkedIn comment quality from target personas; HN/Show HN discussion substance; saved/shared on technical posts.
- **Blog topical authority** — the 7 posts indexed; featured-snippet/AI-answer capture on the question-shaped H2s and FAQ blocks (the citable answer blocks are built for extraction; geo-citability §3).

> Leading indicator to watch first: does an engine *name Oraclous at all* for "open source AI agent platform / ReBAC for AI agents / self-hosted governed agents"? Until it does, the work is entity-graph + Reddit/GitHub presence, not more posting volume.

---

## 9. Trending-format opportunities (evergreen, on-brand)

Adapt these without diluting the voice (no hype, no exclamation marks):

- **Myth vs reality** — "Self-host = sovereignty" (myth) → what sovereignty actually requires (P2).
- **This vs that** — ReBAC vs RBAC (P1); OHM vs an export button (P5); runtime gate vs approval queue (P1/P4).
- **Hot take (measured)** — "Orchestration is table stakes in 2026; governed, sovereign orchestration is the unsolved problem." (P1; competitive-landscape §6).
- **Show-the-mechanism demo** — provider swap (P3); self-host walkthrough (P5); a Harness pausing at a HITL gate and resuming (P1/P4).
- **"What we left out"** — the honesty close: Portability's stated limits, pre/early status. Punches above its weight with the OSS evaluator + security buyer (voice-and-tone §3).
