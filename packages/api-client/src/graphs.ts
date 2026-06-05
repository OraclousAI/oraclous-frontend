// Knowledge-graph sub-client (GET/POST /api/v1/graphs) — the substrate write side.
import type { ApiTransport } from './transport';

export interface Graph {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: string;
  readonly nodeCount: number;
  readonly relationshipCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateGraphInput {
  readonly name: string;
  readonly description?: string;
}

interface GraphResponseWire {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: string;
  readonly node_count: number;
  readonly relationship_count: number;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface GraphsClient {
  // The knowledge graphs visible to the authenticated principal's organisation.
  list(): Promise<Graph[]>;
  // Create a new (empty) knowledge graph.
  create(input: CreateGraphInput): Promise<Graph>;
}

function toGraph(wire: GraphResponseWire): Graph {
  return {
    id: wire.id,
    name: wire.name,
    description: wire.description,
    status: wire.status,
    nodeCount: wire.node_count,
    relationshipCount: wire.relationship_count,
    createdAt: wire.created_at,
    updatedAt: wire.updated_at,
  };
}

export function createGraphsClient(transport: ApiTransport): GraphsClient {
  return {
    async list(): Promise<Graph[]> {
      const { data } = await transport.execute<GraphResponseWire[]>({
        method: 'GET',
        path: '/api/v1/graphs',
      });
      return data.map(toGraph);
    },
    async create(input: CreateGraphInput): Promise<Graph> {
      const body: { name: string; description?: string } = { name: input.name };
      if (input.description !== undefined) body.description = input.description;
      const { data } = await transport.execute<GraphResponseWire>({
        method: 'POST',
        path: '/api/v1/graphs',
        body,
      });
      return toGraph(data);
    },
  };
}
