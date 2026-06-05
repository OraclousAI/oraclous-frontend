// Organisations sub-client (GET /v1/orgs). Focused on the real gateway route — the
// scaffolded createApiClient().organizations targets a different (legacy) path.
import type { ApiTransport } from './transport';

export interface Org {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly status: string;
  readonly description: string | null;
  readonly logoUrl: string | null;
  readonly ownerUserId: string;
}

interface OrgResponseWire {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly status: string;
  readonly description: string | null;
  readonly logo_url: string | null;
  readonly owner_user_id: string;
}

export interface CreateOrgInput {
  readonly name: string;
}

export interface OrgsClient {
  // The organisations the authenticated user belongs to.
  list(): Promise<Org[]>;
  // Create a new organisation (the caller becomes its owner).
  create(input: CreateOrgInput): Promise<Org>;
}

function toOrg(wire: OrgResponseWire): Org {
  return {
    id: wire.id,
    name: wire.name,
    slug: wire.slug,
    status: wire.status,
    description: wire.description,
    logoUrl: wire.logo_url,
    ownerUserId: wire.owner_user_id,
  };
}

export function createOrgsClient(transport: ApiTransport): OrgsClient {
  return {
    async list(): Promise<Org[]> {
      const { data } = await transport.execute<OrgResponseWire[]>({
        method: 'GET',
        path: '/v1/orgs',
      });
      return data.map(toOrg);
    },
    async create(input: CreateOrgInput): Promise<Org> {
      const { data } = await transport.execute<OrgResponseWire>({
        method: 'POST',
        path: '/v1/orgs',
        body: { name: input.name },
      });
      return toOrg(data);
    },
  };
}
