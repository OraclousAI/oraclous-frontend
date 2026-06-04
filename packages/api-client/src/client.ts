import type { ApiTransport, TransportRequest } from './transport';
import type {
  Graph,
  CreateGraphInput,
  Document,
  Community,
  GraphMember,
  AddMemberInput,
  ServiceAccount,
  ServiceAccountCreated,
  ServiceAccountRotated,
  CreateServiceAccountInput,
  GraphData,
  FederatedQueryRequest,
  VectorSearchRequest,
} from './types/graph';
import type { Agent, CreateAgentInput, UpdateAgentInput, AgentPublishResult } from './types/agent';
import type {
  GraphChatRequest,
  GraphChatResponse,
  AgentChatRequest,
  AgentChatResponse,
  ConversationSummary,
  ConversationListParams,
  MessageListParams,
  ConversationCreateInput,
  ConversationCreateResult,
  ConversationPage,
  MessagePage,
  StreamGraphHandlers,
} from './types/chat';
import type { LLMConfig, CreateLLMConfigInput } from './types/llm';
import type {
  Organization,
  OrganizationInput,
  OrgMember,
  OrgAgent,
  OrgInvitation,
  OrgInvitationInput,
  AcceptInvitationResult,
  PublicOrganization,
  PublicInvitation,
} from './types/organization';
import type { FeedbackRating } from './types/common';
import type { GraphRole } from './types/graph';

export interface ApiClientOptions {
  // Single VITE_API_BASE_URL — no split auth URL.
  readonly baseUrl: string;
  // Caller supplies token retrieval; never stored in localStorage/sessionStorage.
  readonly getToken: () => string | null;
  readonly transport: ApiTransport;
}

// ─── Sub-client interfaces ────────────────────────────────────────────────────

export interface GraphsClient {
  list(): Promise<Graph[]>;
  get(graphId: string): Promise<Graph>;
  create(data: CreateGraphInput): Promise<Graph>;
  delete(graphId: string): Promise<void>;
}

export interface DocumentsClient {
  list(graphId: string): Promise<Document[]>;
  delete(graphId: string, documentId: string): Promise<void>;
}

export interface ChatClient {
  sendGraph(body: GraphChatRequest): Promise<GraphChatResponse>;
  sendAgent(graphId: string, agentId: string, body: AgentChatRequest): Promise<AgentChatResponse>;
  // streaming: transport-level concern; callers must provide their own SSE adapter
  streamGraph(
    body: GraphChatRequest,
    handlers: StreamGraphHandlers,
    signal?: AbortSignal
  ): Promise<void>;
}

export interface ConversationsClient {
  list(graphId: string, params?: ConversationListParams): Promise<ConversationPage>;
  create(graphId: string, input?: ConversationCreateInput): Promise<ConversationCreateResult>;
  getMessages(conversationId: string, params?: MessageListParams): Promise<MessagePage>;
  rename(conversationId: string, title: string): Promise<ConversationSummary>;
  delete(conversationId: string): Promise<void>;
}

export interface MessageFeedbackClient {
  set(messageId: string, rating: FeedbackRating, comment?: string): Promise<void>;
  clear(messageId: string): Promise<void>;
}

export interface AgentsClient {
  list(graphId: string): Promise<Agent[]>;
  get(graphId: string, agentId: string): Promise<Agent>;
  create(graphId: string, data: CreateAgentInput): Promise<{ agent_id: string }>;
  update(graphId: string, agentId: string, data: UpdateAgentInput): Promise<Agent>;
  delete(graphId: string, agentId: string): Promise<void>;
  publish(graphId: string, agentId: string): Promise<AgentPublishResult>;
  unpublish(graphId: string, agentId: string): Promise<void>;
  rotateKey(graphId: string, agentId: string): Promise<{ integration_key: string }>;
}

export interface LlmConfigClient {
  listProject(graphId: string): Promise<LLMConfig[]>;
  createProject(graphId: string, data: CreateLLMConfigInput): Promise<{ config_id: string }>;
  listOrg(): Promise<LLMConfig[]>;
  createOrg(data: CreateLLMConfigInput): Promise<{ config_id: string }>;
  deleteOrg(configId: string): Promise<void>;
}

export interface CommunitiesClient {
  list(graphId: string): Promise<Community[]>;
}

export interface MembersClient {
  list(graphId: string): Promise<{ graph_id: string; members: GraphMember[] }>;
  add(graphId: string, data: AddMemberInput): Promise<GraphMember>;
  remove(graphId: string, targetUserId: string, role: GraphRole): Promise<void>;
}

export interface ServiceAccountsClient {
  listForGraph(graphId: string): Promise<ServiceAccount[]>;
  create(graphId: string, data: CreateServiceAccountInput): Promise<ServiceAccountCreated>;
  rotateKey(accountId: string): Promise<ServiceAccountRotated>;
  delete(accountId: string): Promise<void>;
}

export interface FederationClient {
  query(body: FederatedQueryRequest): Promise<{ results: unknown[] }>;
  vectorSearch(body: VectorSearchRequest): Promise<{ results: unknown[] }>;
}

export interface GraphDataClient {
  get(graphId: string, params?: { limit?: number; node_type?: string }): Promise<GraphData>;
}

export interface OrganizationsClient {
  list(): Promise<Organization[]>;
  get(orgId: string): Promise<Organization>;
  listGraphs(orgId: string): Promise<Graph[]>;
  listMembers(orgId: string): Promise<OrgMember[]>;
  removeMember(orgId: string, userId: string): Promise<void>;
  listAgents(orgId: string): Promise<OrgAgent[]>;
  create(body: OrganizationInput): Promise<Organization>;
  update(orgId: string, body: Partial<OrganizationInput>): Promise<Organization>;
  createInvitation(orgId: string, body: OrgInvitationInput): Promise<OrgInvitation>;
  listInvitations(orgId: string): Promise<OrgInvitation[]>;
  revokeInvitation(orgId: string, invitationId: string): Promise<void>;
  acceptInvitation(token: string): Promise<AcceptInvitationResult>;
}

// Public (unauthenticated) endpoints — no token injection.
export interface PublicClient {
  getOrganizationBySlug(slug: string): Promise<PublicOrganization | null>;
  getInvitationPeek(token: string): Promise<PublicInvitation | null>;
}

export interface ApiClient {
  readonly graphs: GraphsClient;
  readonly documents: DocumentsClient;
  readonly chat: ChatClient;
  readonly conversations: ConversationsClient;
  readonly messageFeedback: MessageFeedbackClient;
  readonly agents: AgentsClient;
  readonly llmConfig: LlmConfigClient;
  readonly communities: CommunitiesClient;
  readonly members: MembersClient;
  readonly serviceAccounts: ServiceAccountsClient;
  readonly federation: FederationClient;
  readonly graphData: GraphDataClient;
  readonly organizations: OrganizationsClient;
  readonly public: PublicClient;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createApiClient(options: ApiClientOptions): ApiClient {
  const { transport } = options;

  function req<T>(
    method: TransportRequest['method'],
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const request: TransportRequest = {
      method,
      path,
      ...(body !== undefined ? { body } : {}),
      ...(signal !== undefined ? { signal } : {}),
    };
    return transport.execute<T>(request).then((r) => r.data);
  }

  function qs(params: Record<string, string | number | boolean | undefined>): string {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) p.set(k, String(v));
    }
    const s = p.toString();
    return s ? `?${s}` : '';
  }

  const graphs: GraphsClient = {
    list: () => req<Graph[]>('GET', '/api/v1/graphs'),
    get: (id) => req<Graph>('GET', `/api/v1/graphs/${id}`),
    create: (data) => req<Graph>('POST', '/api/v1/graphs', data),
    delete: (id) => req<void>('DELETE', `/api/v1/graphs/${id}`),
  };

  const documents: DocumentsClient = {
    list: (gid) => req<Document[]>('GET', `/api/v1/graphs/${gid}/documents`),
    delete: (gid, did) => req<void>('DELETE', `/api/v1/graphs/${gid}/documents/${did}`),
  };

  const chat: ChatClient = {
    sendGraph: (body) => req<GraphChatResponse>('POST', '/api/v1/chat', body),
    sendAgent: (gid, aid, body) =>
      req<AgentChatResponse>('POST', `/api/v1/graphs/${gid}/agents/${aid}/chat`, body),
    // SSE streaming is transport-level; this stub delegates to transport.execute with a streaming flag.
    // Concrete implementations should override this for their SSE runtime.
    streamGraph: (_body, _handlers, _signal) =>
      Promise.reject(new Error('streamGraph: requires a streaming-capable transport')),
  };

  const conversations: ConversationsClient = {
    list: (gid, params = {}) =>
      req<ConversationPage>(
        'GET',
        `/api/v1/graphs/${gid}/chat/conversations${qs(params as Record<string, string | number | undefined>)}`
      ),
    create: (gid, input = {}) =>
      req<ConversationCreateResult>('POST', `/api/v1/graphs/${gid}/chat/conversations`, input),
    getMessages: (cid, params = {}) =>
      req<MessagePage>(
        'GET',
        `/api/v1/chat/conversations/${cid}/messages${qs(params as Record<string, string | number | undefined>)}`
      ),
    rename: (cid, title) =>
      req<ConversationSummary>('PATCH', `/api/v1/chat/conversations/${cid}`, { title }),
    delete: (cid) => req<void>('DELETE', `/api/v1/chat/conversations/${cid}`),
  };

  const messageFeedback: MessageFeedbackClient = {
    set: (mid, rating, comment) =>
      req<void>('POST', `/api/v1/chat/messages/${mid}/feedback`, {
        rating,
        ...(comment !== undefined ? { comment } : {}),
      }),
    clear: (mid) => req<void>('DELETE', `/api/v1/chat/messages/${mid}/feedback`),
  };

  const agents: AgentsClient = {
    list: (gid) => req<Agent[]>('GET', `/api/v1/graphs/${gid}/agents`),
    get: (gid, aid) => req<Agent>('GET', `/api/v1/graphs/${gid}/agents/${aid}`),
    create: (gid, data) => req<{ agent_id: string }>('POST', `/api/v1/graphs/${gid}/agents`, data),
    update: (gid, aid, data) => req<Agent>('PATCH', `/api/v1/graphs/${gid}/agents/${aid}`, data),
    delete: (gid, aid) => req<void>('DELETE', `/api/v1/graphs/${gid}/agents/${aid}`),
    publish: (gid, aid) =>
      req<AgentPublishResult>('POST', `/api/v1/graphs/${gid}/agents/${aid}/publish`),
    unpublish: (gid, aid) => req<void>('DELETE', `/api/v1/graphs/${gid}/agents/${aid}/publish`),
    rotateKey: (gid, aid) =>
      req<{ integration_key: string }>('POST', `/api/v1/graphs/${gid}/agents/${aid}/rotate-key`),
  };

  const llmConfig: LlmConfigClient = {
    listProject: (gid) => req<LLMConfig[]>('GET', `/api/v1/graphs/${gid}/llm-configs`),
    createProject: (gid, data) =>
      req<{ config_id: string }>('POST', `/api/v1/graphs/${gid}/llm-configs`, data),
    listOrg: () => req<LLMConfig[]>('GET', '/api/v1/org/llm-configs'),
    createOrg: (data) => req<{ config_id: string }>('POST', '/api/v1/org/llm-configs', data),
    deleteOrg: (cid) => req<void>('DELETE', `/api/v1/org/llm-configs/${cid}`),
  };

  const communities: CommunitiesClient = {
    list: (gid) => req<Community[]>('GET', `/api/v1/graphs/${gid}/communities`),
  };

  const members: MembersClient = {
    list: (gid) =>
      req<{ graph_id: string; members: GraphMember[] }>('GET', `/api/v1/graphs/${gid}/members`),
    add: (gid, data) => req<GraphMember>('POST', `/api/v1/graphs/${gid}/members`, data),
    remove: (gid, uid, role) =>
      req<void>('DELETE', `/api/v1/graphs/${gid}/members/${uid}?role=${encodeURIComponent(role)}`),
  };

  const serviceAccounts: ServiceAccountsClient = {
    listForGraph: (gid) => req<ServiceAccount[]>('GET', `/api/v1/graphs/${gid}/service-accounts`),
    create: (gid, data) =>
      req<ServiceAccountCreated>('POST', `/api/v1/graphs/${gid}/service-accounts`, data),
    rotateKey: (aid) =>
      req<ServiceAccountRotated>('POST', `/api/v1/service-accounts/${aid}/rotate-key`),
    delete: (aid) => req<void>('DELETE', `/api/v1/service-accounts/${aid}`),
  };

  const federation: FederationClient = {
    query: (body) => req<{ results: unknown[] }>('POST', '/api/v1/federation/query', body),
    vectorSearch: (body) =>
      req<{ results: unknown[] }>('POST', '/api/v1/federation/vector-search', body),
  };

  const graphData: GraphDataClient = {
    get: (gid, params = {}) =>
      req<GraphData>(
        'GET',
        `/api/v1/graphs/${gid}/graph-data${qs(params as Record<string, string | number | undefined>)}`
      ),
  };

  const organizations: OrganizationsClient = {
    list: () => req<Organization[]>('GET', '/api/v1/organizations'),
    get: (oid) => req<Organization>('GET', `/api/v1/organizations/${oid}`),
    listGraphs: (oid) => req<Graph[]>('GET', `/api/v1/organizations/${oid}/graphs`),
    listMembers: (oid) => req<OrgMember[]>('GET', `/api/v1/organizations/${oid}/members`),
    removeMember: (oid, uid) => req<void>('DELETE', `/api/v1/organizations/${oid}/members/${uid}`),
    listAgents: (oid) => req<OrgAgent[]>('GET', `/api/v1/organizations/${oid}/agents`),
    create: (body) => req<Organization>('POST', '/api/v1/organizations', body),
    update: (oid, body) => req<Organization>('PATCH', `/api/v1/organizations/${oid}`, body),
    createInvitation: (oid, body) =>
      req<OrgInvitation>('POST', `/api/v1/organizations/${oid}/invitations`, body),
    listInvitations: (oid) =>
      req<OrgInvitation[]>('GET', `/api/v1/organizations/${oid}/invitations`),
    revokeInvitation: (oid, iid) =>
      req<void>('DELETE', `/api/v1/organizations/${oid}/invitations/${iid}`),
    acceptInvitation: (token) =>
      req<AcceptInvitationResult>('POST', `/api/v1/invitations/${token}/accept`),
  };

  // Public endpoints use the same transport but callers must supply an unauthenticated transport.
  const publicClient: PublicClient = {
    getOrganizationBySlug: (slug) =>
      transport
        .execute<PublicOrganization | null>({
          method: 'GET',
          path: `/public/organizations/by-slug/${encodeURIComponent(slug)}`,
        })
        .then((r) => r.data)
        .catch((e: unknown) => {
          // NOT_FOUND → null per contract
          if (e instanceof Error && 'code' in e && (e as { code?: string }).code === 'NOT_FOUND') {
            return null;
          }
          throw e;
        }),
    getInvitationPeek: (token) =>
      transport
        .execute<PublicInvitation | null>({
          method: 'GET',
          path: `/public/invitations/${encodeURIComponent(token)}`,
        })
        .then((r) => r.data)
        .catch((e: unknown) => {
          if (e instanceof Error && 'code' in e && (e as { code?: string }).code === 'NOT_FOUND') {
            return null;
          }
          throw e;
        }),
  };

  return {
    graphs,
    documents,
    chat,
    conversations,
    messageFeedback,
    agents,
    llmConfig,
    communities,
    members,
    serviceAccounts,
    federation,
    graphData,
    organizations,
    public: publicClient,
  };
}
