// In-memory auth token store — no localStorage/sessionStorage (Gate 2: no-token-in-storage).
// §1.5 invariant: the access token lives in memory only. The rotating refresh token is the one
// credential allowed to persist, and only via the session vault (lib/session-vault.ts) — setToken
// is the single choke point that keeps the vault in sync with every session change (login, OAuth,
// silent refresh, org switch, logout).
// The session token is issued by the gateway via LoginPage and read by the API transport.

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { vaultClear, vaultWrite } from './session-vault.js';

export interface TokenPayload {
  token: string;
  // The rotating refresh token — used for silent re-issue before expiry and persisted (encrypted)
  // in the session vault so a page reload can restore the session.
  refreshToken: string;
  email: string;
  expiresAt: number;
}

interface TokenStoreValue {
  tokenPayload: TokenPayload | null;
  setToken: (payload: TokenPayload | null) => void;
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
  setToken: () => {},
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

  const setToken = useCallback((payload: TokenPayload | null) => {
    tokenRef.current = payload;
    setTokenPayload(payload);
    // Keep the vault in sync (best-effort, fire-and-forget — vault failures never break auth).
    // Writes are created in call order, and IndexedDB serialises same-store transactions in
    // creation order, so the latest setToken always wins.
    if (payload === null) {
      void vaultClear();
    } else {
      void vaultWrite({ refreshToken: payload.refreshToken, email: payload.email });
    }
  }, []);

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
