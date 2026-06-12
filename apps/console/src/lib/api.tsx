// API provider — wires the real gateway transport to the in-memory token store and
// exposes typed clients via context. All gateway calls go through @oraclous/api-client
// (Gate 1: api-client-boundary); the bearer token is read live from the token store.

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  createAuthClient,
  createCapabilitiesClient,
  createCredentialsClient,
  createEngineClient,
  createExplorerClient,
  createFetchTransport,
  createGraphsClient,
  createHarnessesClient,
  createInstancesClient,
  createIntegrationKeysClient,
  createInvitationsClient,
  createOrgsClient,
  createRecipesClient,
  createSearchClient,
  createToolsClient,
  type AuthClient,
  type CapabilitiesClient,
  type CredentialsClient,
  type EngineClient,
  type ExplorerClient,
  type GraphsClient,
  type HarnessesClient,
  type InstancesClient,
  type IntegrationKeysClient,
  type InvitationsClient,
  type OrgsClient,
  type RecipesClient,
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
  readonly invitations: InvitationsClient;
  readonly instances: InstancesClient;
  readonly credentials: CredentialsClient;
  readonly explorer: ExplorerClient;
  readonly recipes: RecipesClient;
  readonly harnesses: HarnessesClient;
  readonly engine: EngineClient;
  readonly capabilities: CapabilitiesClient;
  readonly integrationKeys: IntegrationKeysClient;
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
  // getToken reads the token store's synchronously-updated ref, so the transport always sees the
  // current token — including the refetches an org switch fires immediately after swapping it.
  const { getToken } = useTokenStore();

  const value = useMemo<ApiContextValue>(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
    const transport = createFetchTransport({ baseUrl, getToken });
    return {
      auth: createAuthClient(transport),
      orgs: createOrgsClient(transport),
      graphs: createGraphsClient(transport),
      search: createSearchClient(transport),
      tools: createToolsClient(transport),
      harnesses: createHarnessesClient(transport),
      engine: createEngineClient(transport),
      capabilities: createCapabilitiesClient(transport),
      invitations: createInvitationsClient(transport),
      instances: createInstancesClient(transport),
      credentials: createCredentialsClient(transport),
      explorer: createExplorerClient(transport),
      recipes: createRecipesClient(transport),
      integrationKeys: createIntegrationKeysClient(transport),
    };
  }, [getToken]);

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}
