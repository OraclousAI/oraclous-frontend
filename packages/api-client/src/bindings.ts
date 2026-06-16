// Workspace↔harness binding sub-client (/api/v1/agent-bindings) — the many-to-many curation edge
// owned by the capability registry (ADR-029 / Contract §G2): which agents are "for" a workspace, and
// which workspaces a harness serves. The wire uses the real objects (harness_id/graph_id); the FE
// labels them "agent"/"workspace". Binding is curation/visibility only — never an authorization grant
// or an execution route. The query-parameterised endpoints all sit under one gateway prefix.
import type { ApiTransport } from './transport';

/** An agent bound to a workspace — the `?graph_id=` projection. */
export interface BoundAgent {
  readonly harnessId: string;
  readonly name: string | null;
  /** The capability kind (a harness, for an agent). */
  readonly kind: string;
  readonly summary: string | null;
}

/** A workspace a harness serves — the `?harness_id=` projection (live graphs only). */
export interface BoundGraph {
  readonly graphId: string;
  readonly name: string;
}

export interface BindingsClient {
  /** Agents bound to a workspace (live graphs only). */
  listAgentsForGraph(graphId: string): Promise<BoundAgent[]>;
  /** Workspaces a harness serves (live graphs only). */
  listGraphsForHarness(harnessId: string): Promise<BoundGraph[]>;
  /** Attach an agent to a workspace. Idempotent — `created` is false when it was already bound. */
  attachAgent(harnessId: string, graphId: string): Promise<{ created: boolean }>;
  /** Detach an agent from a workspace. */
  detachAgent(harnessId: string, graphId: string): Promise<void>;
}

interface BoundAgentWire {
  readonly harness_id: string;
  readonly name: string | null;
  readonly kind: string;
  readonly summary: string | null;
}

interface BoundGraphWire {
  readonly graph_id: string;
  readonly name: string;
}

export function createBindingsClient(transport: ApiTransport): BindingsClient {
  return {
    async listAgentsForGraph(graphId: string): Promise<BoundAgent[]> {
      const { data } = await transport.execute<BoundAgentWire[]>({
        method: 'GET',
        path: `/api/v1/agent-bindings?graph_id=${encodeURIComponent(graphId)}`,
      });
      const rows = Array.isArray(data) ? data : [];
      return rows.map((r) => ({
        harnessId: r.harness_id,
        name: r.name,
        kind: r.kind,
        summary: r.summary,
      }));
    },
    async listGraphsForHarness(harnessId: string): Promise<BoundGraph[]> {
      const { data } = await transport.execute<BoundGraphWire[]>({
        method: 'GET',
        path: `/api/v1/agent-bindings?harness_id=${encodeURIComponent(harnessId)}`,
      });
      const rows = Array.isArray(data) ? data : [];
      return rows.map((r) => ({ graphId: r.graph_id, name: r.name }));
    },
    async attachAgent(harnessId: string, graphId: string): Promise<{ created: boolean }> {
      const { data } = await transport.execute<{ created: boolean }>({
        method: 'POST',
        path: '/api/v1/agent-bindings',
        body: { harness_id: harnessId, graph_id: graphId },
      });
      return { created: data?.created === true };
    },
    async detachAgent(harnessId: string, graphId: string): Promise<void> {
      await transport.execute<void>({
        method: 'DELETE',
        path: `/api/v1/agent-bindings?harness_id=${encodeURIComponent(harnessId)}&graph_id=${encodeURIComponent(graphId)}`,
      });
    },
  };
}
