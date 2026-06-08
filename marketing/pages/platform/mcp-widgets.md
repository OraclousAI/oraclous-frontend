---
title: MCP & widgets — connect both ways, embed anywhere
meta_description: Oraclous is an MCP server and an MCP client, plus embeddable widgets — connect to Claude Desktop and Cursor, import external tools, and publish Agents into your product.
url: /platform/mcp-widgets
diagram: mcp-bridge
page_type: cluster
primary_persona: Platform builder / developer
primary_query: MCP-compatible agent platform
secondary_queries: [MCP server and client, embed AI agent in my product, connect Oraclous to Claude Desktop Cursor, import external tools into agent platform]
schema: [BreadcrumbList, FAQPage, TechArticle]
primary_cta: Connect via MCP → /developers
secondary_cta: See the architecture → /developers
---

# MCP & widgets — connect both ways, embed anywhere

Oraclous treats [MCP](/glossary/mcp) — the Model Context Protocol — as first-class in *both* directions: an MCP **server** that exposes your workspace [capabilities](/glossary/capability) to external clients, and an MCP **client** that imports external tools into the platform. Plus embeddable widgets that publish your [Agents](/glossary/agent) into your own product — without bypassing governance.

[Connect via MCP →](/platform) [See the architecture →](/platform)

> *Hero visual (build note): a two-headed arrow through the Application Gateway — left head "Oraclous as MCP server → Claude Desktop / Cursor / Continue", right head "external MCP tools → Capability Registry as OHM" — with an embed widget docked into a customer host page below.*

## Does Oraclous support MCP?

Yes — both ways. MCP (Model Context Protocol) is the open standard for connecting AI systems to tools and context. As an **MCP server**, Oraclous exposes your workspace capabilities through the [Application Gateway](/glossary/application-gateway) to any MCP-compatible client — Claude Desktop, Cursor, Continue — and the surface each client sees is determined by [ReBAC](/glossary/rebac), so connecting an external client never widens access. As an **MCP client**, Oraclous consumes external MCP servers and brings their tools into the [Capability Registry](/glossary/capability-registry) as native [OHM](/glossary/ohm) tools — once imported, they're first-class capabilities like any other.

> **Citable answer — Is Oraclous an MCP server or client?** Both. Oraclous is an MCP server — it exposes ReBAC-scoped workspace capabilities through the Application Gateway to clients like Claude Desktop, Cursor, and Continue — and an MCP client — it consumes external MCP servers and imports their tools into the Capability Registry as native OHM tools. MCP is the open standard for connecting AI systems to tools.

[What is MCP? →](/glossary/mcp) · [What is a Capability? →](/glossary/capability)

## How does MCP & widgets work?

**Outbound (Oraclous as MCP server).** The Application Gateway publishes an MCP server endpoint. An MCP client authenticates and sees exactly the capabilities ReBAC permits it — no more. Because the visible surface is computed from relationships, not handed out as a static key scope, the same governance that runs the work also bounds what an external client can reach. Your Agents and tools become usable from Claude Desktop or Cursor without leaving your policy envelope.

**Inbound (Oraclous as MCP client).** The Capability Registry owns the inbound adapters that translate external formats into OHM. The MCP tool adapter maps an external MCP tool definition to an OHM tool; alongside it sit a SKILL.md adapter and an OpenAPI 3.x adapter (one OHM tool per operation). Whatever the source, the result is a uniform [capability](/glossary/capability) descriptor — so an imported MCP tool, a SKILL, and a hand-built tool are governed, versioned, and invoked identically.

**Embeddable widgets.** The Application Gateway also publishes Agents as embeddable widgets and integration keys, with slug-based routing, key validation, and rate limits. A widget renders inside your own product or marketing site and reaches the work through the gateway — and only the gateway. Per the frontend's widget contract, a widget stays inside its own root: it does not read or modify the host page's DOM, does not reach into `window.parent`/`window.top` beyond a `postMessage` to a configured origin, scopes its own styles, and calls nothing but the configured gateway endpoint. Embedding Oraclous never pollutes the host page or routes around governance.

## Why does MCP & widgets matter?

For a [platform builder](/solutions/developers), interop both ways is the difference between a walled garden and a citizen of your toolchain. Outbound MCP means your team can drive Oraclous capabilities from the editor and desktop clients they already live in. Inbound MCP means you adopt the growing ecosystem of MCP tools without writing per-tool glue — they land in the registry as governed OHM capabilities. Widgets mean the work reaches your customers inside your own product surface. In every direction the boundary holds: ReBAC scopes the server, the registry normalises imports, and widgets are sandboxed — interop without giving up control.

MCP & widgets is the connective tissue of the openness story. It sits beside [BYOM](/platform/byom) — bring the model you choose — and [Portability](/platform/portability) — leave the platform without re-implementing — so your models, your tools, and your work are each independently open.

## Frequently asked questions

**Q: Is Oraclous an MCP server or client?**
A: Both. As an MCP server it exposes ReBAC-scoped workspace capabilities through the Application Gateway to clients like Claude Desktop and Cursor. As an MCP client it consumes external MCP servers and imports their tools into the Capability Registry as native OHM tools. The two directions are independent and both first-class.

**Q: Can I embed Oraclous in my product?**
A: Yes. The Application Gateway publishes Agents as embeddable widgets with slug-based routing, key validation, and rate limits. A widget renders inside its own root in your host page, scopes its own styles, talks only to the configured gateway endpoint, and never reads or modifies the host DOM beyond a postMessage to a configured origin.

**Q: Which MCP clients work — Claude Desktop, Cursor, Continue?**
A: Any MCP-compatible client. Oraclous exposes a standard MCP server through the Application Gateway, so clients such as Claude Desktop, Cursor, and Continue connect to it directly. What each client can see is determined by ReBAC, so connecting a client never widens access beyond the relationships you've granted.

**Q: How do external tools become Oraclous capabilities?**
A: Through the Capability Registry's inbound adapters, which translate external formats into OHM. The MCP tool adapter maps an MCP tool definition to an OHM tool; SKILL.md and OpenAPI 3.x adapters do the same for those formats. Imported tools become uniform capability descriptors — governed, versioned, and invoked exactly like native ones.

---
**Internal links:** [/glossary/mcp](/glossary/mcp) (first-use term · primary definition), [/glossary/capability](/glossary/capability), [/glossary/agent](/glossary/agent), [/glossary/ohm](/glossary/ohm), [/glossary/rebac](/glossary/rebac), [/glossary/application-gateway](/glossary/application-gateway), [/glossary/capability-registry](/glossary/capability-registry); Solution: [/solutions/developers](/solutions/developers); sibling capabilities (openness/interop triangle, internal-linking §2.1): [/platform/byom](/platform/byom), [/platform/portability](/platform/portability); up-link [/platform](/platform); ReBAC control claim → [/security](/security) per internal-linking §6.5; "connect / read the code" → [/developers](/platform); console (published widget) → /how-it-works (followed).
**Notes for build:** `TechArticle` + `FAQPage` + `BreadcrumbList` JSON-LD; breadcrumb Home › Platform › MCP & widgets. Link `/glossary/mcp` (DefinedTerm) rather than restating the canonical definition as schema. Source: §7 portability story (MCP server/client, inbound adapters SKILL.md/MCP/OpenAPI 3.x), application-gateway-service (MCP server + client, published agents + embeddable widgets, slug routing + rate limits), capability-registry-service (inbound adapters → OHM, MCP tool importer, uniform descriptor), frontend CLAUDE.md §1.6 (widget host-respect invariants). Keep the widget host-respect list factual; it's the credibility hook for developers.
