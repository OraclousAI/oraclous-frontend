// Org invitations sub-client. create/list/revoke are org-scoped (owner/admin); peek/accept take the
// raw token in the body (the authenticated invitee). The raw token is returned exactly once, on create.
import type { ApiTransport } from './transport';

export interface CreateInvitationInput {
  readonly email: string;
  readonly role: string;
}

export interface Invitation {
  readonly id: string;
  readonly organisationId: string;
  readonly email: string;
  readonly role: string;
  readonly status: string;
}

// create() additionally returns the raw token (once) to share with the invitee.
export interface CreatedInvitation extends Invitation {
  readonly token: string;
}

export interface InvitationPeek {
  readonly organisationId: string;
  readonly organisationName: string | null;
  readonly email: string;
  readonly role: string;
  readonly status: string;
}

export interface AcceptedInvitation {
  readonly organisationId: string;
  readonly role: string;
}

interface InvitationWire {
  readonly id: string;
  readonly organisation_id: string;
  readonly email: string;
  readonly role: string;
  readonly status: string;
}
interface CreatedInvitationWire extends InvitationWire {
  readonly token: string;
}
interface PeekWire {
  readonly organisation_id: string;
  readonly organisation_name: string | null;
  readonly email: string;
  readonly role: string;
  readonly status: string;
}
interface AcceptWire {
  readonly organisation_id: string;
  readonly role: string;
}

export interface InvitationsClient {
  create(orgId: string, input: CreateInvitationInput): Promise<CreatedInvitation>;
  list(orgId: string): Promise<Invitation[]>;
  revoke(orgId: string, invitationId: string): Promise<void>;
  peek(token: string): Promise<InvitationPeek>;
  accept(token: string): Promise<AcceptedInvitation>;
}

function toInvitation(wire: InvitationWire): Invitation {
  return {
    id: wire.id,
    organisationId: wire.organisation_id,
    email: wire.email,
    role: wire.role,
    status: wire.status,
  };
}

export function createInvitationsClient(transport: ApiTransport): InvitationsClient {
  return {
    async create(orgId: string, input: CreateInvitationInput): Promise<CreatedInvitation> {
      const { data } = await transport.execute<CreatedInvitationWire>({
        method: 'POST',
        path: `/v1/orgs/${encodeURIComponent(orgId)}/invitations`,
        body: { email: input.email, role: input.role },
      });
      return { ...toInvitation(data), token: data.token };
    },
    async list(orgId: string): Promise<Invitation[]> {
      const { data } = await transport.execute<InvitationWire[]>({
        method: 'GET',
        path: `/v1/orgs/${encodeURIComponent(orgId)}/invitations`,
      });
      return data.map(toInvitation);
    },
    async revoke(orgId: string, invitationId: string): Promise<void> {
      await transport.execute<void>({
        method: 'DELETE',
        path: `/v1/orgs/${encodeURIComponent(orgId)}/invitations/${encodeURIComponent(invitationId)}`,
      });
    },
    async peek(token: string): Promise<InvitationPeek> {
      const { data } = await transport.execute<PeekWire>({
        method: 'POST',
        path: '/v1/invitations/peek',
        body: { token },
      });
      return {
        organisationId: data.organisation_id,
        organisationName: data.organisation_name,
        email: data.email,
        role: data.role,
        status: data.status,
      };
    },
    async accept(token: string): Promise<AcceptedInvitation> {
      const { data } = await transport.execute<AcceptWire>({
        method: 'POST',
        path: '/v1/invitations/accept',
        body: { token },
      });
      return { organisationId: data.organisation_id, role: data.role };
    },
  };
}
