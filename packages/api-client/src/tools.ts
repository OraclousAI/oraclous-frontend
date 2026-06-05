// Capability-registry tools sub-client (GET /api/v1/tools) — the org's visible tool catalogue
// (platform built-in connectors unioned with any org-registered tools). Display fields live in the
// descriptor's metadata.
import type { ApiTransport } from './transport';

export interface Tool {
  readonly id: string;
  readonly kind: string;
  readonly name: string;
  readonly category: string | null;
  readonly description: string | null;
  readonly documentationUrl: string | null;
}

interface CapabilityOutWire {
  readonly id: string;
  readonly kind: string;
  readonly name: string | null;
  readonly descriptor: {
    readonly metadata?: {
      readonly name?: string | null;
      readonly category?: string | null;
      readonly description?: string | null;
      readonly documentation_url?: string | null;
    };
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
  return {
    id: wire.id,
    kind: wire.kind,
    name: wire.name ?? md?.name ?? '(unnamed)',
    category: md?.category ?? null,
    description: md?.description ?? null,
    documentationUrl: md?.documentation_url ?? null,
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
