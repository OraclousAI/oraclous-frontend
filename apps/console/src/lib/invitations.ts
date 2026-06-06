// Org invitation hooks: list/create/revoke (org-scoped, owner side) + peek/accept (invitee side).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AcceptedInvitation,
  CreatedInvitation,
  CreateInvitationInput,
  Invitation,
  InvitationPeek,
} from '@oraclous/api-client';
import { useApi } from './api.jsx';
import { useTokenStore } from './token-store.jsx';

export interface InvitationsState {
  readonly invitations: readonly Invitation[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function useInvitations(orgId: string): InvitationsState {
  const { invitations: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['invitations', orgId],
    queryFn: () => client.list(orgId),
    enabled: isAuthenticated && orgId !== '',
  });

  return { invitations: query.data ?? [], isLoading: query.isLoading, isError: query.isError };
}

export function useCreateInvitation(orgId: string) {
  const { invitations: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInvitationInput): Promise<CreatedInvitation> =>
      client.create(orgId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invitations', orgId] });
    },
  });
}

export function useRevokeInvitation(orgId: string) {
  const { invitations: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string): Promise<void> => client.revoke(orgId, invitationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invitations', orgId] });
    },
  });
}

export interface PeekState {
  readonly peek: InvitationPeek | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function usePeekInvitation(token: string): PeekState {
  const { invitations: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['invitation-peek', token],
    queryFn: () => client.peek(token),
    enabled: isAuthenticated && token !== '',
    retry: false,
  });

  return { peek: query.data ?? null, isLoading: query.isLoading, isError: query.isError };
}

export function useAcceptInvitation() {
  const { invitations: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string): Promise<AcceptedInvitation> => client.accept(token),
    onSuccess: () => {
      // The invitee just joined a new org — refresh the org list / switcher.
      void queryClient.invalidateQueries({ queryKey: ['orgs'] });
    },
  });
}
