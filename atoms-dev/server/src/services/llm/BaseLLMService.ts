export interface LLMConfig {
  provider: 'deepseek' | 'zhipu';
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export abstract class BaseLLMService {
  protected config: LLMConfig;
  
  constructor(config: LLMConfig) {
    this.config = config;
  }
  
  abstract stream(prompt: string): AsyncIterable<string>;
  abstract complete(prompt: string): Promise<LLMResponse>;
}
