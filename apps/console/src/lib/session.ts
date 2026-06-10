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
import { sessionEpoch, useTokenStore } from './token-store.jsx';
import { vaultClear, vaultRead, vaultWrite, withSessionLock } from './session-vault.js';

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
// tab that lost the race presents the winner's fresh token, never its own stale one. The vault's
// 'empty' answer deliberately does NOT fall back to the in-memory token — empty means a logout
// happened, and resurrecting it would re-persist a credential the user asked us to drop; the
// fallback exists only for an UNAVAILABLE vault (private browsing, no Web Locks).
//
// Epoch guard: if any session change (login, logout, org switch) lands while the network call is
// in flight, the result is stale — it is discarded without touching the vault. The just-rotated
// token is simply abandoned; it is never re-presented, so no reuse detection fires.

interface RefreshCapable {
  refresh(refreshToken: string): Promise<AuthSession>;
}

type RefreshOutcome =
  | { readonly kind: 'session'; readonly session: AuthSession }
  // A newer session change won while this refresh was in flight — ignore the result entirely.
  | { readonly kind: 'stale' }
  // No refresh token exists anywhere — the session is over.
  | { readonly kind: 'none' };

async function lockedRefresh(
  auth: RefreshCapable,
  fallbackRefreshToken?: string
): Promise<RefreshOutcome> {
  return withSessionLock(async () => {
    const startEpoch = sessionEpoch();
    const stored = await vaultRead();
    const refreshToken =
      stored.kind === 'value'
        ? stored.value.refreshToken
        : stored.kind === 'unavailable'
          ? fallbackRefreshToken
          : undefined;
    if (refreshToken === undefined || refreshToken === '') return { kind: 'none' };
    try {
      const session = await auth.refresh(refreshToken);
      if (sessionEpoch() !== startEpoch) return { kind: 'stale' };
      // Persist the rotated token before releasing the lock — the vault must never be left
      // holding a token that has already been presented.
      await vaultWrite({ refreshToken: session.refreshToken });
      return { kind: 'session', session };
    } catch (cause) {
      if (isAuthFailure(cause) && sessionEpoch() === startEpoch) await vaultClear();
      throw cause;
    }
  });
}

// Boot-once memo: StrictMode double-mounts effects; both runs share one restore attempt.
let bootRestore: Promise<RefreshOutcome> | null = null;

// The restore is time-boxed: a wedged lock holder or a hanging request must not strand the user
// on the restoring screen — fall through to /login and leave the vault intact for the next load.
const BOOT_RESTORE_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, fallback: T, ms: number): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    void promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      }
    );
  });
}

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
      // A session arrived before the restore finished (e.g. a fast manual login) — it wins; the
      // epoch guard inside lockedRefresh makes the in-flight restore discard itself.
      markHydrated();
      return;
    }
    let cancelled = false;
    bootRestore ??= withTimeout<RefreshOutcome>(
      lockedRefresh(auth).catch((): RefreshOutcome => ({ kind: 'none' })),
      { kind: 'none' },
      BOOT_RESTORE_TIMEOUT_MS
    );
    void bootRestore.then((outcome) => {
      if (cancelled) return;
      if (outcome.kind === 'session') {
        // Already persisted inside the lock — don't queue a second, unserialised write.
        void setToken(
          {
            token: outcome.session.accessToken,
            refreshToken: outcome.session.refreshToken,
            email: outcome.session.email,
            expiresAt: Date.now() + outcome.session.expiresIn * 1000,
          },
          { persistToVault: false }
        );
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
      void setToken({
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
    void setToken(null);
    // setToken queues the vault clear (locked + epoch-guarded). Issue a second, unconditional
    // clear behind it: if a stale rotation slips in between, the explicit user logout still
    // leaves the vault empty (the queue applies them in order).
    void vaultClear();
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
        .then((outcome) => {
          if (outcome.kind === 'stale') {
            // A newer session change (login/logout/org switch) won mid-flight — nothing to do.
            return;
          }
          if (outcome.kind === 'none') {
            // No refresh token anywhere — the vault was cleared (logout elsewhere) and there is
            // nothing valid to present. End this tab's session too.
            void setToken(null, { persistToVault: false });
            return;
          }
          // Already persisted inside the lock — don't queue a second, unserialised write.
          void setToken(
            {
              token: outcome.session.accessToken,
              refreshToken: outcome.session.refreshToken,
              email: outcome.session.email,
              expiresAt: Date.now() + outcome.session.expiresIn * 1000,
            },
            { persistToVault: false }
          );
        })
        .catch((cause) => {
          // Only end the session if the refresh token itself is rejected. A transient error
          // (network/5xx) shouldn't log the user out — the access token is still valid for ~60s,
          // so re-arm a retry; a persistent outage self-terminates via the natural-401 logout.
          if (isAuthFailure(cause)) {
            void setToken(null);
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
