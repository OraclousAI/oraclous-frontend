// Graph-read sub-client for the Explorer (knowledge-retriever): GET /v1/graph/{id}/subgraph.
// Returns a bounded {nodes, edges} slice (capped, org+graph scoped) for the sphere visualisation.
// Nodes are NodeResult envelopes — modality data lives inside `properties`; edges are {source, target, type}.
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
}

export interface Subgraph {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
}

interface SubgraphWire {
  readonly nodes: { id: string; type: string; properties: Record<string, unknown> }[];
  readonly edges: { source: string; target: string; type: string }[];
}

export interface ExplorerClient {
  // A bounded graph slice for visualisation: up to `limit` nodes + the directed edges among them.
  subgraph(graphId: string, limit?: number): Promise<Subgraph>;
}

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
        })),
      };
    },
  };
}
