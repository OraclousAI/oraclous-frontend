export interface Graph {
  id: string;
  name: string;
  description?: string | null;
  user_id?: string;
  org_id?: string | null;
  created_at: string;
  updated_at: string;
  node_count: number;
  relationship_count: number;
  status: string;
}

export interface CreateGraphInput {
  name: string;
  description?: string;
  org_id?: string;
}

export interface Document {
  document_id: string;
  filename: string;
  file_type: string;
  status: 'processing' | 'ready' | 'error';
  node_count?: number;
  created_at: string;
  error_message?: string;
}

export interface Community {
  community_id: string;
  level: number;
  label: string;
  size: number;
  summary?: string;
}

export type GraphRole = 'owner' | 'admin' | 'editor' | 'viewer' | 'restricted_viewer';

export interface GraphMember {
  user_id: string;
  email: string | null;
  role: GraphRole;
  granted_at: string | null;
  expires_at: string | null;
}

export interface AddMemberInput {
  user_id: string;
  role: GraphRole;
  email?: string;
  expires_at?: string | null;
}

export type ServiceAccountLevel = 'reader' | 'writer' | 'admin';

export interface ServiceAccount {
  service_account_id: string;
  name: string;
  description: string;
  home_graph_id: string;
  tenant_id: string;
  status: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
}

export interface ServiceAccountCreated extends ServiceAccount {
  api_key: string;
}

export interface ServiceAccountRotated {
  service_account_id: string;
  key_prefix: string;
  api_key: string;
  rotated_at: string;
}

export interface CreateServiceAccountInput {
  name: string;
  description?: string;
  level?: ServiceAccountLevel;
  expires_at?: string | null;
}

export interface GraphDataNode {
  id: string;
  label: string;
  type?: string | null;
  community_id?: string | null;
  degree?: number;
  properties?: Record<string, unknown> | null;
}

export interface GraphDataEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  weight?: number;
}

export interface GraphData {
  nodes: GraphDataNode[];
  edges: GraphDataEdge[];
  truncated: boolean;
}

export interface FederatedQueryRequest {
  query: string;
  graph_ids: string[];
}

export interface VectorSearchRequest {
  query: string;
  graph_ids: string[];
  top_k?: number;
}
