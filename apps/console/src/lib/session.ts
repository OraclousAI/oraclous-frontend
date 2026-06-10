// Session hooks. useMe resolves the authenticated principal from the gateway
// (GET /v1/auth/me); useLogout ends the session (clears the in-memory token + cache).
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ApiClientError,
  ErrorCode,
  type AuthPrincipal,
  type AuthSession,
  type CreateOrgInput,
  type Member,
  type MemberRole,
  type Org,
  type UpdateOrgInput,
} from '@oraclous/api-client';
import { useApi } from './api.jsx';
import { useTokenStore } from './token-store.jsx';
import { vaultClear, vaultRead, vaultWrite } from './session-vault.js';

function isAuthFailure(error: unknown): boolean {
  return (
    ApiClientError.is(error) &&
    (error.code === ErrorCode.UNAUTHENTICATED || error.code === ErrorCode.UNAUTHORIZED)
  );
}

// ── Locked refresh — the only way a refresh token is ever presented ─────────
// Refresh tokens are single-use: the auth-service rotates the pair on every call and treats a
// re-presented token as theft, revoking the whole token family. So the vault copy must be the
// one presented, and the rotated replacement must land in the vault before the lock releases.
// The Web Lock serialises refreshes across tabs; re-reading the vault inside the lock means a
// tab that lost the race presents the winner's fresh token, never its own stale one.
const REFRESH_LOCK = 'oraclous-session-refresh';

interface RefreshCapable {
  refresh(refreshToken: string): Promise<AuthSession>;
}

async function lockedRefresh(
  auth: RefreshCapable,
  fallbackRefreshToken?: string
): Promise<AuthSession | null> {
  const run = async (): Promise<AuthSession | null> => {
    const stored = await vaultRead();
    // Fallback covers a vault that is unavailable (private browsing) or was cleared mid-session.
    const refreshToken = stored?.refreshToken ?? fallbackRefreshToken;
    if (refreshToken === undefined || refreshToken === '') return null;
    try {
      const session = await auth.refresh(refreshToken);
      // Persist the rotated token before releasing the lock — the vault must never be left
      // holding a token that has already been presented.
      await vaultWrite({ refreshToken: session.refreshToken, email: session.email });
      return session;
    } catch (cause) {
      if (isAuthFailure(cause)) await vaultClear();
      throw cause;
    }
  };
  if (typeof navigator !== 'undefined' && navigator.locks !== undefined) {
    return navigator.locks.request(REFRESH_LOCK, run);
  }
  return run();
}

// Boot-once memo: StrictMode double-mounts effects; both runs share one restore attempt.
let bootRestore: Promise<AuthSession | null> | null = null;

// Boot-time session restore: if the vault holds a refresh token from a previous load, exchange it
// for a fresh session before ProtectedRoute decides to bounce to /login. Marks the store hydrated
// whatever the outcome; a transient (non-auth) failure leaves the vault intact so the next load
// can retry, while a rejected token clears it (inside lockedRefresh).
export function useSessionHydration(): void {
  const { auth } = useApi();
  const { tokenPayload, setToken, hydrated, markHydrated } = useTokenStore();

  useEffect(() => {
    if (hydrated) return;
    if (tokenPayload !== null) {
      // A session arrived before the restore finished (e.g. a fast manual login) — it wins;
      // the cleanup below cancels the in-flight restore's apply.
      markHydrated();
      return;
    }
    let cancelled = false;
    bootRestore ??= lockedRefresh(auth).catch(() => null);
    void bootRestore.then((session) => {
      if (cancelled) return;
      if (session !== null) {
        setToken({
          token: session.accessToken,
          refreshToken: session.refreshToken,
          email: session.email,
          expiresAt: Date.now() + session.expiresIn * 1000,
        });
      }
      markHydrated();
    });
    return () => {
      cancelled = true;
    };
  }, [auth, tokenPayload, setToken, hydrated, markHydrated]);
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

// Switch the active organisation: re-issue the session for the selected org, swap the in-memory
// token, and invalidate every query so all org-scoped data refetches under the new org.
export function useSwitchOrg() {
  const { auth } = useApi();
  const { setToken } = useTokenStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organisationId: string): Promise<AuthSession> => auth.switchOrg(organisationId),
    onSuccess: (session) => {
      setToken({
        token: session.accessToken,
        refreshToken: session.refreshToken,
        email: session.email,
        expiresAt: Date.now() + session.expiresIn * 1000,
      });
      void queryClient.invalidateQueries();
    },
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

// Silently re-issue the session ~60s before the access token expires (both tokens rotate). The
// refresh goes through lockedRefresh so the vault stays the single live copy across tabs. On
// success it reschedules (the new expiry re-runs the effect); on failure (expired/invalid refresh
// token) it clears the session so ProtectedRoute returns to /login.
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
      lockedRefresh(auth, refreshToken)
        .then((session) => {
          if (session === null) {
            // No refresh token anywhere (vault cleared and none in memory) — end the session.
            setToken(null);
            return;
          }
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
