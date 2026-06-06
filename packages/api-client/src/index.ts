// ORA-56 error envelope — re-exported for consumers
export { ErrorCode, RETRYABLE_BY_DEFAULT, ApiClientError } from './errors';
export type { ApiError, ApiErrorDetail, ApiErrorEnvelope } from './errors';

// Transport interface — consumers who build custom transports depend on this
export type { ApiTransport, TransportRequest, TransportResponse } from './transport';

// Domain types (legacy scaffold; Graph/CreateGraphInput now come from ./graphs)
export type {
  Document,
  Community,
  GraphMember,
  AddMemberInput,
  ServiceAccount,
  ServiceAccountCreated,
  ServiceAccountRotated,
  CreateServiceAccountInput,
  GraphData,
  GraphDataNode,
  GraphDataEdge,
  FederatedQueryRequest,
  VectorSearchRequest,
  GraphRole,
  ServiceAccountLevel,
} from './types/graph';
export type {
  Agent,
  CreateAgentInput,
  UpdateAgentInput,
  AgentPublishResult,
  AgentReasoningMode,
  AgentTool,
  RetrieverConfig,
} from './types/agent';
export type {
  GraphChatRequest,
  GraphChatResponse,
  AgentChatRequest,
  AgentChatResponse,
  ConversationSummary,
  MessageWithMetadata,
  BackendSourceInfo,
  ToolCallMetadata,
  StreamGraphEvent,
  StreamGraphHandlers,
  StreamGraphMeta,
  StreamGraphSource,
  StreamGraphChunk,
  StreamGraphDone,
  StreamGraphError,
  ConversationListParams,
  MessageListParams,
  ConversationCreateInput,
  ConversationCreateResult,
  ConversationPage,
  MessagePage,
  ChatMode,
  RetrieverType,
  SourceCitation,
} from './types/chat';
export type { LLMConfig, CreateLLMConfigInput } from './types/llm';
export type {
  Organization,
  OrganizationInput,
  OrgMember,
  OrgAgent,
  OrgInvitation,
  OrgInvitationInput,
  AcceptInvitationResult,
  PublicOrganization,
  PublicInvitation,
  OrgRole,
  OrgInvitationStatus,
  SubgraphGrantSpec,
} from './types/organization';
export type { CursorPage, FeedbackRating } from './types/common';

// Client factory
export { createApiClient } from './client';
export type {
  ApiClient,
  ApiClientOptions,
  DocumentsClient,
  ChatClient,
  ConversationsClient,
  MessageFeedbackClient,
  AgentsClient,
  LlmConfigClient,
  CommunitiesClient,
  MembersClient,
  ServiceAccountsClient,
  FederationClient,
  GraphDataClient,
  OrganizationsClient,
  PublicClient,
} from './client';

// Mock seam — importable in test environments; no live calls
export { createMockTransport } from './mock';
export type { MockTransport } from './mock';

// Real gateway transport
export { createFetchTransport } from './fetch-transport';
export type { FetchTransportOptions } from './fetch-transport';

// Auth sub-client (pre-session: login is a public gateway path)
export { createAuthClient } from './auth';
export type { AuthClient } from './auth';
export type { LoginInput, AuthSession, AuthPrincipal } from './types/auth';

// Organisations sub-client
export { createOrgsClient } from './orgs';
export type { OrgsClient, Org, CreateOrgInput } from './orgs';

// Knowledge-graph sub-client
export { createGraphsClient } from './graphs';
export type {
  GraphsClient,
  Graph,
  CreateGraphInput,
  UpdateGraphInput,
  IngestTextInput,
  IngestJob,
} from './graphs';

// Retrieval/search sub-client
export { createSearchClient } from './search';
export type { SearchClient, SearchMode, SearchInput, SearchResult } from './search';

// Capability-registry tools sub-client
export { createToolsClient } from './tools';
export type { ToolsClient, Tool } from './tools';
