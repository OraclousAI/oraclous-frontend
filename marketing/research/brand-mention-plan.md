# Off-Site Brand-Authority & Entity-Consistency Plan (GEO)

*Research artifact for Oraclous marketing. Compiled June 2026. This is an **actionable checklist**, not theory. External facts cite source URLs; anything I could not verify is marked **(unverified)**.*

**Why this plan exists:** in 2026, AI answer engines cite **brand mentions on community + reference sites far more than backlinks**, and each engine favours different sources. Winning AI visibility = being present, consistently, on the specific platforms each engine trusts.

---

## 1. The evidence: where AI engines actually source

- **Reddit is the single most-cited source** across generative answers — ~40% of citations in one 150k-citation analysis, and ~40% in the 680M-citation AI Platform Citation Source Index 2026. ([cmswire.com](https://www.cmswire.com/digital-marketing/reddits-rise-in-ai-citations-what-marketers-must-know-about-aeo-strategy/), [prnewswire.com](https://www.prnewswire.com/news-releases/5w-releases-ai-platform-citation-source-index-2026-the-50-websites-that-now-decide-what-brands-are-visible-inside-chatgpt-claude-perplexity-gemini-and-google-ai-overviews-302759804.html))
- **Domains with millions of Reddit/Quora brand mentions are ~4× more likely to be cited** by AI than those with minimal community activity. ([hashmeta.com](https://hashmeta.com/blog/why-reddit-dominates-ai-citations-and-how-to-get-your-brand-featured-there/))
- **ChatGPT:** Wikipedia (13.15%) + Reddit (11.97%) = >25% of US citations; legacy outlets (WSJ/NYT/Bloomberg) don't even crack the top 20. ([prnewswire.com](https://www.prnewswire.com/news-releases/wikipedia-and-reddit-now-drive-over-25-of-chatgpt-citations-in-the-us-new-5w-research-finds--wsj-nyt-and-bloomberg-do-not-appear-in-the-top-20-302768339.html))
- **Perplexity:** Reddit-led (~6.6%), skews to **LinkedIn, NIH, G2**. ([tryprofound.com](https://www.tryprofound.com/blog/ai-platform-citation-patterns))
- **Gemini / Google AI:** connected to Google Search + **Knowledge Graph + YouTube**; Google ships Gemini into Search and YouTube. ([medium.com](https://medium.com/@codebykrishna/everything-google-announced-in-ai-at-i-o-2026-gemini-agents-search-youtube-and-more-a8c2aac5c29a))
- **Copilot:** **Bing-index based** + pulls from **GitHub** and the Microsoft ecosystem. ([cloudwards.net](https://www.cloudwards.net/copilot-vs-gemini/), [neuronad.com](https://neuronad.com/copilot-vs-gemini/))
- **LinkedIn is the #1 most-cited domain for professional queries across every major engine** (325k-prompt analysis). ([almcorp.com](https://almcorp.com/blog/linkedin-ai-search-citations-2026/))
- **Claude** preferentially cites high-credibility legacy journalism + reference sites. ([tryprofound.com](https://www.tryprofound.com/blog/ai-platform-citation-patterns))
- **Cross-platform overlap is tiny — only ~11% of domains are cited by both ChatGPT and Perplexity.** No single channel wins; presence must be multi-platform. ([tryprofound.com](https://www.tryprofound.com/blog/ai-platform-citation-patterns))

**Implication:** prioritise **Reddit + Wikidata/Wikipedia + LinkedIn + GitHub + YouTube + G2** — that set covers all four target engines.

---

## 2. Priority-ordered platform plan (per-engine rationale)

### P0 — Do first (highest citation leverage, lowest barrier)

**1. Wikidata item** → feeds **Gemini / Google Knowledge Graph**
- Why: machine-readable entity hub; low notability bar — needs only **verifiable existence** with serious public references, not Wikipedia-grade fame. ([wikidata.org/wiki/Wikidata:Notability](https://www.wikidata.org/wiki/Wikidata:Notability))
- Checklist:
  - [ ] Create item: label = `Oraclous`; one factual description sentence; `instance of` (software/company); `official website`; `country`. Add detail incrementally — don't overload. ([mlforseo.com](https://www.mlforseo.com/knowledge-graph-strategy/wikidata-for-brands-notability-criteria-and-a-realistic-path/))
  - [ ] Add identifiers: GitHub, Crunchbase, LinkedIn, official site (these become the `sameAs` web).

**2. GitHub org + flagship repo** → feeds **Copilot** + open-source trust
- Why: Copilot pulls from GitHub; GitHub is the credibility anchor for an open-source platform. ([neuronad.com](https://neuronad.com/copilot-vs-gemini/))
- Checklist:
  - [ ] Public org `OraclousAI`; pinned flagship repo with a strong README (what/why/quickstart/links).
  - [ ] README states the canonical one-liner + links to site, docs, Glossary, Discord.
  - [ ] Topics/tags: `agentic-ai`, `multi-agent`, `ai-agents`, `rebac`, `mcp`, `byom`, `self-hosted`, `data-sovereignty`, `open-source`.
  - [ ] Publish an **MCP server** to the public MCP registry (500+ servers exist; presence = MCP-entity association). ([en.wikipedia.org/wiki/Model_Context_Protocol](https://en.wikipedia.org/wiki/Model_Context_Protocol))

**3. LinkedIn company page** → feeds **all engines** (esp. Perplexity, Copilot)
- Why: #1 cited domain for professional queries across every platform. ([almcorp.com](https://almcorp.com/blog/linkedin-ai-search-citations-2026/))
- Checklist:
  - [ ] Complete page; identical name/description/logo/URL (see §5).
  - [ ] Founders post consistently on agentic AI, ReBAC, sovereignty (entity reinforcement).

**4. Crunchbase** → canonical company facts for many indexes
- [ ] Claim profile; category = AI agent / agentic AI platform; founders, funding, HQ, website — all matching §5.

### P1 — Next (community + review presence; the Reddit engine)

**5. Reddit presence** → feeds **ChatGPT + Perplexity** (the biggest single lever)
- Why: ~40% of all AI citations; community mentions ~4× citation likelihood. ([cmswire.com](https://www.cmswire.com/digital-marketing/reddits-rise-in-ai-citations-what-marketers-must-know-about-aeo-strategy/), [hashmeta.com](https://hashmeta.com/blog/why-reddit-dominates-ai-citations-and-how-to-get-your-brand-featured-there/))
- **Rule:** authentic participation only — answer questions, share builds, never spam. Reddit punishes promotion; AI engines cite *organic* threads.
- Target subreddits (verify subscriber counts + rules before posting — **(communities unverified individually; validate each)**):
  - [ ] r/AI_Agents — core audience for agent builders ([thehiveindex.com](https://thehiveindex.com/topics/ai-agents/platform/reddit/))
  - [ ] r/LocalLLaMA — self-host + BYOM + local-model crowd (strong sovereignty fit)
  - [ ] r/selfhosted — self-host + data-control buyer
  - [ ] r/LangChain, r/CrewAI / framework subs — "alternative" discovery
  - [ ] r/MachineLearning, r/artificial — broader category
  - [ ] r/devops, r/sysadmin — IT/platform-engineering persona
  - [ ] r/opensource — open-source positioning
- Also: **Quora** (pairs with Reddit in the ~4× community-mention finding) — answer ReBAC / self-hosted-agent / BYOM questions. ([hashmeta.com](https://hashmeta.com/blog/why-reddit-dominates-ai-citations-and-how-to-get-your-brand-featured-there/))

**6. G2 (+ category review sites)** → feeds **Perplexity**
- [ ] Claim G2 listing in AI agent / orchestration category; seed early reviews; keep description matching §5. ([tryprofound.com](https://www.tryprofound.com/blog/ai-platform-citation-patterns))

**7. Product Hunt + Show HN (Hacker News)** → launch-surface + developer entity signal
- [ ] Product Hunt launch with the canonical one-liner + open-source/sovereignty hook.
- [ ] **Show HN** post — HN discussions are frequently indexed/cited and reach the exact technical buyer. **(citation weight unverified, but high-value reach.)**

### P2 — Earn over time (high bar, high payoff)

**8. YouTube channel** → feeds **Gemini / Google AI**
- Why: Gemini integrates YouTube deeply; YouTube is a top-3 AI citation source (~23.5% in one analysis). ([medium.com](https://medium.com/@codebykrishna/everything-google-announced-in-ai-at-i-o-2026-gemini-agents-search-youtube-and-more-a8c2aac5c29a))
- [ ] Channel with: explainer ("What is ReBAC / agentic governance"), product demos, "self-host Oraclous in X min", conference talks. Title/describe with target entities.

**9. Wikipedia article** → feeds **ChatGPT (top source)** + Knowledge Graph
- Why: Wikipedia is ChatGPT's single largest source (13.15%). ([prnewswire.com](https://www.prnewswire.com/news-releases/wikipedia-and-reddit-now-drive-over-25-of-chatgpt-citations-in-the-us-new-5w-research-finds--wsj-nyt-and-bloomberg-do-not-appear-in-the-top-20-302768339.html))
- **But the bar is high** — see §3. Do NOT attempt prematurely; a deletion hurts.

---

## 3. Wikidata / Wikipedia eligibility assessment

| | **Wikidata** | **Wikipedia** |
|---|---|---|
| Bar | Low — **verifiable existence** + serious public references, OR a structural need, OR a sitelink. ([wikidata.org/wiki/Wikidata:Notability](https://www.wikidata.org/wiki/Wikidata:Notability)) | High — **significant coverage in multiple reliable, independent secondary sources**. ([en.wikipedia.org/wiki/Wikipedia:Notability_(organizations_and_companies)](https://en.wikipedia.org/wiki/Wikipedia:Notability_(organizations_and_companies))) |
| Oraclous eligibility now | **Eligible now** — create immediately. | **Not yet** — funding announcements ≠ notability; needs years of independent feature coverage. ([luminodigital.com](https://www.luminodigital.com/blog/can-a-tech-startup-get-a-wikipedia-page)) |
| Action | [ ] Create Wikidata item this quarter (P0). | [ ] Track press; attempt only after several independent **feature** articles (not funding blurbs, not interviews) exist. Hold as P2. |

**Path to earn Wikipedia notability:** secure independent feature coverage (trade press analysing Oraclous as the *subject*, not a list mention), conference talks, analyst mentions. Then a neutral, well-sourced draft — never auto-promotional.

---

## 4. GitHub / Show HN / Product Hunt launch-surface note

- **GitHub is the foundation** for an open-source platform: it is Copilot's source, a developer trust signal, and a Wikidata identifier. Treat the README as a landing page (canonical one-liner, quickstart, links). Maintain a public MCP server + stars/activity as living proof.
- **Show HN (Hacker News):** the highest-signal developer launch. A strong Show HN reaches platform engineers/CTOs (the dev-buyer), generates organic discussion, and often gets indexed. Pair with the open-source repo. Engage genuinely in comments.
- **Product Hunt:** broader-reach launch surface + an entity/`sameAs` node. Coordinate same-week with Show HN and a Reddit/community presence so the engines see consistent signals.
- **Sequencing:** Wikidata + GitHub + LinkedIn + Crunchbase live **before** the Show HN / Product Hunt launch, so the entity graph already resolves when launch-day traffic and citations spike.

---

## 5. Entity-consistency (`sameAs`) checklist — keep IDENTICAL everywhere

*Inconsistency across profiles confuses entity resolution and weakens every citation. Lock these once and copy byte-for-byte.*

- [ ] **Canonical name:** `Oraclous` (exact casing; never "OraclousAI" in prose except the GitHub org handle — note the divergence and standardise the public-facing name to `Oraclous`).
- [ ] **One-line description:** one approved sentence (e.g. "Oraclous is an open-source platform for forming an organisation's second mind — a governed fabric where human Operators and AI Agents work side by side under the organisation's own ReBAC rules.") — used identically on site, LinkedIn, Crunchbase, G2, GitHub, Product Hunt, Wikidata description.
- [ ] **Logo:** same file/version everywhere.
- [ ] **Canonical URL:** one primary domain; same trailing-slash convention.
- [ ] **Category:** "agentic AI / multi-agent orchestration platform" consistently.
- [ ] **Founders' names + titles:** identical on Crunchbase, LinkedIn, Wikidata.
- [ ] **Founding year + HQ:** identical everywhere.
- [ ] **`sameAs` array in Organization JSON-LD on the website** linking to: Wikidata item, GitHub org, LinkedIn page, Crunchbase, Product Hunt, G2, YouTube. (This is the schema that tells engines all profiles = one entity.)
- [ ] **Proprietary vocabulary spelled identically** in all public copy: Harness, OHM (Oraclous Harness Manifest), ReBAC (never RBAC), BYOM, Operator, Agent, Capability, Consciousness, Portability — so engines learn them as stable Oraclous entities.
- [ ] **Handles:** reserve the same handle (`oraclous` / `OraclousAI`) on Reddit, X, LinkedIn, GitHub, Product Hunt, YouTube, Discord — and record which exact handle is canonical.

---

## 6. Quick-start sequence (first 30/60/90)

- **First 30 days (P0):** Wikidata item · GitHub org + README + MCP server · LinkedIn page · Crunchbase · publish Organization JSON-LD with `sameAs` · lock the §5 identity doc.
- **31–60 (P1):** begin authentic Reddit/Quora participation in §2.5 communities · claim G2 · prep Show HN + Product Hunt assets.
- **61–90 (P1→P2):** coordinated Show HN + Product Hunt launch · start YouTube channel (explainers + demos) · begin earning independent press toward the eventual Wikipedia case.

**Measurement:** track brand mentions per platform and AI-citation visibility (which engines mention Oraclous for category queries). Re-test ChatGPT/Perplexity/Gemini/Copilot monthly for "open source AI agent platform / self-hosted governed agents / ReBAC for AI agents" and watch which channel moves the needle — given only ~11% cross-engine domain overlap, expect different channels to drive different engines. ([tryprofound.com](https://www.tryprofound.com/blog/ai-platform-citation-patterns))
