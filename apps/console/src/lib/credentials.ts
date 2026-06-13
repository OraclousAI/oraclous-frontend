// Credential-broker hooks shared across the credential pickers. A credential is scoped to
// (user, tool); the secret is only ever SENT on create — the list returns metadata only. The
// agent builder uses these to wire a model's BYOM key (model.config.credential_id) and a tool's
// credential_mappings; the tool-instance flow (lib/agents.ts) creates+configures its own.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CredType, CreateCredentialInput, Credential } from '@oraclous/api-client';
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

export function useCreateCredential() {
  const { credentials: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCredentialInput): Promise<Credential> => client.create(input),
    onSuccess: () => {
      // Prefix-invalidate so every ['credentials', userId] list refreshes.
      void queryClient.invalidateQueries({ queryKey: ['credentials'] });
    },
  });
}

export function useDeleteCredential() {
  const { credentials: client } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentialId: string): Promise<void> => client.remove(credentialId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['credentials'] });
    },
  });
}
