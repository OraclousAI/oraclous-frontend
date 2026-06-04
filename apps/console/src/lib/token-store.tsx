// In-memory auth token store — no localStorage/sessionStorage.
// §3.5 invariant: tokens never touch persistent storage outside the platform's primitives.
// Live token issuance is gateway-bound and deferred to R6; this store holds the runtime value only.

import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react';

export interface TokenPayload {
  token: string;
  email: string;
  expiresAt: number;
}

interface TokenStoreValue {
  tokenPayload: TokenPayload | null;
  setToken: (payload: TokenPayload | null) => void;
  isAuthenticated: boolean;
}

const TokenCtx = createContext<TokenStoreValue>({
  tokenPayload: null,
  setToken: () => {},
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

  const setToken = useCallback((payload: TokenPayload | null) => {
    setTokenPayload(payload);
  }, []);

  const value = useMemo<TokenStoreValue>(
    () => ({
      tokenPayload,
      setToken,
      isAuthenticated: tokenPayload !== null,
    }),
    [tokenPayload, setToken]
  );

  return <TokenCtx.Provider value={value}>{children}</TokenCtx.Provider>;
}
