// Knowledge-graph hooks: list the organisation's graphs and create new ones.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateGraphInput, Graph } from '@oraclous/api-client';
import { useApi } from './api.jsx';
import { useTokenStore } from './token-store.jsx';

export interface GraphsState {
  readonly graphs: readonly Graph[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function useGraphs(): GraphsState {
  const { graphs: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['graphs'],
    queryFn: () => client.list(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  return { graphs: query.data ?? [], isLoading: query.isLoading, isError: query.isError };
}

export function useCreateGraph() {
  const { graphs: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGraphInput): Promise<Graph> => client.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['graphs'] });
    },
  });
}
