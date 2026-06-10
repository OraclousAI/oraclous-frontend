// Adapts the gateway subgraph payload (@oraclous/api-client Subgraph) onto the explorer's
// OGData model. Rewritten from the legacy explorerAdapter.ts for the new wire shape (§8 —
// the shape comes from the typed client, never re-declared locally).
//
// Wire realities this compensates for, all derived client-side and honestly defaulted:
// - nodes carry no display label → derive from properties (name → title → label → text → type);
// - no degree on the wire → counted from the (deduped, undirected) edge list;
// - no edge id/weight → id synthesised from the unordered endpoint+type key, weight 1;
// - no community field → communities derive from the node TYPE (stable, meaningful grouping
//   for the cluster layout and depth banding); pagerank/betweenness render only when a
//   numeric property of that name exists (never fabricated).
import type { GraphEdge, GraphNode } from '@oraclous/api-client';
import type { OGCommunity, OGData, OGEdge, OGNode, OGType } from './explorerTypes.js';

// Unordered key: the renderer draws undirected lines, and /neighbors is undirected — so a base
// edge B→A and an expand-synthesized A→B of the same type are the same edge.
export const edgeKey = (e: GraphEdge): string => {
  const [a, b] = e.source <= e.target ? [e.source, e.target] : [e.target, e.source];
  return `${a}|${b}|${e.type}`;
};

// A human-readable node label from the property bag.
function nodeLabel(node: GraphNode): string {
  const p = node.properties;
  for (const key of ['name', 'title', 'label', 'text']) {
    const v = p[key];
    if (typeof v === 'string' && v.trim() !== '') {
      return v.length > 48 ? `${v.slice(0, 48)}…` : v;
    }
  }
  return node.type;
}

function numericProp(p: Readonly<Record<string, unknown>>, key: string): number {
  const v = p[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function coord(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  // Ingested coordinates frequently arrive JSON-stringified.
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function geoOf(p: Readonly<Record<string, unknown>>): { lat: number; lng: number } | undefined {
  const lat = coord(p['lat'] ?? p['latitude']);
  const lng = coord(p['lng'] ?? p['longitude']);
  if (lat !== null && lng !== null) return { lat, lng };
  return undefined;
}

export function adaptSubgraph(nodes: readonly GraphNode[], edges: readonly GraphEdge[]): OGData {
  // Dedupe edges on the unordered key and keep only edges with both endpoints present.
  const nodeIds = new Set(nodes.map((n) => n.id));
  const byKey = new Map<string, GraphEdge>();
  for (const e of edges) {
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) continue;
    const k = edgeKey(e);
    if (!byKey.has(k)) byKey.set(k, e);
  }

  const degree = new Map<string, number>();
  for (const e of byKey.values()) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }

  // Communities = node types (sorted for stability). The cluster layout and the 3D depth
  // banding then group by type, which is the most meaningful structure the wire provides.
  const typeNames = [...new Set(nodes.map((n) => n.type || 'Entity'))].sort();
  const communityOf = new Map(typeNames.map((t, i) => [t, i]));

  const ogNodes: OGNode[] = nodes.map((n) => {
    const type = n.type || 'Entity';
    const geo = geoOf(n.properties);
    return {
      id: n.id,
      type,
      name: nodeLabel(n),
      community: communityOf.get(type) ?? 0,
      score: 0,
      degree: degree.get(n.id) ?? 0,
      pagerank: numericProp(n.properties, 'pagerank'),
      betweenness: numericProp(n.properties, 'betweenness'),
      ...(geo !== undefined ? { geo } : {}),
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
    };
  });

  const ogEdges: OGEdge[] = [...byKey.entries()].map(([k, e]) => ({
    id: k,
    source: e.source,
    target: e.target,
    rel: e.type || 'RELATED',
    weight: 1,
  }));

  const types: OGType[] = typeNames.map((t) => ({ id: t, label: t, glyph: '◇' }));
  const communities: OGCommunity[] = typeNames.map((t, i) => ({ id: i, label: t, hue: 0 }));

  return {
    nodes: ogNodes,
    edges: ogEdges,
    types,
    communities,
    totals: {
      nodes: ogNodes.length,
      edges: ogEdges.length,
      shown: ogNodes.length,
      shownEdges: ogEdges.length,
    },
  };
}
