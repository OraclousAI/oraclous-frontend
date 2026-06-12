// Explorer hooks: load a bounded subgraph (capped nodes + edges) for the explorer visualisation,
// expand a node's 1-hop neighbourhood on demand, and action the SAME_AS_CANDIDATE review queue.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApproveResult, GraphNode, RejectResult, Subgraph } from '@oraclous/api-client';
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
    // The subgraph is a heavier read and the explorer re-derives layout from the node array; keep it
    // stable for a while so background refetches don't churn the visualisation.
    staleTime: 60_000,
  });

  return {
    subgraph: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

// Fetch a node's 1-hop neighbours on demand (click-to-expand). The caller merges the result into
// the displayed graph; this is a mutation (no caching) so each expand is an explicit user action.
export function useExpandNeighbors(graphId: string) {
  const { explorer } = useApi();
  return useMutation({
    mutationFn: (nodeId: string): Promise<GraphNode[]> => explorer.neighbors(graphId, nodeId, 25),
  });
}

// Approve (merge) a SAME_AS_CANDIDATE pair: `canonicalNodeId` survives, the other folds in. On
// success the subgraph is refetched so the merged node + dropped candidate edge are reflected.
export function useApproveCandidate(graphId: string) {
  const { resolution } = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (p: { canonicalNodeId: string; otherNodeId: string }): Promise<ApproveResult> =>
      resolution.approve(graphId, p.canonicalNodeId, p.otherNodeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['subgraph', graphId] });
    },
  });
}

// Reject (not-a-duplicate) a SAME_AS_CANDIDATE pair: drops the candidate edge so it stops
// resurfacing. Refetches the subgraph so the candidate disappears from the review queue.
export function useRejectCandidate(graphId: string) {
  const { resolution } = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (p: { nodeIdA: string; nodeIdB: string }): Promise<RejectResult> =>
      resolution.reject(graphId, p.nodeIdA, p.nodeIdB),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['subgraph', graphId] });
    },
  });
}
