import { BaseLLMService } from './BaseLLMService.js';
import { DeepSeekService } from './DeepSeekService.js';
import { ZhipuService } from './ZhipuService.js';

export { BaseLLMService, DeepSeekService, ZhipuService };

export class LLMService {
  private deepseek: DeepSeekService;
  private zhipu: ZhipuService;
  private currentProvider: 'deepseek' | 'zhipu';
  
  constructor() {
    const deepseekKey = process.env.DEEPSEEK_API_KEY || '';
    const zhipuKey = process.env.ZHIPU_API_KEY || '';
    
    this.deepseek = new DeepSeekService({
      provider: 'deepseek',
      apiKey: deepseekKey,
      model: 'deepseek-chat',
    });
    
    this.zhipu = new ZhipuService({
      provider: 'zhipu',
      apiKey: zhipuKey,
      model: 'glm-4',
    });
    
    this.currentProvider = 'deepseek';
  }
  
  setProvider(provider: 'deepseek' | 'zhipu'): void {
    this.currentProvider = provider;
  }
  
  getProvider(): string {
    return this.currentProvider;
  }
  
  async stream(prompt: string): Promise<AsyncIterable<string>> {
    const service = this.getService();
    return service.stream(prompt);
  }
  
  async complete(prompt: string) {
    const service = this.getService();
    return service.complete(prompt);
  }
  
  private getService(): BaseLLMService {
    switch (this.currentProvider) {
      case 'zhipu':
        return this.zhipu;
      case 'deepseek':
      default:
        return this.deepseek;
    }
  }
}
