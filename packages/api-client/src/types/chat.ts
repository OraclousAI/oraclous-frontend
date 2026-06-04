import type { CursorPage, FeedbackRating } from './common';

export type { CursorPage, FeedbackRating };

export type ChatMode = 'enhanced' | 'simple' | 'hybrid' | 'hybrid_plus' | 'natural';
export type RetrieverType =
  | 'vector'
  | 'vector_cypher'
  | 'hybrid'
  | 'hybrid_cypher'
  | 'text2cypher'
  | 'community_summary';

export interface SourceCitation {
  document_id?: string;
  document_path?: string;
  filename?: string;
  excerpt?: string;
  page?: number;
  relevance_score?: number;
  entities?: string[];
}

export interface GraphChatRequest {
  query: string;
  graph_id: string;
  mode?: ChatMode;
  retriever_type?: RetrieverType;
  return_context?: boolean;
  include_sources?: boolean;
  conversation_id?: string;
}

export interface GraphChatResponse {
  answer: string;
  query: string;
  graph_id: string;
  success: boolean;
  mode: string;
  retriever_type: string;
  is_grounded: boolean;
  confidence?: number | null;
  cache_hit?: boolean;
  sources?: SourceCitation[];
  conversation_id: string;
}

export interface AgentChatRequest {
  message: string;
  session_id?: string;
  conversation_id?: string;
}

export interface AgentChatResponse {
  response: string;
  session_id?: string | null;
  conversation_id: string;
  provenance: {
    nodes: Array<Record<string, unknown>>;
    edges: Array<Record<string, unknown>>;
    queries_executed: string[];
    nodes_used_in_response: string[];
    total_nodes_traversed: number;
    reasoning_steps: number;
    tools_called: string[];
  };
}

export interface ConversationSummary {
  id: string;
  agent_id: string | null;
  title: string;
  created_at: string;
  last_message_at: string | null;
}

export interface BackendSourceInfo {
  node_id?: string | null;
  node_labels?: string[] | null;
  document_path?: string | null;
  chunk_id?: string | null;
  relevance_score?: number | null;
  content?: string | null;
  entities?: string[] | null;
  properties?: Record<string, unknown> | null;
}

export interface ToolCallMetadata {
  id: string;
  sequence_index: number;
  tool_name: string;
  args_json: Record<string, unknown> | null;
  result_summary: string | null;
  result_truncated: boolean;
  latency_ms: number | null;
  error: string | null;
}

export interface MessageWithMetadata {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  model: string | null;
  provider: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  latency_ms: number | null;
  cost_usd: string | null;
  reasoning_mode: string | null;
  retriever_used: string | null;
  error: string | null;
  cancelled: boolean;
  sources: BackendSourceInfo[] | null;
  feedback_rating: FeedbackRating | null;
  feedback_comment: string | null;
  feedback_at: string | null;
  tool_calls: ToolCallMetadata[];
}

export interface StreamGraphMeta {
  type: 'meta';
  conversation_id: string;
}

export interface StreamGraphSource {
  type: 'source';
  node_id: string;
  node_labels?: string[] | null;
  relevance_score?: number | null;
  content?: string;
}

export interface StreamGraphChunk {
  type: 'answer_chunk';
  text: string;
}

export interface StreamGraphDone {
  type: 'done';
  confidence?: number | null;
  is_grounded?: boolean;
  retriever_used?: string;
}

export interface StreamGraphError {
  type: 'error';
  message: string;
}

export type StreamGraphEvent =
  | StreamGraphMeta
  | StreamGraphSource
  | StreamGraphChunk
  | StreamGraphDone
  | StreamGraphError;

export interface StreamGraphHandlers {
  onMeta?: (event: StreamGraphMeta) => void;
  onSource?: (event: StreamGraphSource) => void;
  onChunk?: (text: string) => void;
  onDone?: (event: StreamGraphDone) => void;
  onError?: (message: string) => void;
}

export type ConversationListParams = {
  agent_id?: string;
  limit?: number;
  before?: string;
};

export type MessageListParams = {
  limit?: number;
  before?: string;
};

export type ConversationCreateInput = {
  agent_id?: string;
  title?: string;
};

export type ConversationCreateResult = { id: string; title: string };

export type ConversationPage = CursorPage<ConversationSummary>;
export type MessagePage = CursorPage<MessageWithMetadata>;
