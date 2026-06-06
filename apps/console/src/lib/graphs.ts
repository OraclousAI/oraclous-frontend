// Knowledge-graph hooks: list/create graphs, read one graph, ingest content, and track jobs.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateGraphInput,
  Graph,
  IngestJob,
  IngestTextInput,
  UpdateGraphInput,
} from '@oraclous/api-client';
import { useApi } from './api.jsx';
import { useTokenStore } from './token-store.jsx';

// A job is still working (so its counts/status will change) while pending or running.
export function isJobActive(job: IngestJob): boolean {
  return job.status === 'pending' || job.status === 'running';
}

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

export interface GraphState {
  readonly graph: Graph | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function useGraph(graphId: string): GraphState {
  const { graphs: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['graph', graphId],
    queryFn: () => client.get(graphId),
    enabled: isAuthenticated && graphId !== '',
  });

  return { graph: query.data ?? null, isLoading: query.isLoading, isError: query.isError };
}

export interface DocumentsState {
  readonly documents: readonly IngestJob[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

// Polls the graph's jobs while any is still active (pending/running), then stops.
export function useDocuments(graphId: string): DocumentsState {
  const { graphs: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['graph-documents', graphId],
    queryFn: () => client.listDocuments(graphId),
    enabled: isAuthenticated && graphId !== '',
    refetchInterval: (q) => ((q.state.data ?? []).some(isJobActive) ? 2000 : false),
  });

  return { documents: query.data ?? [], isLoading: query.isLoading, isError: query.isError };
}

export function useIngest(graphId: string) {
  const { graphs: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: IngestTextInput): Promise<IngestJob> => client.ingestText(graphId, input),
    onSuccess: () => {
      // The new job appears in the documents list; its poll then drives the live status.
      void queryClient.invalidateQueries({ queryKey: ['graph-documents', graphId] });
    },
  });
}

export function useIngestFile(graphId: string) {
  const { graphs: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { file: File; recipeId?: string }): Promise<IngestJob> =>
      client.ingestFile(graphId, vars.file, vars.recipeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['graph-documents', graphId] });
    },
  });
}

export function useUpdateGraph(graphId: string) {
  const { graphs: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateGraphInput): Promise<Graph> => client.update(graphId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['graph', graphId] });
      void queryClient.invalidateQueries({ queryKey: ['graphs'] });
    },
  });
}

export function useDeleteGraph() {
  const { graphs: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (graphId: string): Promise<void> => client.remove(graphId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['graphs'] });
    },
  });
}
