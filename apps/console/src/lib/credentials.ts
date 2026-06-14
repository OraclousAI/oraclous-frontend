// Credential-broker hooks shared across the credential pickers. A credential is scoped to
// (user, tool); the secret is only ever SENT on create — the list returns metadata only. The
// agent builder uses these to wire a model's BYOM key (model.config.credential_id) and a tool's
// credential_mappings; the tool-instance flow (lib/agents.ts) creates+configures its own.
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type {
  CredType,
  CreateCredentialInput,
  UpdateCredentialInput,
  DataSourcesByProvider,
  Credential,
} from '@oraclous/api-client';
import { useApi } from './api.jsx';
import { useTokenStore } from './token-store.jsx';

// Model (BYOM) credentials aren't tied to a registry tool; the broker requires a tool_id, so we
// tag them with a stable sentinel ("…6d6f64" = "mod"). It's only a scope tag — the broker does
// not validate tool_id against the registry, and resolution is keyed by credential_id alone.
export const MODEL_CREDENTIAL_TOOL_ID = '00000000-0000-4000-8000-0000006d6f64';

// Standalone tool credentials (an API key or connection string added from the Connections page,
// not yet attached to a specific tool instance) carry this unscoped sentinel ("…746f6f6c" = "tool")
// so they are NOT counted as model keys. They are matched to a tool by provider when attached later.
export const UNSCOPED_CREDENTIAL_TOOL_ID = '00000000-0000-4000-8000-0000746f6f6c';

// How a tool's credential REQUIREMENT type maps onto a broker credential: the broker cred_type,
// the payload key the secret is stored under, a human label, and whether the secret can be
// entered manually (OAuth tokens come from a connect flow, not a text field). Mirrors the
// tool-instance flow's mapping so the two stay consistent.
export interface RequirementCredentialForm {
  readonly credType: CredType;
  readonly secretKey: string;
  readonly label: string;
  readonly manual: boolean;
}

export function credentialFormForRequirement(type: string): RequirementCredentialForm {
  if (type === 'connection_string')
    return {
      credType: 'raw',
      secretKey: 'connection_string',
      label: 'Connection string',
      manual: true,
    };
  if (type === 'api_key')
    return { credType: 'api_key', secretKey: 'api_key', label: 'API key', manual: true };
  if (type === 'oauth_token')
    return { credType: 'oauth', secretKey: 'token', label: 'OAuth token', manual: false };
  return { credType: 'api_key', secretKey: 'value', label: 'Secret', manual: true };
}

// A human label for each credential kind shown on the Connections page and the rename sheet.
export function credKindLabel(c: Credential): string {
  if (c.toolId === MODEL_CREDENTIAL_TOOL_ID) return 'model key';
  if (c.credType === 'api_key') return 'API key';
  if (c.credType === 'oauth') return 'OAuth';
  if (c.credType === 'raw') return 'Connection string';
  return c.credType;
}

export interface CredentialsState {
  readonly credentials: readonly Credential[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

// The signed-in user's credentials (metadata only — never the secret). Pickers filter this by
// provider / cred type / tool scope client-side.
export function useCredentials(userId: string | null): CredentialsState {
  const { credentials: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['credentials', userId],
    queryFn: () => client.list(userId ?? ''),
    enabled: isAuthenticated && userId !== null && userId !== '',
    staleTime: 30 * 1000,
  });

  return {
    credentials: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export interface ProvidersState {
  // The provider names the user has connected (i.e. holds at least one credential for).
  readonly providers: readonly string[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function useProviders(): ProvidersState {
  const { credentials: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['providers'],
    queryFn: () => client.listProviders(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  return { providers: query.data ?? [], isLoading: query.isLoading, isError: query.isError };
}

export interface DataSourcesState {
  // Connected provider → the data sources it unlocks.
  readonly dataSources: DataSourcesByProvider;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function useDataSources(): DataSourcesState {
  const { credentials: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['data-sources'],
    queryFn: () => client.listDataSources(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  return { dataSources: query.data ?? {}, isLoading: query.isLoading, isError: query.isError };
}

// Creating or removing a credential can change the connected-provider set, so the providers +
// data-sources panel must refresh too (rename leaves the provider set unchanged). Also used by the
// OAuth connect-callback page, where the backend lands the credential out of band.
export function invalidateCredentialSet(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: ['credentials'] }); // prefix → every ['credentials', userId]
  void qc.invalidateQueries({ queryKey: ['providers'] });
  void qc.invalidateQueries({ queryKey: ['data-sources'] });
}

export function useCreateCredential() {
  const { credentials: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCredentialInput): Promise<Credential> => client.create(input),
    onSuccess: () => invalidateCredentialSet(queryClient),
  });
}

export function useUpdateCredential() {
  const { credentials: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCredentialInput): Promise<Credential> => client.update(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['credentials'] });
    },
  });
}

export function useDeleteCredential() {
  const { credentials: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentialId: string): Promise<void> => client.remove(credentialId),
    onSuccess: () => invalidateCredentialSet(queryClient),
  });
}

export interface OAuthProvidersState {
  // The OAuth providers the platform has configured — i.e. the ones a user can connect via the
  // hosted flow (distinct from `useProviders`, which is the ones the user has ALREADY connected).
  readonly providers: readonly string[];
  readonly isLoading: boolean;
}

export function useOAuthProviders(): OAuthProvidersState {
  const { auth } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['oauth-providers'],
    queryFn: () => auth.oauthProviders(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  return { providers: query.data ?? [], isLoading: query.isLoading };
}

// Begin a provider connect and hand the browser off to the provider's authorize page. The
// connect-callback route (/app/oauth/connect/:provider/callback) completes the exchange, which lands
// the provider token as a broker credential server-side — the secret never touches the FE (§1.5).
// Rejects if the begin call fails (e.g. provider not configured); the caller surfaces the error.
export function useConnectProvider(): (provider: string) => Promise<void> {
  const { auth } = useApi();

  return async (provider: string): Promise<void> => {
    const redirectUri = `${window.location.origin}/app/oauth/connect/${encodeURIComponent(
      provider
    )}/callback`;
    const url = await auth.oauthConnectBegin(provider, redirectUri);
    window.location.assign(url);
  };
}
