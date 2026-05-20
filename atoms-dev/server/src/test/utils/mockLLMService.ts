// Mock LLM Service for testing
import { BaseLLMService } from '../../services/llm/BaseLLMService.js';
import { LLMConfig } from '../../services/llm/BaseLLMService.js';

// Mock responses for different test scenarios
export const MOCK_RESPONSES = {
  taskBreakdown: {
    todoList: JSON.stringify({
      userIntent: {
        understoodGoal: "创建一个功能完整的待办事项应用",
        scope: "small",
        complexity: "simple",
        techStack: ["HTML", "CSS", "JavaScript"],
        keyFeatures: ["添加任务", "标记完成", "删除任务"],
        potentialIssues: []
      },
      tasks: [
        {
          id: "1",
          type: "create_file",
          description: "创建 index.html - 主页面结构",
          files: ["index.html"],
          estimatedTokens: 300,
          dependencies: []
        },
        {
          id: "2",
          type: "create_file",
          description: "创建 styles.css - 样式文件",
          files: ["styles.css"],
          estimatedTokens: 200,
          dependencies: ["1"]
        }
      ],
      totalEstimatedTokens: 500
    }),

    calculator: JSON.stringify({
      userIntent: {
        understoodGoal: "创建一个计算器应用",
        scope: "small",
        complexity: "simple",
        techStack: ["HTML", "CSS", "JavaScript"],
        keyFeatures: ["基本算术运算", "清除功能"],
        potentialIssues: []
      },
      tasks: [
        {
          id: "1",
          type: "create_file",
          description: "创建 index.html",
          files: ["index.html"],
          estimatedTokens: 250,
          dependencies: []
        }
      ],
      totalEstimatedTokens: 250
    })
  },
  question: "JavaScript 的闭包是指函数能够访问其外部作用域变量的特性，即使外部函数已经执行完毕。",
  
  textGeneration: "这是一段示例文本内容，包含了一些基本的信息。",
  
  documentGeneration: "# 文档标题\n\n## 简介\n这是一个示例文档。\n",
  
  code: "```file\nindex.html\n```\n```html\n<!DOCTYPE html>\n<html>\n<head><title>Test</title></head>\n<body><h1>Hello World</h1></body>\n</html>\n```\n"
};

export class MockLLMService extends BaseLLMService {
  private responseType: keyof typeof MOCK_RESPONSES = 'question';

  constructor(config: LLMConfig) {
    super(config);
  }

  setResponseType(type: keyof typeof MOCK_RESPONSES) {
    this.responseType = type;
  }

  async complete(prompt: string): Promise<{ content: string }> {
    let response = '';
    
    // 根据 prompt 内容智能返回不同的 mock 响应
    if (prompt.includes('任务拆分') || prompt.includes('分析用户需求')) {
      if (prompt.includes('待办') || prompt.includes('todo')) {
        response = MOCK_RESPONSES.taskBreakdown.todoList;
      } else if (prompt.includes('计算')) {
        response = MOCK_RESPONSES.taskBreakdown.calculator;
      } else {
        response = MOCK_RESPONSES.taskBreakdown.todoList;
      }
    } else if (prompt.includes('问题') || prompt.includes('什么是')) {
      response = MOCK_RESPONSES.question;
    } else if (prompt.includes('生成文本')) {
      response = MOCK_RESPONSES.textGeneration;
    } else if (prompt.includes('文档')) {
      response = MOCK_RESPONSES.documentGeneration;
    } else if (prompt.includes('代码') || prompt.includes('创建')) {
      response = MOCK_RESPONSES.code;
    } else {
      response = MOCK_RESPONSES.question;
    }
    
    return { content: response };
  }

  async *stream(prompt: string): AsyncIterable<string> {
    // Mock stream by splitting code response
    const response = MOCK_RESPONSES.code;
    const chunks = response.match(/.{1,50}/g) || [response];
    
    for (const chunk of chunks) {
      yield chunk;
    }
  }

  setProvider(provider: string) {
    // Mock - do nothing
  }
}
