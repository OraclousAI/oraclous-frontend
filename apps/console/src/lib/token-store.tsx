// In-memory auth token store — no localStorage/sessionStorage (Gate 2: no-token-in-storage).
// §1.5 invariant: the access token lives in memory only. The rotating refresh token is the one
// credential allowed to persist, and only via the session vault (lib/session-vault.ts) — setToken
// is the single choke point that mirrors every session change into the vault (login, OAuth,
// silent refresh, org switch, logout).
//
// Concurrency: every session change bumps a module-level epoch. Vault syncs run under the
// cross-tab session lock and re-check the epoch before touching storage, so a stale async write
// can never land after a newer session change (the logout-vs-in-flight-refresh race). Logout is
// broadcast so other tabs drop their in-memory session immediately.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { vaultClear, vaultWrite, withSessionLock } from './session-vault.js';

export interface TokenPayload {
  token: string;
  // The rotating refresh token — used for silent re-issue before expiry and persisted
  // (encrypted) in the session vault so a page reload can restore the session.
  refreshToken: string;
  email: string;
  expiresAt: number;
}

// Monotonic session epoch — bumped by EVERY setToken. Async session work (refresh, vault sync)
// captures it at the start and discards itself if the world moved on.
let epoch = 0;
export function sessionEpoch(): number {
  return epoch;
}

const LOGOUT_CHANNEL = 'oraclous-session';

export interface SetTokenOptions {
  // lockedRefresh persists the rotated token itself, inside the session lock — its setToken
  // must not queue a second, unserialised write of the same value.
  persistToVault?: boolean;
  // Cleared when applying a logout received FROM the broadcast channel, to avoid echo loops.
  broadcast?: boolean;
}

interface TokenStoreValue {
  tokenPayload: TokenPayload | null;
  // Resolves when the vault sync has committed — await it before a navigation that could tear
  // the page down (login/OAuth), so an immediate reload still finds the credential on disk.
  setToken: (payload: TokenPayload | null, options?: SetTokenOptions) => Promise<void>;
  // Reads the current access token synchronously — reflects setToken immediately (before the
  // re-render/effect), so transport calls issued right after a swap (e.g. the invalidate-triggered
  // refetches on an org switch) carry the NEW token, not the prior one.
  getToken: () => string | null;
  isAuthenticated: boolean;
  // False until the boot-time session restore (useSessionHydration) has run once. ProtectedRoute
  // holds its redirect while this is false so a page refresh doesn't flash to /login.
  hydrated: boolean;
  markHydrated: () => void;
}

const TokenCtx = createContext<TokenStoreValue>({
  tokenPayload: null,
  setToken: () => Promise.resolve(),
  getToken: () => null,
  isAuthenticated: false,
  hydrated: true,
  markHydrated: () => {},
});

export function useTokenStore(): TokenStoreValue {
  return useContext(TokenCtx);
}

export function TokenStoreProvider({
  children,
  initialToken = null,
}: {
  children: ReactNode;
  initialToken?: TokenPayload | null;
}) {
  const [tokenPayload, setTokenPayload] = useState<TokenPayload | null>(initialToken);
  const [hydrated, setHydrated] = useState(initialToken !== null);
  // A ref mirror updated synchronously in setToken so getToken() never lags a swap.
  const tokenRef = useRef<TokenPayload | null>(initialToken);

  const setToken = useCallback((payload: TokenPayload | null, options?: SetTokenOptions) => {
    epoch += 1;
    const myEpoch = epoch;
    tokenRef.current = payload;
    setTokenPayload(payload);

    let persisted = Promise.resolve();
    const persist = options?.persistToVault ?? true;
    if (persist) {
      // Under the session lock so it serialises against in-flight rotations in any tab, and
      // epoch-guarded so a slow sync for an old session never overwrites a newer one.
      persisted = withSessionLock(async () => {
        if (sessionEpoch() !== myEpoch) return;
        if (payload === null) {
          await vaultClear();
        } else {
          await vaultWrite({ refreshToken: payload.refreshToken });
        }
      }).catch(() => undefined);
    }

    // Tell the other tabs a logout happened so they drop their in-memory session immediately
    // instead of resurrecting the vault at their next silent refresh.
    if (
      payload === null &&
      (options?.broadcast ?? true) &&
      typeof BroadcastChannel !== 'undefined'
    ) {
      const ch = new BroadcastChannel(LOGOUT_CHANNEL);
      ch.postMessage('logout');
      ch.close();
    }

    return persisted;
  }, []);

  // Apply a logout broadcast from another tab (memory only — the sender owns the vault clear).
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel(LOGOUT_CHANNEL);
    ch.onmessage = (event: MessageEvent) => {
      if (event.data === 'logout' && tokenRef.current !== null) {
        void setToken(null, { persistToVault: false, broadcast: false });
      }
    };
    return () => ch.close();
  }, [setToken]);

  const getToken = useCallback(() => tokenRef.current?.token ?? null, []);
  const markHydrated = useCallback(() => setHydrated(true), []);

  const value = useMemo<TokenStoreValue>(
    () => ({
      tokenPayload,
      setToken,
      getToken,
      isAuthenticated: tokenPayload !== null,
      hydrated,
      markHydrated,
    }),
    [tokenPayload, setToken, getToken, hydrated, markHydrated]
  );

  return <TokenCtx.Provider value={value}>{children}</TokenCtx.Provider>;
}
