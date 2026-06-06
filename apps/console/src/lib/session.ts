// Session hooks. useMe resolves the authenticated principal from the gateway
// (GET /v1/auth/me); useLogout ends the session (clears the in-memory token + cache).
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ApiClientError,
  ErrorCode,
  type AuthPrincipal,
  type CreateOrgInput,
  type Org,
  type UpdateOrgInput,
} from '@oraclous/api-client';
import { useApi } from './api.jsx';
import { useTokenStore } from './token-store.jsx';

function isAuthFailure(error: unknown): boolean {
  return (
    ApiClientError.is(error) &&
    (error.code === ErrorCode.UNAUTHENTICATED || error.code === ErrorCode.UNAUTHORIZED)
  );
}

export interface MeState {
  readonly principal: AuthPrincipal | null;
  readonly isLoading: boolean;
  // True when the token is present but the server rejected it (expired/invalid).
  readonly isAuthError: boolean;
}

export function useMe(): MeState {
  const { auth } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => auth.me(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => !isAuthFailure(error) && failureCount < 1,
  });

  return {
    principal: query.data ?? null,
    isLoading: query.isLoading,
    isAuthError: query.isError && isAuthFailure(query.error),
  };
}

export interface OrgsState {
  readonly orgs: readonly Org[];
  readonly isLoading: boolean;
}

export function useOrgs(): OrgsState {
  const { orgs: orgsClient } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['orgs'],
    queryFn: () => orgsClient.list(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => !isAuthFailure(error) && failureCount < 1,
  });

  return { orgs: query.data ?? [], isLoading: query.isLoading };
}

// Create an organisation, then refresh the org list so the switcher shows it.
export function useCreateOrg() {
  const { orgs: orgsClient } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrgInput): Promise<Org> => orgsClient.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orgs'] });
    },
  });
}

export interface OrgState {
  readonly org: Org | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function useOrg(orgId: string): OrgState {
  const { orgs: orgsClient } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['org', orgId],
    queryFn: () => orgsClient.get(orgId),
    enabled: isAuthenticated && orgId !== '',
  });

  return { org: query.data ?? null, isLoading: query.isLoading, isError: query.isError };
}

export function useUpdateOrg(orgId: string) {
  const { orgs: orgsClient } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrgInput): Promise<Org> => orgsClient.update(orgId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['org', orgId] });
      void queryClient.invalidateQueries({ queryKey: ['orgs'] });
    },
  });
}

export function useChangePassword() {
  const { auth } = useApi();

  return useMutation({
    mutationFn: (newPassword: string): Promise<void> => auth.changePassword(newPassword),
  });
}

export function useLogout(): () => void {
  const { setToken } = useTokenStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useCallback(() => {
    setToken(null);
    queryClient.clear();
    navigate('/login', { replace: true });
  }, [setToken, queryClient, navigate]);
}
