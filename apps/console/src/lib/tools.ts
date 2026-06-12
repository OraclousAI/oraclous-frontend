// Tools catalogue hooks — the org's visible tools (platform built-in connectors + org-registered),
// plus the admin MCP-import + approve actions (the supply-chain HITL gate).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ImportMcpInput, Tool } from '@oraclous/api-client';
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

export function useImportMcp() {
  const { tools: client } = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ImportMcpInput): Promise<Tool[]> => client.importMcp(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });
}

export function useApproveTool() {
  const { tools: client } = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (toolId: string): Promise<void> => client.approve(toolId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });
}

export function useRejectTool() {
  const { tools: client } = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (toolId: string): Promise<void> => client.reject(toolId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });
}
