// Explorer hooks: load a bounded subgraph (capped nodes + edges) for the sphere visualisation.
import { useQuery } from '@tanstack/react-query';
import type { Subgraph } from '@oraclous/api-client';
import { useApi } from './api.jsx';
import { useTokenStore } from './token-store.jsx';

export interface SubgraphState {
  readonly subgraph: Subgraph | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function useSubgraph(graphId: string, limit = 250): SubgraphState {
  const { explorer } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['subgraph', graphId, limit],
    queryFn: () => explorer.subgraph(graphId, limit),
    enabled: isAuthenticated && graphId !== '',
    // The subgraph is a heavier read and the sphere re-derives layout from the node array; keep it
    // stable for a while so background refetches don't churn the visualisation.
    staleTime: 60_000,
  });

  return {
    subgraph: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
