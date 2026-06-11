// Integration-key hooks (developer surface). List is org-scoped and redacted; mint/rotate return
// the DISPLAY-ONCE plaintext token, which the caller holds in component state for a single reveal
// and never caches/persists (CLAUDE.md §1.5 / Gate 2) — so those are mutations, never queries.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { KeySummary, MintedKey, MintKeyInput } from '@oraclous/api-client';
import { useApi } from './api.jsx';
import { useTokenStore } from './token-store.jsx';

export interface KeysState {
  readonly keys: readonly KeySummary[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function useIntegrationKeys(orgId: string): KeysState {
  const { integrationKeys: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    // The list endpoint is scoped by the bearer token (no org argument), like tools/recipes — so
    // gate only on auth. orgId is just a cache discriminator (it's '' for a standalone personal
    // org, which is a valid distinct key; the token changes on org switch, re-keying the query).
    queryKey: ['integration-keys', orgId],
    queryFn: () => client.list(),
    enabled: isAuthenticated,
  });

  return { keys: query.data ?? [], isLoading: query.isLoading, isError: query.isError };
}

export function useMintKey(orgId: string) {
  const { integrationKeys: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MintKeyInput): Promise<MintedKey> => client.mint(input),
    // gcTime 0: the resolved MintedKey carries the display-once plaintext — don't let it linger in
    // the MutationCache after settling. The caller also reset()s once it has captured the value.
    gcTime: 0,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['integration-keys', orgId] });
    },
  });
}

export function useRotateKey(orgId: string) {
  const { integrationKeys: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (keyId: string): Promise<MintedKey> => client.rotate(keyId),
    gcTime: 0,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['integration-keys', orgId] });
    },
  });
}

export function useRevokeKey(orgId: string) {
  const { integrationKeys: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (keyId: string): Promise<void> => client.revoke(keyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['integration-keys', orgId] });
    },
  });
}
