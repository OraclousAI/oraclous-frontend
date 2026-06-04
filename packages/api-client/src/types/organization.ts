import type { GraphRole } from './graph';

export type { GraphRole };

export type OrgRole = 'owner' | 'admin' | 'member';
export type OrgInvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string | null;
  owner_user_id: string;
  settings: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
  org_role: OrgRole | null;
}

export interface OrganizationInput {
  name: string;
  description?: string;
  settings?: Record<string, unknown>;
  slug?: string;
  logo_url?: string;
}

export interface OrgMemberGrant {
  graph_id: string;
  role: string;
}

export interface OrgMember {
  user_id: string;
  email: string | null;
  org_role: OrgRole;
  since: string | null;
  subgraph_grants: OrgMemberGrant[];
}

export interface OrgAgent {
  agent_id: string;
  org_id: string | null;
  graph_id: string;
  name: string;
  description: string;
  active: boolean;
}

export interface SubgraphGrantSpec {
  role: GraphRole;
  graph_ids: string[] | 'all';
}

export interface OrgInvitation {
  id: string;
  org_id: string;
  email: string;
  org_role: string;
  status: OrgInvitationStatus;
  invited_by_user_id: string;
  accepted_by_user_id: string | null;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  subgraph_grants: SubgraphGrantSpec | null;
  invite_url: string | null;
  email_sent: boolean | null;
}

export interface OrgInvitationInput {
  email: string;
  org_role?: OrgRole;
  subgraph_grants?: SubgraphGrantSpec;
}

export interface AcceptInvitationResult {
  org_id: string;
  org_role: string;
  user_id: string;
}

export interface PublicOrganization {
  id: string;
  name: string;
  slug: string;
  status: string;
  logo_url: string | null;
}

export interface PublicInvitation {
  org_name: string;
  org_logo_url: string | null;
  invited_email: string;
  status: OrgInvitationStatus;
}
