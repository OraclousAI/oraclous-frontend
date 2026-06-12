// Webhook-subscription hooks (developer surface). List is org-scoped (member, bearer-scoped query);
// create is admin and returns a DISPLAY-ONCE signing secret, so it's a mutation (never a cached
// query) and the caller reset()s it after revealing the secret once.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateSubscriptionInput,
  CreatedSubscription,
  Subscription,
} from '@oraclous/api-client';
import { useApi } from './api.jsx';
import { useTokenStore } from './token-store.jsx';

export interface SubscriptionsState {
  readonly subscriptions: readonly Subscription[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function useWebhookSubscriptions(orgId: string): SubscriptionsState {
  const { webhookSubscriptions: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    // Bearer-scoped list — gate on auth; orgId is only a cache discriminator (mirrors the other
    // developer-surface hooks).
    queryKey: ['webhook-subscriptions', orgId],
    queryFn: () => client.list(),
    enabled: isAuthenticated,
  });

  return {
    subscriptions: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useCreateSubscription(orgId: string) {
  const { webhookSubscriptions: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSubscriptionInput): Promise<CreatedSubscription> =>
      client.create(input),
    // gcTime 0: the create response carries the display-once signing secret — don't retain it in
    // the MutationCache after settling. The caller also reset()s once it has captured the value.
    gcTime: 0,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['webhook-subscriptions', orgId] });
    },
  });
}

export function useDeleteSubscription(orgId: string) {
  const { webhookSubscriptions: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subscriptionId: string): Promise<void> => client.remove(subscriptionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['webhook-subscriptions', orgId] });
    },
  });
}
