// Published-agent hooks (developer surface). List is org-scoped (member); publish + unpublish are
// admin. There is no display-once secret here — an agent's "invoke key" is a separate integration
// key bound to its slug, so this surface is plain CRUD (publish + list + unpublish).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PublishAgentInput, PublishedAgent } from '@oraclous/api-client';
import { useApi } from './api.jsx';
import { useTokenStore } from './token-store.jsx';

export interface PublishedAgentsState {
  readonly agents: readonly PublishedAgent[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function usePublishedAgents(orgId: string): PublishedAgentsState {
  const { publishedAgents: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    // Bearer-scoped list (no org argument), so gate on auth only — orgId is just a cache
    // discriminator (it's '' for a standalone personal org). Mirrors the integration-keys hook.
    queryKey: ['published-agents', orgId],
    queryFn: () => client.list(),
    enabled: isAuthenticated,
  });

  return { agents: query.data ?? [], isLoading: query.isLoading, isError: query.isError };
}

export function usePublishAgent(orgId: string) {
  const { publishedAgents: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PublishAgentInput): Promise<PublishedAgent> => client.publish(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['published-agents', orgId] });
    },
  });
}

export function useUnpublishAgent(orgId: string) {
  const { publishedAgents: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string): Promise<void> => client.unpublish(slug),
    // Refetch on success AND error: a 404 means the agent was already unpublished elsewhere, so the
    // list must reconcile the now-stale 'active' row either way.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['published-agents', orgId] });
    },
  });
}
