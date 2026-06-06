// Credential-broker sub-client. A credential is scoped to (user, tool); the secret is stored
// encrypted in the broker and is only ever SENT (on create) — this client never surfaces it back
// into the UI (list maps metadata only). user_id is an explicit argument (the broker requires it).
import type { ApiTransport } from './transport';

export type CredType = 'oauth' | 'api_key' | 'raw';

export interface CreateCredentialInput {
  readonly toolId: string;
  readonly userId: string;
  readonly name?: string;
  readonly provider: string;
  readonly credType: CredType;
  readonly credential: Readonly<Record<string, string>>;
}

export interface Credential {
  readonly id: string;
  readonly name: string | null;
  readonly provider: string;
  readonly toolId: string;
  readonly credType: string;
}

interface CredentialWire {
  readonly id: string;
  readonly name: string | null;
  readonly provider: string;
  readonly tool_id: string;
  readonly cred_type: string;
}

export interface CredentialsClient {
  // The user's credentials (optionally narrowed to one tool). Secret material is NOT returned here.
  list(userId: string, toolId?: string): Promise<Credential[]>;
  create(input: CreateCredentialInput): Promise<Credential>;
  remove(credentialId: string): Promise<void>;
}

function toCredential(wire: CredentialWire): Credential {
  return {
    id: wire.id,
    name: wire.name,
    provider: wire.provider,
    toolId: wire.tool_id,
    credType: wire.cred_type,
  };
}

export function createCredentialsClient(transport: ApiTransport): CredentialsClient {
  return {
    async list(userId: string, toolId?: string): Promise<Credential[]> {
      const body: { user_id: string; tool_id?: string } = { user_id: userId };
      if (toolId !== undefined) body.tool_id = toolId;
      const { data } = await transport.execute<CredentialWire[]>({
        method: 'POST',
        path: '/credentials/retrieve/',
        body,
      });
      const list = Array.isArray(data) ? data : [];
      return list.map(toCredential);
    },
    async create(input: CreateCredentialInput): Promise<Credential> {
      const body: {
        tool_id: string;
        user_id: string;
        provider: string;
        cred_type: CredType;
        credential: Readonly<Record<string, string>>;
        name?: string;
      } = {
        tool_id: input.toolId,
        user_id: input.userId,
        provider: input.provider,
        cred_type: input.credType,
        credential: input.credential,
      };
      if (input.name !== undefined) body.name = input.name;
      const { data } = await transport.execute<CredentialWire>({
        method: 'POST',
        path: '/credentials/',
        body,
      });
      return toCredential(data);
    },
    async remove(credentialId: string): Promise<void> {
      await transport.execute<void>({
        method: 'DELETE',
        path: `/credentials/${encodeURIComponent(credentialId)}`,
      });
    },
  };
}
