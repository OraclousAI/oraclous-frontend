// Published-agents sub-client (application-gateway-service, /v1/agents — member-managed plane).
// An admin publishes an agent under a caller-chosen slug bound to a capability/harness descriptor;
// the agent is then invocable from outside the console at /v1/agents/{slug}/invoke using an
// integration key bound to that slug (the key-public plane — not called from here). This client
// covers only the member-JWT management plane: publish + list. There is no unpublish endpoint yet
// (oraclous-backend #280), so status is read-only in the UI.
import type { ApiTransport } from './transport';

export interface PublishAgentInput {
  readonly slug: string; // lowercase alnum + hyphen, starts alnum, 1–63 chars (SLUG_PATTERN)
  readonly boundCapabilityRef: string; // the capability/harness descriptor id (manifest_ref)
  readonly displayName?: string;
  readonly description?: string;
}

export interface PublishedAgent {
  readonly id: string;
  readonly slug: string;
  readonly boundCapabilityRef: string;
  readonly displayName: string | null;
  readonly description: string | null;
  readonly status: string; // 'active' | 'unpublished'
  readonly createdAt: string | null;
}

interface PublishedAgentWire {
  id: string;
  slug: string;
  bound_capability_ref: string;
  display_name: string | null;
  description: string | null;
  status: string;
  created_at: string | null;
}

function toPublishedAgent(w: PublishedAgentWire): PublishedAgent {
  return {
    id: w.id,
    slug: w.slug,
    boundCapabilityRef: w.bound_capability_ref,
    displayName: w.display_name,
    description: w.description,
    status: w.status,
    createdAt: w.created_at,
  };
}

export interface PublishedAgentsClient {
  // Publish an agent (admin). 409 if the slug is already taken in the org.
  publish(input: PublishAgentInput): Promise<PublishedAgent>;
  // List the org's published agents (member). Bare array.
  list(): Promise<PublishedAgent[]>;
}

export function createPublishedAgentsClient(transport: ApiTransport): PublishedAgentsClient {
  return {
    async publish(input: PublishAgentInput): Promise<PublishedAgent> {
      const body: Record<string, unknown> = {
        slug: input.slug,
        bound_capability_ref: input.boundCapabilityRef,
      };
      if (input.displayName !== undefined) body['display_name'] = input.displayName;
      if (input.description !== undefined) body['description'] = input.description;
      const { data } = await transport.execute<PublishedAgentWire>({
        method: 'POST',
        path: '/v1/agents',
        body,
      });
      return toPublishedAgent(data);
    },
    async list(): Promise<PublishedAgent[]> {
      const { data } = await transport.execute<PublishedAgentWire[]>({
        method: 'GET',
        path: '/v1/agents',
      });
      return (Array.isArray(data) ? data : []).map(toPublishedAgent);
    },
  };
}
