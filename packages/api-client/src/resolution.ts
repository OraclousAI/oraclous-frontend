// Entity-resolution HITL sub-client (knowledge-graph-service via the gateway). Actions the
// SAME_AS_CANDIDATE review queue the explorer surfaces (#279): approve merges the pair into one
// canonical node; reject records "not a duplicate" and drops the candidate edge.
//
// candidate_id is a stable, unordered pair id the backend re-derives and verifies against the body
// pair — `sha256("{min}|{max}")` over the two endpoint node ids (the deterministic `id` the
// subgraph already surfaces). We compute it identically here so the URL and operands agree; a
// mismatch is rejected server-side, so this is the one shape the client must get exactly right.
import { ApiClientError, ErrorCode } from './errors';
import type { ApiTransport } from './transport';

export interface ApproveResult {
  readonly candidateId: string;
  readonly survivorId: string;
  readonly mergedId: string;
  readonly repointedEdges: number;
  readonly aliases: readonly string[];
}

export interface RejectResult {
  readonly candidateId: string;
  readonly nodeIdA: string;
  readonly nodeIdB: string;
  readonly suppressed: boolean;
}

interface ApproveWire {
  candidate_id: string;
  survivor_id: string;
  merged_id: string;
  repointed_edges: number;
  aliases: string[];
}

interface RejectWire {
  candidate_id: string;
  node_id_a: string;
  node_id_b: string;
  suppressed: boolean;
}

// sha256("{lo}|{hi}") hex, lo/hi the trimmed node ids sorted — byte-for-byte the backend's formula
// (knowledge-graph domain/resolution.candidate_id). Node ids are ascii hex, so a lexicographic sort
// matches the server's `sorted()`.
async function candidateId(nodeIdA: string, nodeIdB: string): Promise<string> {
  // crypto.subtle exists only in a secure context (HTTPS, or localhost). Guard explicitly — like
  // the session vault does — so a non-secure origin gets a clear message instead of a raw TypeError
  // that the UI would mis-report as a transient failure.
  if (typeof crypto === 'undefined' || crypto.subtle === undefined) {
    throw new ApiClientError(
      {
        error: {
          code: ErrorCode.SERVICE_UNAVAILABLE,
          message: 'A secure (HTTPS) context is required to review resolution candidates.',
          requestId: 'req_clientsynthetic',
          retryable: false,
        },
      },
      0
    );
  }
  const a = nodeIdA.trim();
  const b = nodeIdB.trim();
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  const bytes = new TextEncoder().encode(`${lo}|${hi}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}

export interface ResolutionClient {
  // Approve (merge) a candidate pair. `canonicalNodeId` is the survivor; the other is folded into
  // it. Returns the surviving node + what changed so the caller can refresh the graph.
  approve(graphId: string, canonicalNodeId: string, otherNodeId: string): Promise<ApproveResult>;
  // Reject a candidate pair (records "not a duplicate"; drops the SAME_AS_CANDIDATE edge). Order of
  // the two node ids is immaterial.
  reject(graphId: string, nodeIdA: string, nodeIdB: string): Promise<RejectResult>;
}

export function createResolutionClient(transport: ApiTransport): ResolutionClient {
  return {
    async approve(
      graphId: string,
      canonicalNodeId: string,
      otherNodeId: string
    ): Promise<ApproveResult> {
      const cid = await candidateId(canonicalNodeId, otherNodeId);
      const { data } = await transport.execute<ApproveWire>({
        method: 'POST',
        path: `/api/v1/graphs/${encodeURIComponent(graphId)}/resolution/${encodeURIComponent(
          cid
        )}/approve`,
        body: { canonical_node_id: canonicalNodeId, other_node_id: otherNodeId },
      });
      return {
        candidateId: data.candidate_id,
        survivorId: data.survivor_id,
        mergedId: data.merged_id,
        repointedEdges: data.repointed_edges,
        aliases: data.aliases,
      };
    },
    async reject(graphId: string, nodeIdA: string, nodeIdB: string): Promise<RejectResult> {
      const cid = await candidateId(nodeIdA, nodeIdB);
      const { data } = await transport.execute<RejectWire>({
        method: 'POST',
        path: `/api/v1/graphs/${encodeURIComponent(graphId)}/resolution/${encodeURIComponent(
          cid
        )}/reject`,
        body: { canonical_node_id: nodeIdA, other_node_id: nodeIdB },
      });
      return {
        candidateId: data.candidate_id,
        nodeIdA: data.node_id_a,
        nodeIdB: data.node_id_b,
        suppressed: data.suppressed,
      };
    },
  };
}
