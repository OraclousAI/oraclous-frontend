// Retrieval/search hook + display helpers for the NodeResult envelope (properties is free-form).
import { useMutation } from '@tanstack/react-query';
import type { SearchMode, SearchResult } from '@oraclous/api-client';
import { useApi } from './api.jsx';

export interface SearchVars {
  readonly query: string;
  readonly mode: SearchMode;
}

export function useSearch(graphId: string) {
  const { search: client } = useApi();
  return useMutation({
    mutationFn: (vars: SearchVars): Promise<SearchResult[]> =>
      client.search(vars.mode, { graphId, query: vars.query }),
  });
}

// The best human-readable string from a result's free-form properties (a matched chunk's text, an
// entity name, ...), falling back to the node type.
export function resultText(result: SearchResult): string {
  for (const key of ['text', 'name', 'title', 'description']) {
    const value = result.properties[key];
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return `(${result.type})`;
}

export function resultScore(result: SearchResult): number | null {
  const score = result.properties['score'];
  return typeof score === 'number' ? score : null;
}
