// API provider — wires the real gateway transport to the in-memory token store and
// exposes typed clients via context. All gateway calls go through @oraclous/api-client
// (Gate 1: api-client-boundary); the bearer token is read live from the token store.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  createAuthClient,
  createFetchTransport,
  createGraphsClient,
  createOrgsClient,
  createSearchClient,
  createToolsClient,
  type AuthClient,
  type GraphsClient,
  type OrgsClient,
  type SearchClient,
  type ToolsClient,
} from '@oraclous/api-client';
import { useTokenStore } from './token-store.jsx';

interface ApiContextValue {
  readonly auth: AuthClient;
  readonly orgs: OrgsClient;
  readonly graphs: GraphsClient;
  readonly search: SearchClient;
  readonly tools: ToolsClient;
}

const ApiContext = createContext<ApiContextValue | null>(null);

export function useApi(): ApiContextValue {
  const value = useContext(ApiContext);
  if (value === null) {
    throw new Error('useApi must be used within <ApiProvider>');
  }
  return value;
}

export function ApiProvider({ children }: { children: ReactNode }) {
  const { tokenPayload } = useTokenStore();

  // The token changes across the session; the transport reads the latest value via a
  // ref so the client keeps a stable identity (created once) regardless of token churn.
  const tokenRef = useRef<string | null>(tokenPayload?.token ?? null);
  useEffect(() => {
    tokenRef.current = tokenPayload?.token ?? null;
  }, [tokenPayload]);

  const getToken = useCallback(() => tokenRef.current, []);

  const value = useMemo<ApiContextValue>(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
    const transport = createFetchTransport({ baseUrl, getToken });
    return {
      auth: createAuthClient(transport),
      orgs: createOrgsClient(transport),
      graphs: createGraphsClient(transport),
      search: createSearchClient(transport),
      tools: createToolsClient(transport),
    };
  }, [getToken]);

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}
