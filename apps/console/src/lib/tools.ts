// Tools catalogue hook — the org's visible tools (platform built-in connectors + org-registered).
import { useQuery } from '@tanstack/react-query';
import type { Tool } from '@oraclous/api-client';
import { useApi } from './api.jsx';
import { useTokenStore } from './token-store.jsx';

export interface ToolsState {
  readonly tools: readonly Tool[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function useTools(): ToolsState {
  const { tools: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['tools'],
    queryFn: () => client.list(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  return { tools: query.data ?? [], isLoading: query.isLoading, isError: query.isError };
}
