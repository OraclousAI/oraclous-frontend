// Capability-registry harness CRUD (/api/v1/capabilities) — the persistence step of the agent
// builder. A built OHM manifest is saved as a kind:"harness" capability; the returned id is the
// manifest_ref used by the harness execute / engine job / publish surfaces. Live-verified
// (POST 201 → executable via manifest_ref).
import type { ApiTransport } from './transport';
import type { OhmManifest } from './ohm';

export interface HarnessCapability {
  readonly id: string;
  readonly kind: string;
  readonly name: string | null;
  readonly status: string | null;
  readonly contentHash: string | null;
  readonly manifest: OhmManifest | null;
  readonly createdAt: string | null;
}

interface CapabilityWire {
  readonly id: string;
  readonly kind: string;
  readonly name?: string | null;
  readonly status?: string | null;
  readonly content_hash?: string | null;
  readonly descriptor?: unknown;
  readonly created_at?: string | null;
}

interface CapabilityListWire {
  readonly capabilities: readonly CapabilityWire[];
  readonly total: number;
}

export interface CapabilitiesClient {
  /** The org's saved agents (kind:"harness" capabilities). */
  listHarnesses(): Promise<HarnessCapability[]>;
  get(capabilityId: string): Promise<HarnessCapability>;
  /** Save a built manifest; the returned id is the agent's manifest_ref. */
  createHarness(manifest: OhmManifest): Promise<HarnessCapability>;
  updateHarness(capabilityId: string, manifest: OhmManifest): Promise<HarnessCapability>;
  remove(capabilityId: string): Promise<void>;
}

function isManifest(d: unknown): d is OhmManifest {
  return (
    typeof d === 'object' &&
    d !== null &&
    typeof (d as OhmManifest).ohm_version === 'string' &&
    typeof (d as OhmManifest).metadata === 'object'
  );
}

function toCapability(w: CapabilityWire): HarnessCapability {
  return {
    id: w.id,
    kind: w.kind,
    name: w.name ?? null,
    status: w.status ?? null,
    contentHash: w.content_hash ?? null,
    manifest: isManifest(w.descriptor) ? w.descriptor : null,
    createdAt: w.created_at ?? null,
  };
}

export function createCapabilitiesClient(transport: ApiTransport): CapabilitiesClient {
  return {
    async listHarnesses(): Promise<HarnessCapability[]> {
      const { data } = await transport.execute<CapabilityListWire>({
        method: 'GET',
        path: '/api/v1/capabilities',
      });
      const rows = Array.isArray(data?.capabilities) ? data.capabilities : [];
      return rows.filter((c) => c.kind === 'harness').map(toCapability);
    },
    async get(capabilityId: string): Promise<HarnessCapability> {
      const { data } = await transport.execute<CapabilityWire>({
        method: 'GET',
        path: `/api/v1/capabilities/${encodeURIComponent(capabilityId)}`,
      });
      return toCapability(data);
    },
    async createHarness(manifest: OhmManifest): Promise<HarnessCapability> {
      const { data } = await transport.execute<CapabilityWire>({
        method: 'POST',
        path: '/api/v1/capabilities',
        body: { kind: 'harness', descriptor: manifest },
      });
      return toCapability(data);
    },
    async updateHarness(capabilityId: string, manifest: OhmManifest): Promise<HarnessCapability> {
      const { data } = await transport.execute<CapabilityWire>({
        method: 'PUT',
        path: `/api/v1/capabilities/${encodeURIComponent(capabilityId)}`,
        body: { descriptor: manifest },
      });
      return toCapability(data);
    },
    async remove(capabilityId: string): Promise<void> {
      await transport.execute<void>({
        method: 'DELETE',
        path: `/api/v1/capabilities/${encodeURIComponent(capabilityId)}`,
      });
    },
  };
}
