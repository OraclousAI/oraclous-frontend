# Page Structures — Utility & conversion pages (Security · Open-source · Developers · Pricing · About)

> Blueprint — structure + intent + target queries, **not** finished copy. These five are individually specified (they don't share a template). Grounded in positioning, the per-capability matrix, personas, and keyword-map Pillars B/C/E/I. Each carries the three AEO hooks (citable block, FAQ, schema set).

---

# 1 — Security & data sovereignty (`/security`)

Type: **Pillar** (trust hub). Persona: **C (Security/compliance) + E (Federation)**. Primary target query: *data sovereignty AI / sovereign AI platform*. The one job: **make control provable — structural isolation + your keys.** This is the public trust page the positioning §7 names as a high-value asset; it consolidates §2/§6/ADR-008 + the policy-set taxonomy.

## Wireframe
- **H1:** "Security & data sovereignty at Oraclous" — control you can prove.
- **Hero:** "Cross-org data flow isn't restricted. It's impossible." Subhead: self-host or cloud, identical guarantees, your keys.
- **Citable answer block — H2:** "How does Oraclous keep our data sovereign?" → liftable: Every record carries an organization_id so cross-organisation data flow is structurally impossible; credentials never leave the broker in plaintext; in cloud mode KMS separation means Oraclous staff cannot decrypt customer state. Links: `/glossary/data-sovereignty`, `/glossary/rebac`.
- **§ Isolation — H2:** "How is one organisation isolated from another?" → organization_id everywhere; cross-org impossible. Link: `/why-oraclous/data-sovereignty`.
- **§ Access control — H2:** "How do you control what an AI agent can access?" → ReBAC, five versioned policy sets, capability allocation. Links: `/platform/rebac-governance`, `/glossary/rebac`.
- **§ Keys & credentials — H2:** "Who holds the encryption keys?" → credential broker, KMS separation, customer-controlled key material. Link: `/platform/byom`.
- **§ Audit & provenance — H2:** "What can auditors see?" → provenance sink, audit level + retention per policy set, metering. Links: `/platform/metering`, `/why-oraclous/agent-governance-audit`.
- **§ Hosting & compliance — H2:** "Is the hosted mode compliant?" → ISO 27001 + SOC 2 Type II for hosting; debugging with customer participation; lower-isolation is an explicit audited opt-in (ADR-008). No invented certs beyond these.
- **§ Self-host / air-gapped — H2:** "Can we run it air-gapped or on-premise?" → self-host path. Links: `/open-source`, `/solutions/regulated`.
- **§ Exit — H2:** "What happens to our data when we leave?" → OHM export + honest limits. Link: `/platform/portability`.
- **FAQ — H2:** How do you control what an AI agent can access? · Can hosted vendors see my data? · Can AI agents run air-gapped / on-premise? · Is there a HIPAA / SOC 2 AI agent platform? · What is the most secure AI agent platform for regulated industries?
- **CTA band:** Review the trust model (docs) / Book a security walkthrough.

## JSON-LD: `WebPage` + `FAQPage` + `BreadcrumbList` (+ `Organization` reference for compliance/`hasCredential` if modelled).
## CTAs: Primary — Review the trust model. Secondary — Book a security walkthrough.
## Key links out: `/platform/rebac-governance` · `/platform/byom` · `/platform/metering` · `/platform/portability` · `/why-oraclous/data-sovereignty` · `/why-oraclous/agent-governance-audit` · `/solutions/regulated` · `/open-source` · Glossary: rebac, data-sovereignty, byom, ohm.

---

# 2 — Open source (`/open-source`)

Type: **Pillar** (OSS hub). Persona: **F (OSS evaluator) + B (Platform builder)**. Primary target query: *open source AI agent platform*. The one job: **prove the open source is real, honest, and self-hostable.**

## Wireframe
- **H1:** "Oraclous is open source — read the code, the ADRs, and the trade-offs."
- **Hero:** "Open source is the proof, not the product gap." Subhead: platform-as-code, inspectable, forkable, self-hostable.
- **Citable answer block — H2:** "Is Oraclous open source and free?" → liftable: Oraclous is an open-source agentic operations platform; the platform itself is code, versioned by normal engineering practice, so you can read the architecture, the ADRs, and the documented trade-offs, and self-host with no vendor in the loop. Links: `/glossary/platform-as-code`, GitHub (external).
- **§ What's open — H2:** "What exactly is open source?" → platform-as-code, the runtime, the manifest format (OHM). Links: `/platform/harness-model`, `/platform/portability`.
- **§ Self-host — H2:** "Can you self-host AI agents?" → self-host path, Docker/Kubernetes pointer. Links: `/developers`, `/security`.
- **§ Honesty — H2:** "What does Oraclous deliberately leave out?" → links to the documented deferred scope + portability limits (the honesty differentiator for persona F). Link: `/platform/portability`.
- **§ ADRs & architecture — H2:** "How are decisions documented?" → ADR record (status, date, approver). Link: `/developers`.
- **§ Self-host vs cloud — H2:** "Do I have to self-host?" → it's the option, not the obligation; cloud carries identical guarantees. Links: `/pricing`, `/security`.
- **FAQ — H2:** Is the open source the whole platform or a teaser? · Can you self-host AI agents? · How do I self-host with Docker / Kubernetes? · Is it maintained? · What's the license?
- **CTA band:** Read the code on GitHub (external) / Start free (self-host).

## JSON-LD: `WebPage` + `FAQPage` + `BreadcrumbList` (+ `SoftwareSourceCode` referencing the repo, with `codeRepository`).
## CTAs: Primary — Read the code on GitHub. Secondary — Start free (self-host).
## Key links out: GitHub ↗ · `/developers` · `/platform/portability` · `/platform/harness-model` · `/security` · `/pricing` · `/why-oraclous/closed-saas-lock-in` · Glossary: platform-as-code, portability, ohm.

---

# 3 — Developers (`/developers`)

Type: **Pillar** (dev front door). Persona: **B (Platform builder) + D (Multi-model)**. Primary target query: *MCP-compatible agent platform* / *build AI agents*. The one job: **give builders the architecture, ADRs, and the BYOM/MCP path.**

## Wireframe
- **H1:** "Build on Oraclous" — compose Capabilities, don't wire plumbing.
- **Hero:** "Governance, identity, audit — already in the substrate." Subhead: build on Capabilities, stay portable through OHM.
- **Citable answer block — H2:** "What do developers build on Oraclous?" → liftable: Developers compose Capabilities (Tools, Skills, Agents, Harnesses, Human roles) on a substrate that already provides ReBAC, the credential broker, provenance, and metering — instead of re-implementing security per project — and keep everything portable through OHM and interoperable through MCP. Links: `/glossary/capability`, `/glossary/mcp`.
- **§ Architecture & ADRs — H2:** "Where do I read the architecture?" → ADRs, services-reference, GitHub. Links: `/open-source`, GitHub ↗.
- **§ Capabilities — H2:** "What is a Capability and how do I add one?" → one descriptor model, five kinds, the importer. Links: `/platform/harness-model`, `/glossary/capability`.
- **§ MCP — H2:** "Does Oraclous support MCP (server and client)?" → MCP server + client; import external tools as OHM; Claude Desktop / Cursor / Continue. Links: `/platform/mcp-widgets`, `/glossary/mcp`.
- **§ BYOM — H2:** "Can I use my own model (Claude / GPT / Gemini / local)?" → three protocol shapes, config resolution. Links: `/platform/byom`, `/glossary/byom`.
- **§ Self-host quickstart — H2:** "How do I run it locally?" → quickstart pointer (Docker/Kubernetes). Link: `/open-source`.
- **§ Portability — H2:** "Can I export and leave?" → OHM. Link: `/platform/portability`.
- **FAQ — H2:** Which agent platforms support MCP? · How do I build an MCP server? · Can I run agents with local models / Ollama? · How do I self-host with Docker/Kubernetes? · Is this just another framework?
- **CTA band:** Read the architecture / Read the code on GitHub.

## JSON-LD: `WebPage` + `FAQPage` + `BreadcrumbList` (+ `TechArticle` if doc-heavy; `SoftwareSourceCode` link).
## CTAs: Primary — Read the architecture. Secondary — Read the code on GitHub.
## Key links out: `/platform/mcp-widgets` · `/platform/byom` · `/platform/harness-model` · `/platform/portability` · `/open-source` · `/solutions/developers` · `/why-oraclous/framework-wiring-overhead` · GitHub ↗ · Glossary: mcp, byom, capability, ohm.

---

# 4 — Pricing (`/pricing`)

Type: **Conversion**. Persona: **A (Operations) + C (Security) + F (OSS)**. Primary target query: *AI agent platform pricing*. The one job: **explain free self-host vs cloud-hosted and reduce buying risk.**

## Wireframe
- **H1:** "Pricing" — open-source free to self-host; cloud-hosted when you want it off your plate.
- **Hero:** "Self-host free. Cloud-hosted with identical guarantees." Subhead: you choose support model and isolation tier; you're never forced into either.
- **Citable answer block — H2:** "How much does Oraclous cost?" → liftable: Oraclous is open source and free to self-host; the cloud-hosted mode is the paid option and carries identical data-sovereignty guarantees (your keys). Metering measures consumption neutrally — Oraclous's pricing is separate from measurement. (No invented numbers — state the model, not unverified figures.) Links: `/open-source`, `/glossary/data-sovereignty`.
- **§ Tiers — H2:** "What's free and what's paid?" → self-host (free) vs cloud-hosted (paid) comparison table. Links: `/open-source`, `/security`.
- **§ Metering — H2:** "How is usage measured?" → metering tracks tokens, tool calls, storage, time, traversals; metering does not set prices. Link: `/platform/metering`.
- **§ What you get either way — H2:** "Do guarantees differ by tier?" → identical sovereignty guarantees; ISO 27001 + SOC 2 Type II behind hosting. Link: `/security`.
- **FAQ — H2:** Is the open-source version free? · What does the cloud-hosted mode cost? · How is usage metered? · Is there per-agent pricing? · Do guarantees differ between self-host and cloud?
- **CTA band:** Start free (self-host → `app.oraclous.com` / GitHub) / Talk to us about hosting.

## JSON-LD: `WebPage` + `FAQPage` + `BreadcrumbList` (+ `Product`/`Offer` for the tiers — model only what is real, no fabricated prices).
## CTAs: Primary — Start free (self-host). Secondary — Talk to us about hosting.
## Key links out: `/open-source` · `/security` · `/platform/metering` · `/glossary/data-sovereignty`.

---

# 5 — About (`/about`)

Type: **Utility**. Persona: **All**. Primary target query: *Oraclous (company)* (navigational). The one job: **establish org identity, mission, and the honesty stance** — and feed the `Organization` entity (Wikidata/GitHub/LinkedIn/Crunchbase `sameAs`).

## Wireframe
- **H1:** "About Oraclous."
- **Hero:** the mission — form the organisation's second mind; open, sovereign, honest.
- **Citable answer block — H2:** "What is Oraclous (the company)?" → liftable: Oraclous builds an open-source agentic operations platform — a "second mind" where humans and AI Agents work as one governed fabric under an organisation's own access rules. (This block is the canonical org description; keep it byte-consistent with the `sameAs` profiles per keyword-map §4.) Link: `/glossary/second-mind`.
- **§ Mission / thesis — H2:** "Why does Oraclous exist?" → the second-mind thesis, the three-bad-choices problem. Link: `/why-oraclous`.
- **§ How we build — H2:** "How does Oraclous work as a company?" → open source, honest docs, platform-as-code. Links: `/open-source`, `/glossary/platform-as-code`.
- **§ Honesty stance — H2:** "What do you not claim?" → no invented metrics/logos; pre/early; trade-offs in writing (the credibility asset). 
- **§ Contact / community — H2:** "How do I get involved?" → GitHub, community, contact.
- **FAQ — H2:** What is Oraclous? · Is Oraclous open source? · Who is Oraclous for? · How do I contact / contribute?
- **CTA band:** Read the architecture / Read the code on GitHub.

## JSON-LD: `Organization` (full: name, logo, url, `sameAs` [GitHub, LinkedIn, Crunchbase, Wikidata, Product Hunt, G2], `description` byte-identical to the citable block) + `AboutPage` + `FAQPage` + `BreadcrumbList`.
## CTAs: Primary — Read the architecture. Secondary — Read the code on GitHub.
## Key links out: `/why-oraclous` · `/open-source` · `/platform` · GitHub ↗ · LinkedIn ↗ · Glossary: second-mind, platform-as-code.

> Note: the canonical `Organization` description and `sameAs` array live here and on Home — keep them identical (keyword-map §4 entity-consistency rule).
