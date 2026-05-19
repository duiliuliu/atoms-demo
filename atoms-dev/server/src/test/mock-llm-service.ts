// Mock LLM Service for testing purposes
import { BaseLLMService } from '../services/llm/BaseLLMService';
import { LLMConfig } from '../services/llm/BaseLLMService';

export class MockLLMService extends BaseLLMService {
  constructor(config: LLMConfig) {
    super(config);
  }

  async *stream(prompt: string): AsyncIterable<string> {
    // Mock stream response
    yield '```file\nindex.html\n```';
    yield '```html\n<!DOCTYPE html>\n<html>\n';
    yield '<head><title>Test</title></head>\n';
    yield '<body><h1>Hello World</h1></body>\n';
    yield '</html>\n```';
  }

  async complete(prompt: string): Promise<{ content: string }> {
    // Mock complete response for task analysis
    if (prompt.includes('task breakdown') || prompt.includes('分析')) {
      return {
        content: `{
  "userIntent": {
    "understoodGoal": "创建一个简单的网页",
    "scope": "small",
    "complexity": "simple",
    "techStack": ["HTML", "CSS"],
    "keyFeatures": ["简单的HTML页面"],
    "potentialIssues": []
  },
  "tasks": [
    {
      "id": "1",
      "type": "create_file",
      "description": "创建 index.html",
      "files": ["index.html"],
      "estimatedTokens": 200,
      "dependencies": []
    }
  ],
  "totalEstimatedTokens": 200
}`
      };
    }

    // Default response for questions
    return {
      content: '这是一个模拟回答。'
    };
  }
}
