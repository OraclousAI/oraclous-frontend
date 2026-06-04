export type AgentReasoningMode = 'direct' | 'research' | 'analytical' | 'conversational';

export type AgentTool =
  | 'graph_search'
  | 'community_members'
  | 'neighbors'
  | 'degree_centrality'
  | 'shortest_path'
  | 'taint_trace'
  | 'temporal_slice';

export interface RetrieverConfig {
  strategy: 'hybrid' | 'similarity' | 'entity';
  hop_depth: number;
  max_results: number;
}

export interface Agent {
  agent_id: string;
  graph_id: string;
  name: string;
  description: string;
  system_prompt: string;
  reasoning_mode: AgentReasoningMode;
  retriever: RetrieverConfig;
  tools: AgentTool[];
  llm_config_id: string | null;
  created_by: string;
  created_at: string;
  deactivated_at: string | null;
}

export interface CreateAgentInput {
  name: string;
  description?: string;
  system_prompt: string;
  reasoning_mode?: AgentReasoningMode;
  retriever?: Partial<RetrieverConfig>;
  tools?: AgentTool[];
  llm_config_id?: string | null;
}

export interface UpdateAgentInput {
  name?: string;
  description?: string;
  system_prompt?: string;
  reasoning_mode?: AgentReasoningMode;
  retriever?: Partial<RetrieverConfig>;
  tools?: AgentTool[];
  llm_config_id?: string | null;
}

export interface AgentPublishResult {
  slug: string;
  integration_key: string;
  endpoint_url?: string;
}
