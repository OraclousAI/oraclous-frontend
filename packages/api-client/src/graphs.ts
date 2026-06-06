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

export interface UpdateGraphInput {
  readonly name?: string;
  readonly description?: string;
}

export interface IngestTextInput {
  readonly content: string;
  // 'text' | 'csv' | 'json' | 'md' | 'code' | ... — structured types route to the recipe engine.
  readonly sourceType: string;
}

// An ingestion job. Async: POST .../ingest returns one in `pending`, then it progresses to
// `running` and a terminal `completed`/`failed`. Surfaced via .../documents and .../jobs/{id}.
export interface IngestJob {
  readonly id: string;
  readonly graphId: string;
  readonly status: string;
  readonly sourceType: string;
  readonly progress: number | null;
  readonly extractedEntities: number | null;
  readonly extractedRelationships: number | null;
  readonly filename: string | null;
  readonly errorMessage: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
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

interface JobResponseWire {
  readonly id: string;
  readonly graph_id: string;
  readonly status: string;
  readonly source_type: string;
  readonly progress: number | null;
  readonly extracted_entities: number | null;
  readonly extracted_relationships: number | null;
  readonly filename: string | null;
  readonly error_message: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export type OntologyMode = 'open' | 'strict' | 'coerce';

export interface Ontology {
  readonly allowedLabels: readonly string[];
  readonly mode: string;
}

export interface OntologyInput {
  readonly allowedLabels: readonly string[];
  readonly mode: OntologyMode;
}

interface OntologyWire {
  readonly allowed_labels: string[];
  readonly mode: string;
}

export interface GraphsClient {
  // The knowledge graphs visible to the authenticated principal's organisation.
  list(): Promise<Graph[]>;
  // Create a new (empty) knowledge graph.
  create(input: CreateGraphInput): Promise<Graph>;
  // A single graph by id (live node/relationship counts).
  get(graphId: string): Promise<Graph>;
  // Ingest inline text/structured content — returns the async job to poll.
  ingestText(graphId: string, input: IngestTextInput): Promise<IngestJob>;
  // Poll a single ingestion job.
  getJob(graphId: string, jobId: string): Promise<IngestJob>;
  // The graph's ingestion jobs / documents (history + live status).
  listDocuments(graphId: string): Promise<IngestJob[]>;
  // Rename / re-describe a graph.
  update(graphId: string, input: UpdateGraphInput): Promise<Graph>;
  // Delete a graph and its data.
  remove(graphId: string): Promise<void>;
  // Ingest an uploaded file (multipart) — returns the async job to poll.
  ingestFile(graphId: string, file: File, recipeId?: string): Promise<IngestJob>;
  // The graph's entity ontology (allowed labels + enforcement mode).
  getOntology(graphId: string): Promise<Ontology>;
  // Replace the graph's ontology.
  setOntology(graphId: string, input: OntologyInput): Promise<Ontology>;
}

function toOntology(wire: OntologyWire): Ontology {
  return { allowedLabels: wire.allowed_labels, mode: wire.mode };
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

function toJob(wire: JobResponseWire): IngestJob {
  return {
    id: wire.id,
    graphId: wire.graph_id,
    status: wire.status,
    sourceType: wire.source_type,
    progress: wire.progress,
    extractedEntities: wire.extracted_entities,
    extractedRelationships: wire.extracted_relationships,
    filename: wire.filename,
    errorMessage: wire.error_message,
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
    async get(graphId: string): Promise<Graph> {
      const { data } = await transport.execute<GraphResponseWire>({
        method: 'GET',
        path: `/api/v1/graphs/${encodeURIComponent(graphId)}`,
      });
      return toGraph(data);
    },
    async ingestText(graphId: string, input: IngestTextInput): Promise<IngestJob> {
      const { data } = await transport.execute<JobResponseWire>({
        method: 'POST',
        path: `/api/v1/graphs/${encodeURIComponent(graphId)}/ingest`,
        body: { content: input.content, source_type: input.sourceType },
      });
      return toJob(data);
    },
    async getJob(graphId: string, jobId: string): Promise<IngestJob> {
      const { data } = await transport.execute<JobResponseWire>({
        method: 'GET',
        path: `/api/v1/graphs/${encodeURIComponent(graphId)}/jobs/${encodeURIComponent(jobId)}`,
      });
      return toJob(data);
    },
    async listDocuments(graphId: string): Promise<IngestJob[]> {
      const { data } = await transport.execute<JobResponseWire[]>({
        method: 'GET',
        path: `/api/v1/graphs/${encodeURIComponent(graphId)}/documents`,
      });
      return data.map(toJob);
    },
    async update(graphId: string, input: UpdateGraphInput): Promise<Graph> {
      const body: { name?: string; description?: string } = {};
      if (input.name !== undefined) body.name = input.name;
      if (input.description !== undefined) body.description = input.description;
      const { data } = await transport.execute<GraphResponseWire>({
        method: 'PATCH',
        path: `/api/v1/graphs/${encodeURIComponent(graphId)}`,
        body,
      });
      return toGraph(data);
    },
    async remove(graphId: string): Promise<void> {
      await transport.execute<void>({
        method: 'DELETE',
        path: `/api/v1/graphs/${encodeURIComponent(graphId)}`,
      });
    },
    async ingestFile(graphId: string, file: File, recipeId?: string): Promise<IngestJob> {
      const form = new FormData();
      form.append('file', file);
      if (recipeId !== undefined) form.append('recipe_id', recipeId);
      const { data } = await transport.execute<JobResponseWire>({
        method: 'POST',
        path: `/api/v1/graphs/${encodeURIComponent(graphId)}/upload`,
        body: form,
      });
      return toJob(data);
    },
    async getOntology(graphId: string): Promise<Ontology> {
      const { data } = await transport.execute<OntologyWire>({
        method: 'GET',
        path: `/api/v1/graphs/${encodeURIComponent(graphId)}/ontology`,
      });
      return toOntology(data);
    },
    async setOntology(graphId: string, input: OntologyInput): Promise<Ontology> {
      const { data } = await transport.execute<OntologyWire>({
        method: 'PUT',
        path: `/api/v1/graphs/${encodeURIComponent(graphId)}/ontology`,
        body: { allowed_labels: [...input.allowedLabels], mode: input.mode },
      });
      return toOntology(data);
    },
  };
}
