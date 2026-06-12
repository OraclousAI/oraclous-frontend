// Graph-read sub-client for the Explorer (knowledge-retriever): GET /v1/graph/{id}/subgraph.
// Returns a bounded {nodes, edges} slice (capped, org+graph scoped) for the sphere visualisation.
// Both nodes and edges carry a `properties` bag — node modality data, and edge-level data such as
// the `score` on SIMILAR_TO/SAME_AS_CANDIDATE edges (knowledge-retriever #277).
import type { ApiTransport } from './transport';

export interface GraphNode {
  readonly id: string;
  readonly type: string;
  readonly properties: Readonly<Record<string, unknown>>;
}

export interface GraphEdge {
  readonly source: string;
  readonly target: string;
  readonly type: string;
  // Edge-level data — e.g. `score` on SIMILAR_TO/SAME_AS_CANDIDATE, `weight` — mirroring node
  // properties (#277). Empty {} for edges the resolver doesn't annotate.
  readonly properties: Readonly<Record<string, unknown>>;
}

export interface Subgraph {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
}

interface SubgraphWire {
  readonly nodes: { id: string; type: string; properties: Record<string, unknown> }[];
  readonly edges: {
    source: string;
    target: string;
    type: string;
    properties?: Record<string, unknown>;
  }[];
}

export interface ExplorerClient {
  // A bounded graph slice for visualisation: up to `limit` nodes + the directed edges among them.
  subgraph(graphId: string, limit?: number): Promise<Subgraph>;
  // The 1-hop neighbourhood of a node (for click-to-expand). Each neighbour carries the
  // relationship type to the queried node in `properties.relationship`.
  neighbors(graphId: string, nodeId: string, topK?: number): Promise<GraphNode[]>;
}

type NodeWire = { id: string; type: string; properties: Record<string, unknown> };

export function createExplorerClient(transport: ApiTransport): ExplorerClient {
  return {
    async subgraph(graphId: string, limit = 250): Promise<Subgraph> {
      const { data } = await transport.execute<SubgraphWire>({
        method: 'GET',
        path: `/v1/graph/${encodeURIComponent(graphId)}/subgraph?limit=${limit}`,
      });
      return {
        nodes: (data.nodes ?? []).map((n) => ({
          id: n.id,
          type: n.type,
          properties: n.properties,
        })),
        edges: (data.edges ?? []).map((e) => ({
          source: e.source,
          target: e.target,
          type: e.type,
          properties: e.properties ?? {},
        })),
      };
    },
    async neighbors(graphId: string, nodeId: string, topK = 25): Promise<GraphNode[]> {
      const { data } = await transport.execute<NodeWire[]>({
        method: 'GET',
        path: `/v1/graph/${encodeURIComponent(graphId)}/neighbors/${encodeURIComponent(
          nodeId
        )}?top_k=${topK}`,
      });
      return (data ?? []).map((n) => ({ id: n.id, type: n.type, properties: n.properties }));
    },
  };
}
