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

export interface UpdateOrgInput {
  readonly name?: string;
  readonly description?: string | null;
  readonly logoUrl?: string | null;
}

// Role changes are constrained to non-owner roles — ownership transfer is a separate concern.
export type MemberRole = 'admin' | 'member';

export interface Member {
  readonly userId: string;
  readonly email: string | null;
  readonly role: string;
  readonly since: string;
}

interface MemberWire {
  readonly user_id: string;
  readonly email: string | null;
  readonly role: string;
  readonly since: string;
}

export interface OrgsClient {
  // The organisations the authenticated user belongs to.
  list(): Promise<Org[]>;
  // Create a new organisation (the caller becomes its owner).
  create(input: CreateOrgInput): Promise<Org>;
  // A single organisation by id.
  get(orgId: string): Promise<Org>;
  // Update an organisation (owner/admin only — the server enforces it).
  update(orgId: string, input: UpdateOrgInput): Promise<Org>;
  // The organisation's member roster (any member may view).
  listMembers(orgId: string): Promise<Member[]>;
  // Change a member's role (owner/admin only — the server enforces it).
  changeMemberRole(orgId: string, userId: string, role: MemberRole): Promise<Member>;
  // Remove a member (owner/admin only).
  removeMember(orgId: string, userId: string): Promise<void>;
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

function toMember(wire: MemberWire): Member {
  return { userId: wire.user_id, email: wire.email, role: wire.role, since: wire.since };
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
    async get(orgId: string): Promise<Org> {
      const { data } = await transport.execute<OrgResponseWire>({
        method: 'GET',
        path: `/v1/orgs/${encodeURIComponent(orgId)}`,
      });
      return toOrg(data);
    },
    async update(orgId: string, input: UpdateOrgInput): Promise<Org> {
      const body: { name?: string; description?: string | null; logo_url?: string | null } = {};
      if (input.name !== undefined) body.name = input.name;
      if (input.description !== undefined) body.description = input.description;
      if (input.logoUrl !== undefined) body.logo_url = input.logoUrl;
      const { data } = await transport.execute<OrgResponseWire>({
        method: 'PATCH',
        path: `/v1/orgs/${encodeURIComponent(orgId)}`,
        body,
      });
      return toOrg(data);
    },
    async listMembers(orgId: string): Promise<Member[]> {
      const { data } = await transport.execute<MemberWire[]>({
        method: 'GET',
        path: `/v1/orgs/${encodeURIComponent(orgId)}/members`,
      });
      return data.map(toMember);
    },
    async changeMemberRole(orgId: string, userId: string, role: MemberRole): Promise<Member> {
      const { data } = await transport.execute<MemberWire>({
        method: 'PATCH',
        path: `/v1/orgs/${encodeURIComponent(orgId)}/members/${encodeURIComponent(userId)}`,
        body: { role },
      });
      return toMember(data);
    },
    async removeMember(orgId: string, userId: string): Promise<void> {
      await transport.execute<void>({
        method: 'DELETE',
        path: `/v1/orgs/${encodeURIComponent(orgId)}/members/${encodeURIComponent(userId)}`,
      });
    },
  };
}
