export interface LLMConfig {
  config_id: string;
  provider: 'openai' | 'anthropic' | 'openrouter' | 'local';
  model_name: string;
  is_active: boolean;
}

export interface CreateLLMConfigInput {
  provider: string;
  model_name: string;
  api_key: string;
}
