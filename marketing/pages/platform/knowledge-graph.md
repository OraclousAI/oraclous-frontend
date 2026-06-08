---
title: Knowledge graph — the second mind that remembers
meta_description: "An AI agent knowledge graph that is your org's memory: multi-modal ingest, ReBAC-bounded retrieval, zero cross-tenant visibility, exportable to Neo4j, RDF, JSON-LD."
url: /platform/knowledge-graph
diagram: knowledge-pipeline
page_type: cluster
primary_persona: Platform builder / developer
primary_query: AI agent knowledge graph memory
secondary_queries: [how the platform stores organisational memory, is retrieval ReBAC-bounded, export knowledge graph, second mind memory]
schema: [BreadcrumbList, FAQPage, TechArticle]
primary_cta: Read the architecture → /developers
secondary_cta: See ReBAC governance → /platform/rebac-governance
---

# How does Oraclous remember?

A queryable, provenance-tracked organisational memory — multi-modal on the way in, ReBAC-bounded on the way out, and yours to export. The [second mind](/glossary/second-mind) that actually remembers.

[Read the architecture →](/platform) [See ReBAC governance →](/platform/rebac-governance)

> *Hero visual (build note): a graph of nodes and relationships scoped inside one `organization_id` boundary — with a second, greyed-out org boundary that has no edge crossing into it.*

## How does Oraclous remember?

A [knowledge graph](/glossary/second-mind) is an organisation's queryable, provenance-tracked memory, stored on the [Substrate](/glossary/substrate) as nodes and relationships — every one scoped by `organization_id`. It is the read/write memory beneath your [Actors](/glossary/actor): the place a [Harness](/glossary/harness) writes what it learned and reads what the organisation already knows.

Two services own the two sides. `knowledge-graph-service` is the **write side** — multi-modal ingestion, schema management, analytics, and ReBAC-graph maintenance. `knowledge-retriever-service` is the **read side** — semantic, full-text, hybrid, graph-traversal, and temporal queries, every one bounded by [ReBAC](/glossary/rebac) and returning the same result envelope with provenance attached.

> **Citable answer — How does Oraclous store organisational memory?** Oraclous stores organisational memory as a knowledge graph — nodes and relationships on the Substrate, each scoped by `organization_id`. The write side ingests text, documents, code, structured, and temporal data; the read side answers semantic, full-text, hybrid, graph-traversal, and temporal queries, all ReBAC-bounded and provenance-tracked. Cross-organisation traversal is structurally impossible.

[What is the second mind? →](/glossary/second-mind) · [What is the Substrate? →](/glossary/substrate) · [See ReBAC governance →](/platform/rebac-governance)

## How does the knowledge graph work?

**Ingestion is multi-modal.** The write side takes in text, documents, structured data, code, and temporal data, builds nodes and relationships, and runs analytics over them — community detection and centrality — so the graph isn't just a store but a map the organisation can reason over. Every write goes through the provenance sink, so each node records where it came from.

**Retrieval is modality-appropriate, and every shape is ReBAC-bounded.** The read side exposes:

- **Semantic search** over vector indexes — meaning, not just keywords.
- **Full-text search** over Lucene-style indexes — exact terms.
- **Hybrid search** — vector retrieval reranked by full-text, for the best of both.
- **Graph-traversal queries** — parameterised and ReBAC-bounded, to follow relationships.
- **Temporal slice queries** — the graph as it was at a point in time.

Every retrieval returns the same `NodeResult` envelope: a node identifier, modality, content, provenance, and retrieval-method metadata. Retrieval is not a back door around governance — the same ReBAC that governs the work governs what each query can see, so an Actor only retrieves what its relationships permit.

**Scoping is the boundary.** Every node, relationship, query, cache entry, and audit log carries an `organization_id` that every query must filter on. That makes **cross-organisation traversal structurally impossible** — not a setting, not a default, but a property of how the Substrate stores data. Within an organisation, [workspaces](/glossary/workspace) are scoped too, and [Federation](/glossary/federation) lets one workspace request another's graph under ReBAC, with those cross-workspace traversals metered and provenance-tracked.

[See knowledge retrieval →](/glossary/knowledge-retrieval) · [How federation works →](/platform/rebac-governance) · [How metering counts traversals →](/platform/metering)

## Why does the knowledge graph matter?

A clever Agent that forgets everything between runs isn't a second mind — it's a session. The knowledge graph is what makes the organisation's combined human and Agent capacity *cumulative*: work feeds memory, memory informs the next work, and every result is traceable to its source. For the **platform builder**, that's a queryable, provenance-tracked substrate you build on instead of rebuilding a vector store and an access layer per project. For the **operations lead**, it's the reason your [Actors](/platform/actors) get better-informed over time rather than starting cold.

And it stays yours. Knowledge-graph data is exportable through standard formats — **Neo4j dumps, RDF, and JSON-LD** — so the memory your organisation accumulates is portable, not trapped. One honest boundary, stated plainly: knowledge-graph data leaves via these standard exports, and the [ReBAC graph](/platform/portability) itself and per-Actor [Consciousness](/glossary/consciousness) records are platform-internal and don't travel with an OHM export. We name that on the [portability page](/platform/portability) so there are no surprises at exit. See the build story on the [developers solution](/solutions/developers).

> **Citable answer — Is the knowledge graph exportable?** Yes. Knowledge-graph data exports through standard formats — Neo4j dumps, RDF, and JSON-LD — so your organisational memory is portable, not locked in. Oraclous states the boundary plainly: graph data leaves via these exports, while the ReBAC access graph and per-Actor Consciousness learning records are platform-internal and do not travel with an OHM export.

## Frequently asked questions

**Q: How does the platform store organisational memory?**
A: As a knowledge graph on the Substrate — nodes and relationships scoped by `organization_id`. The write side ingests text, documents, code, structured, and temporal data and runs analytics over it; the read side answers semantic, full-text, hybrid, graph-traversal, and temporal queries. Every entry carries provenance, so memory is traceable to source.

**Q: Is retrieval ReBAC-bounded?**
A: Yes. Every retrieval shape — semantic, full-text, hybrid, graph-traversal, temporal — is bounded by ReBAC. An Actor retrieves only what its relationships permit. Retrieval is not a path around governance; the same relationship-based access control that governs the work governs what each query can return, and every result carries provenance.

**Q: Can I export the knowledge graph?**
A: Yes, through standard formats: Neo4j dumps, RDF, and JSON-LD. Your organisational memory is portable. The documented limits: the ReBAC access graph and per-Actor Consciousness records are platform-internal and don't travel with an OHM export — Oraclous states this on the portability page rather than in fine print.

**Q: Can one organisation see another's graph?**
A: No — cross-organisation traversal is structurally impossible. Every node, relationship, query, cache entry, and audit log carries an `organization_id` that every query must filter on, so the isolation is a property of how the Substrate stores data, not a permission someone could misconfigure. Federation is cross-workspace within one organisation, never cross-organisation.

**Q: What data types can the graph ingest?**
A: The write side performs multi-modal ingestion of text, documents, structured data, code, and temporal data, with schema management and analytics (community detection, centrality) over what it builds. Each write goes through the provenance sink, so every node records its source.

---
**Internal links:** [/glossary/second-mind](/glossary/second-mind) (first-use), [/glossary/substrate](/glossary/substrate), [/glossary/knowledge-retrieval](/glossary/knowledge-retrieval), [/glossary/rebac](/glossary/rebac), [/glossary/consciousness](/glossary/consciousness), [/glossary/federation](/glossary/federation), [/glossary/workspace](/glossary/workspace), [/glossary/actor](/glossary/actor); Related capabilities: [/platform/actors](/platform/actors) (the "second mind remembers" pair), [/platform/rebac-governance](/platform/rebac-governance); plus [/platform/portability](/platform/portability), [/platform/metering](/platform/metering); Solutions: [/solutions/developers](/solutions/developers), [/solutions/operations](/solutions/operations); up-link [/platform](/platform).
**Notes for build:** Breadcrumb Home › Platform › Knowledge graph; BreadcrumbList + FAQPage + TechArticle JSON-LD; reference DefinedTerm /glossary/second-mind (and knowledge-retrieval) via link. Title row labels this "Knowledge graph & retrieval" in the hub grid — the page covers both write (knowledge-graph-service) and read (knowledge-retriever-service) sides. Export formats (Neo4j/RDF/JSON-LD) and the portability boundary are grounded in §7; keep in sync with /platform/portability.
