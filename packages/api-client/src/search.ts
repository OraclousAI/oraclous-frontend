// Retrieval/search sub-client (POST /v1/search/{semantic,fulltext,hybrid}) — the read side over a
// graph the knowledge-graph-service ingested. Results are NodeResult envelopes: modality data
// (the matched text, a relevance score, ...) lives inside `properties`.
import type { ApiTransport } from './transport';

export type SearchMode = 'semantic' | 'fulltext' | 'hybrid';

export interface SearchInput {
  readonly graphId: string;
  readonly query: string;
  readonly topK?: number;
}

export interface SearchResult {
  readonly id: string;
  readonly type: string;
  readonly properties: Readonly<Record<string, unknown>>;
}

interface SearchResultWire {
  readonly id: string;
  readonly type: string;
  readonly properties: Record<string, unknown>;
}

export interface SearchClient {
  // Search a graph by mode; returns the canonical NodeResult envelopes (best-match first).
  search(mode: SearchMode, input: SearchInput): Promise<SearchResult[]>;
}

export function createSearchClient(transport: ApiTransport): SearchClient {
  return {
    async search(mode: SearchMode, input: SearchInput): Promise<SearchResult[]> {
      const { data } = await transport.execute<SearchResultWire[]>({
        method: 'POST',
        path: `/v1/search/${mode}`,
        body: { graph_id: input.graphId, query: input.query, top_k: input.topK ?? 10 },
      });
      return data.map((r) => ({ id: r.id, type: r.type, properties: r.properties }));
    },
  };
}
