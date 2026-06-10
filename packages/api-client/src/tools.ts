// Capability-registry tools sub-client (GET /api/v1/tools) — the org's visible tool catalogue
// (platform built-in connectors unioned with any org-registered tools). Display fields live in the
// descriptor's metadata.
import type { ApiTransport } from './transport';

// A credential a tool needs to run: a requirement `type` (connection_string | api_key | oauth_token)
// from a given `provider`. The configure step maps each `type` to a stored credential id.
export interface CredentialRequirement {
  readonly type: string;
  readonly provider: string;
  readonly required: boolean;
}

export interface Tool {
  readonly id: string;
  readonly kind: string;
  /** Registry approval state — e.g. active | pending_approval. Unapproved tools can't run. */
  readonly status: string | null;
  readonly name: string;
  readonly category: string | null;
  readonly description: string | null;
  readonly documentationUrl: string | null;
  readonly credentialRequirements: readonly CredentialRequirement[];
}

interface CapabilityOutWire {
  readonly id: string;
  readonly kind: string;
  readonly status?: string | null;
  readonly name: string | null;
  readonly descriptor: {
    readonly metadata?: {
      readonly name?: string | null;
      readonly category?: string | null;
      readonly description?: string | null;
      readonly documentation_url?: string | null;
    };
    readonly spec?: {
      readonly credential_requirements?: ReadonlyArray<{
        readonly type?: string | null;
        readonly provider?: string | null;
        readonly required?: boolean | null;
      }> | null;
    } | null;
  } | null;
}

interface CapabilityListResponseWire {
  readonly capabilities: CapabilityOutWire[];
  readonly total: number;
}

export interface ToolsClient {
  list(): Promise<Tool[]>;
}

function toTool(wire: CapabilityOutWire): Tool {
  const md = wire.descriptor?.metadata;
  const reqs = wire.descriptor?.spec?.credential_requirements;
  return {
    id: wire.id,
    kind: wire.kind,
    status: wire.status ?? null,
    name: wire.name ?? md?.name ?? '(unnamed)',
    category: md?.category ?? null,
    description: md?.description ?? null,
    documentationUrl: md?.documentation_url ?? null,
    credentialRequirements: (Array.isArray(reqs) ? reqs : [])
      .filter((r): r is { type: string; provider: string; required?: boolean | null } =>
        Boolean(r && typeof r.type === 'string' && typeof r.provider === 'string')
      )
      .map((r) => ({ type: r.type, provider: r.provider, required: r.required ?? true })),
  };
}

export function createToolsClient(transport: ApiTransport): ToolsClient {
  return {
    async list(): Promise<Tool[]> {
      const { data } = await transport.execute<CapabilityListResponseWire>({
        method: 'GET',
        path: '/api/v1/tools',
      });
      // Defensive: a malformed/empty payload yields an empty catalogue, never a thrown query.
      const capabilities = Array.isArray(data?.capabilities) ? data.capabilities : [];
      return capabilities.map(toTool);
    },
  };
}
