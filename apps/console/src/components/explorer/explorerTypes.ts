// Explorer domain model — ported from the legacy explorer (legacy-reference/old-frontend
// src/dash/explorer/explorerData.ts + explorerAlgorithms.ts). Types only: the legacy mock
// graph generator is deliberately not ported (the console renders real graphs or an honest
// empty state, never fabricated data).

export interface OGNode {
  id: string;
  type: string;
  name: string;
  community: number;
  score: number;
  degree: number;
  pagerank: number;
  betweenness: number;
  role?: string;
  date?: number;
  geo?: { lat: number; lng: number };
  // simulation fields, populated by the force sim
  x: number;
  y: number;
  vx: number;
  vy: number;
  _tx?: number;
  _ty?: number;
}

export interface OGEdge {
  id: string;
  source: string;
  target: string;
  rel: string;
  weight: number;
  // Resolver-written relationship strength on SIMILAR_TO/SAME_AS_CANDIDATE edges (#277); null when
  // the edge carries no score.
  score?: number | null;
}

export interface OGType {
  id: string;
  label: string;
  glyph: string;
}

export interface OGCommunity {
  id: number;
  label: string;
  hue: number;
}

export interface OGData {
  nodes: OGNode[];
  edges: OGEdge[];
  types: OGType[];
  communities: OGCommunity[];
  totals: { nodes: number; edges: number; shown: number; shownEdges: number };
}

// ── Algorithm-overlay contract (renderer side) ───────────────────────────────
// The algorithm rail itself is not ported in this wave (it was dormant in the legacy app);
// the canvas keeps the overlay capability so it can light up later without renderer changes.

export interface NodeStyle {
  dim?: boolean;
  ring?: boolean;
  big?: boolean;
  hopColor?: number;
  community?: number;
  score?: number;
  accent?: 'amber';
  sizeBoost?: number;
}

export interface EdgeStyle {
  dim?: boolean;
  accent?: 'amber';
  width?: number;
}

export interface AlgoStep {
  label: string;
  highlightNodes: Set<string>;
  highlightEdges: Set<string>;
}

export interface AlgoRun {
  steps: AlgoStep[];
  nodeStyle: Map<string, NodeStyle>;
  edgeStyle: Map<string, EdgeStyle>;
  summary: Record<string, string | number>;
}
