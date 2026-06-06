// Session hooks. useMe resolves the authenticated principal from the gateway
// (GET /v1/auth/me); useLogout ends the session (clears the in-memory token + cache).
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ApiClientError,
  ErrorCode,
  type AuthPrincipal,
  type CreateOrgInput,
  type Member,
  type MemberRole,
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

export interface MembersState {
  readonly members: readonly Member[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function useMembers(orgId: string): MembersState {
  const { orgs: orgsClient } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['members', orgId],
    queryFn: () => orgsClient.listMembers(orgId),
    enabled: isAuthenticated && orgId !== '',
  });

  return { members: query.data ?? [], isLoading: query.isLoading, isError: query.isError };
}

export function useChangeMemberRole(orgId: string) {
  const { orgs: orgsClient } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { userId: string; role: MemberRole }): Promise<Member> =>
      orgsClient.changeMemberRole(orgId, vars.userId, vars.role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['members', orgId] });
    },
  });
}

export function useRemoveMember(orgId: string) {
  const { orgs: orgsClient } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string): Promise<void> => orgsClient.removeMember(orgId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['members', orgId] });
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

// Silently re-issue the session ~60s before the access token expires, using the in-memory refresh
// token (both tokens rotate). On success it reschedules (the new expiry re-runs the effect); on
// failure (expired/invalid refresh token) it clears the session so ProtectedRoute returns to /login.
export function useSilentRefresh(): void {
  const { auth } = useApi();
  const { tokenPayload, setToken } = useTokenStore();
  const refreshToken = tokenPayload?.refreshToken ?? null;
  const expiresAt = tokenPayload?.expiresAt ?? null;
  // Bumped to re-arm a refresh after a transient failure (does not change the tokens).
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    if (refreshToken === null || refreshToken === '' || expiresAt === null) return;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const delay = Math.max(0, expiresAt - Date.now() - 60_000);
    const timer = setTimeout(() => {
      auth
        .refresh(refreshToken)
        .then((session) => {
          setToken({
            token: session.accessToken,
            refreshToken: session.refreshToken,
            email: session.email,
            expiresAt: Date.now() + session.expiresIn * 1000,
          });
        })
        .catch((cause) => {
          // Only end the session if the refresh token itself is rejected. A transient error
          // (network/5xx) shouldn't log the user out — the access token is still valid for ~60s,
          // so re-arm a retry; a persistent outage self-terminates via the natural-401 logout.
          if (isAuthFailure(cause)) {
            setToken(null);
          } else {
            retryTimer = setTimeout(() => setRetryTick((n) => n + 1), 15_000);
          }
        });
    }, delay);
    return () => {
      clearTimeout(timer);
      if (retryTimer !== undefined) clearTimeout(retryTimer);
    };
  }, [auth, refreshToken, expiresAt, setToken, retryTick]);
}
