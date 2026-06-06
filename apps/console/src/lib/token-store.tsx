// In-memory auth token store — no localStorage/sessionStorage (Gate 2: no-token-in-storage).
// §3.5 invariant: tokens never touch persistent storage outside the platform's primitives.
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

export interface TokenPayload {
  token: string;
  // The rotating refresh token — held in memory only, used for silent re-issue before expiry.
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
}

const TokenCtx = createContext<TokenStoreValue>({
  tokenPayload: null,
  setToken: () => {},
  getToken: () => null,
  isAuthenticated: false,
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
  // A ref mirror updated synchronously in setToken so getToken() never lags a swap.
  const tokenRef = useRef<TokenPayload | null>(initialToken);

  const setToken = useCallback((payload: TokenPayload | null) => {
    tokenRef.current = payload;
    setTokenPayload(payload);
  }, []);

  const getToken = useCallback(() => tokenRef.current?.token ?? null, []);

  const value = useMemo<TokenStoreValue>(
    () => ({
      tokenPayload,
      setToken,
      getToken,
      isAuthenticated: tokenPayload !== null,
    }),
    [tokenPayload, setToken, getToken]
  );

  return <TokenCtx.Provider value={value}>{children}</TokenCtx.Provider>;
}
