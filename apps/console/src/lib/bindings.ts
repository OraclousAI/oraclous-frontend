// Agent↔workspace binding hooks (ADR-029 / Contract G2). The curation edge answering "which agents
// are for this workspace" and "which workspaces does this agent serve". A mutation invalidates the
// whole 'agent-bindings' key so both projections (by graph, by harness) refresh.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BoundAgent, BoundGraph } from '@oraclous/api-client';
import { useApi } from './api.jsx';
import { useTokenStore } from './token-store.jsx';

export interface BoundAgentsState {
  readonly agents: readonly BoundAgent[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function useAgentsForGraph(graphId: string): BoundAgentsState {
  const { bindings } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['agent-bindings', 'graph', graphId],
    queryFn: () => bindings.listAgentsForGraph(graphId),
    enabled: isAuthenticated && graphId !== '',
  });

  return { agents: query.data ?? [], isLoading: query.isLoading, isError: query.isError };
}

export interface BoundGraphsState {
  readonly graphs: readonly BoundGraph[];
  readonly isLoading: boolean;
}

export function useGraphsForHarness(harnessId: string): BoundGraphsState {
  const { bindings } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['agent-bindings', 'harness', harnessId],
    queryFn: () => bindings.listGraphsForHarness(harnessId),
    enabled: isAuthenticated && harnessId !== '',
  });

  return { graphs: query.data ?? [], isLoading: query.isLoading };
}

export function useAttachAgent() {
  const { bindings } = useApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (vars: { harnessId: string; graphId: string }): Promise<{ created: boolean }> =>
      bindings.attachAgent(vars.harnessId, vars.graphId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['agent-bindings'] });
    },
  });
}

export function useDetachAgent() {
  const { bindings } = useApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (vars: { harnessId: string; graphId: string }): Promise<void> =>
      bindings.detachAgent(vars.harnessId, vars.graphId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['agent-bindings'] });
    },
  });
}
