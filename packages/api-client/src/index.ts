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
// NOTE: the legacy createApiClient scaffold's chat types (ChatClient/ConversationsClient/
// MessageFeedbackClient) are intentionally NOT re-exported — they target non-existent /api/v1/chat
// paths and are unwired. The live chat surface is `createChatClient` (./chat, /v1/chat/threads).
export { createApiClient } from './client';
export type {
  ApiClient,
  ApiClientOptions,
  DocumentsClient,
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
export type { OrgsClient, Org, CreateOrgInput, UpdateOrgInput, Member, MemberRole } from './orgs';

// Org invitations sub-client
export { createInvitationsClient } from './invitations';
export type {
  InvitationsClient,
  Invitation,
  CreatedInvitation,
  CreateInvitationInput,
  InvitationPeek,
  AcceptedInvitation,
} from './invitations';

// Knowledge-graph sub-client
export { createGraphsClient } from './graphs';
export type {
  GraphsClient,
  Graph,
  CreateGraphInput,
  UpdateGraphInput,
  IngestTextInput,
  IngestJob,
  Ontology,
  OntologyInput,
  OntologyMode,
} from './graphs';

// Retrieval/search sub-client
export { createSearchClient } from './search';
export type { SearchClient, SearchMode, SearchInput, SearchResult } from './search';

// Explorer graph-read sub-client (subgraph for the sphere visualisation)
export { createExplorerClient } from './explorer';
export type { ExplorerClient, Subgraph, GraphNode, GraphEdge } from './explorer';

// Entity-resolution HITL sub-client (approve/reject SAME_AS_CANDIDATE pairs)
export { createResolutionClient } from './resolution';
export type { ResolutionClient, ApproveResult, RejectResult } from './resolution';

// Chat sub-client (member chat threads — synchronous turns, /v1/chat/threads)
export { createChatClient } from './chat';
export type { ChatClient, ChatThread, ChatMessage, ChatTurn, ChatTurnStatus } from './chat';

// Recipe library sub-client
export { createRecipesClient } from './recipes';
export type {
  RecipesClient,
  Recipe,
  RecipeDetail,
  RecipeDocument,
  RecipeTemplate,
  StoredRecipe,
  DryRunInput,
  DryRunResult,
  RecipeAppliesTo,
  RecipeAuthoring,
  RecipeDefaults,
  RecipeMapping,
  RecipeExtraction,
} from './recipes';

// Capability-registry tools sub-client
export { createToolsClient } from './tools';
export type {
  ToolsClient,
  Tool,
  ToolCapability,
  CredentialRequirement,
  ImportMcpInput,
  RegisterToolInput,
} from './tools';

// Credential-broker sub-client
export { createCredentialsClient } from './credentials';
export type {
  CredentialsClient,
  Credential,
  CreateCredentialInput,
  UpdateCredentialInput,
  DataSourcesByProvider,
  CredType,
} from './credentials';

// Integration-keys sub-client (developer/embed surface — display-once tokens)
export { createIntegrationKeysClient } from './integrationKeys';
export type { IntegrationKeysClient, MintKeyInput, MintedKey, KeySummary } from './integrationKeys';

// Published-agents sub-client (developer/embed surface — the public invoke plane's management side)
export { createPublishedAgentsClient } from './publishedAgents';
export type { PublishedAgentsClient, PublishAgentInput, PublishedAgent } from './publishedAgents';

// Webhook-subscriptions sub-client (developer/embed surface — display-once signing secret)
export { createWebhookSubscriptionsClient } from './webhookSubscriptions';
export type {
  WebhookSubscriptionsClient,
  SignatureScheme,
  CreateSubscriptionInput,
  CreatedSubscription,
  Subscription,
} from './webhookSubscriptions';

// Capability-registry instances/executions sub-client (the "use a tool" loop)
export { createInstancesClient } from './instances';
export type {
  InstancesClient,
  Instance,
  InstanceStatus,
  CreateInstanceInput,
  ValidationReport,
  ValidationError,
  Execution,
  ExecutionStatus,
} from './instances';

// ── OHM manifests (the agent-builder document model) ─────────────────────────
export type {
  OhmManifest,
  OhmMetadata,
  OhmCapability,
  OhmModel,
  OhmPrompt,
  OhmActor,
  OhmGovernance,
  OhmRuntime,
} from './ohm';

// ── Harness runtime (synchronous OHM execution + execution records) ──────────
export { createHarnessesClient } from './harnesses';
export type {
  HarnessesClient,
  HarnessExecution,
  HarnessExecutionStatus,
  HarnessStep,
  ExecuteHarnessInput,
  HarnessAssignment,
  HarnessAssignmentStatus,
  ResumeDecision,
  Spend,
  SpendByModel,
} from './harnesses';

// ── Execution engine (durable jobs + activity feed) ──────────────────────────
export { createEngineClient, isJobTerminal } from './engine';
export type { EngineClient, Job, JobState, SubmitJobInput, EngineActivityEvent } from './engine';

// ── Capability registry: harness (saved-agent) CRUD ──────────────────────────
export { createCapabilitiesClient } from './capabilities';
export type { CapabilitiesClient, HarnessCapability } from './capabilities';
