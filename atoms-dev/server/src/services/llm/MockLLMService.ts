import { BaseLLMService, LLMResponse, LLMConfig } from './BaseLLMService.js';

export class MockLLMService extends BaseLLMService {
  private mockResponses: Map<string, string> = new Map();
  private defaultResponse: string = '这是一个 Mock 响应。';
  
  constructor() {
    super({
      provider: 'deepseek',
      apiKey: 'mock-key'
    });
    this.setupDefaultMockResponses();
  }

  private setupDefaultMockResponses(): void {
    this.mockResponses = new Map([
      ['建立TODO应用', '好的！我来帮你创建一个 TODO 应用。' +
        '\n\n我将创建一个完整的待办事项应用，包含以下功能：' +
        '\n- 添加待办事项' +
        '\n- 标记完成' +
        '\n- 删除待办事项' +
        '\n- 美观的界面' +
        '\n\n让我开始创建文件...'],
      ['重新做，需要有header头表明名称', '好的！我来重新制作 TODO 应用，添加 header 显示应用名称。' +
        '\n\n我会保持原有的功能，同时添加一个漂亮的 header 部分，显示应用名称 "My TODO App"' +
        '\n\n让我重新创建文件...'],
      ['天气应用', '好的！我来帮你创建一个天气应用。' +
        '\n\n我将创建一个天气预报应用，包含以下功能：' +
        '\n- 显示当前天气' +
        '\n- 温度显示' +
        '\n- 美观的界面' +
        '\n\n让我开始创建文件...'],
      ['计算器', '好的！我来帮你创建一个计算器应用。' +
        '\n\n我将创建一个完整的计算器，包含以下功能：' +
        '\n- 基本运算（加减乘除）' +
        '\n- 清除功能' +
        '\n- 美观的界面' +
        '\n\n让我开始创建文件...'],
    ]);
  }

  setMockResponse(keyword: string, response: string): void {
    this.mockResponses.set(keyword, response);
  }

  setDefaultResponse(response: string): void {
    this.defaultResponse = response;
  }

  async complete(prompt: string): Promise<LLMResponse> {
    let responseText = '';
    
    for (const [keyword, response] of this.mockResponses) {
      if (prompt.includes(keyword)) {
        responseText = response;
        break;
      }
    }
    
    if (!responseText) {
      responseText = this.defaultResponse;
    }
    
    return {
      content: responseText,
      usage: {
        promptTokens: 100,
        completionTokens: responseText.length,
        totalTokens: 100 + responseText.length
      }
    };
  }

  stream(prompt: string): AsyncIterable<string> {
    let responseText = '';
    
    for (const [keyword, response] of this.mockResponses) {
      if (prompt.includes(keyword)) {
        responseText = response;
        break;
      }
    }
    
    if (!responseText) {
      responseText = this.defaultResponse;
    }

    const chunks = responseText.split(' ').map(word => word + ' ');
    let index = 0;
    
    const asyncIterable: AsyncIterable<string> = {
      [Symbol.asyncIterator](): AsyncIterator<string> {
        return {
          async next(): Promise<IteratorResult<string>> {
            if (index < chunks.length) {
              await new Promise(resolve => setTimeout(resolve, 10));
              return { done: false, value: chunks[index++] };
            }
            return { done: true, value: undefined };
          }
        };
      }
    };
    
    return asyncIterable;
  }
}
