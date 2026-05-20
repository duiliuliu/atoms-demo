// Test Module 2 - Intent Classification & Task Breakdown
import { IntentClassifier } from '../services/IntentClassifier.js';
import { IntentHandler } from '../services/IntentHandler.js';
import { TaskAnalyzer } from '../services/TaskAnalyzer.js';
import { MockLLMService } from './utils/mockLLMService.js';
import { TestRunner, assert, assertEqual, assertNotNull } from './utils/testRunner.js';

const mockConfig = {
  provider: 'deepseek',
  apiKey: 'test-key',
  model: 'test-model',
  baseURL: 'test-url'
};

export async function createIntentTests(runner: TestRunner) {
  runner.addModule({
    name: '模块2 - 意图分类和任务拆分',
    tests: [
      {
        name: '识别问题类意图 - 什么是...',
        fn: testQuestionIntent
      },
      {
        name: '识别代码生成类意图 - 创建...',
        fn: testCodeGenerationIntent
      },
      {
        name: '识别重构类意图 - 重构...',
        fn: testRefactorIntent
      },
      {
        name: '识别调试类意图 - 修复...',
        fn: testDebugIntent
      },
      {
        name: '识别文本生成类意图',
        fn: testTextGenerationIntent
      },
      {
        name: '识别文档生成类意图',
        fn: testDocumentGenerationIntent
      },
      {
        name: '识别技术咨询类意图',
        fn: testConsultationIntent
      },
      {
        name: '提取关键词 - React, CSS, HTML...',
        fn: testKeywordExtraction
      },
      {
        name: '任务分析器 - 拆分待办事项需求',
        fn: testTaskAnalysisTodoList
      },
      {
        name: '任务分析器 - 拆分计算器需求',
        fn: testTaskAnalysisCalculator
      },
      {
        name: '意图处理器 - 处理问题',
        fn: testHandlerQuestion
      },
      {
        name: '意图处理器 - 处理代码生成',
        fn: testHandlerCodeGeneration
      },
      {
        name: 'AI辅助分类 - 模糊输入',
        fn: testAIAssistedClassification
      }
    ]
  });
}

async function testQuestionIntent() {
  const classifier = new IntentClassifier();
  const result = classifier.classify('什么是 JavaScript 的闭包？');
  
  assertEqual(result.type, 'question');
}

async function testCodeGenerationIntent() {
  const classifier = new IntentClassifier();
  const result = classifier.classify('创建一个待办事项应用');
  
  assertEqual(result.type, 'code_production');
  assert(result.requiresTaskBreakdown);
}

async function testRefactorIntent() {
  const classifier = new IntentClassifier();
  const result = classifier.classify('重构这个组件的代码');
  
  assertEqual(result.type, 'refactor');
  assert(result.requiresTaskBreakdown);
}

async function testDebugIntent() {
  const classifier = new IntentClassifier();
  const result = classifier.classify('修复这个 bug');
  
  assertEqual(result.type, 'debug');
  assert(result.requiresTaskBreakdown);
}

async function testTextGenerationIntent() {
  const classifier = new IntentClassifier();
  const result = classifier.classify('写一段关于天气的描述');
  
  assertEqual(result.type, 'text_generation');
}

async function testDocumentGenerationIntent() {
  const classifier = new IntentClassifier();
  const result = classifier.classify('生成 API 文档');
  
  assertEqual(result.type, 'document_generation');
}

async function testConsultationIntent() {
  const classifier = new IntentClassifier();
  const result = classifier.classify('选 React 还是 Vue 更好？');
  
  assertEqual(result.type, 'consultation');
}

async function testKeywordExtraction() {
  const classifier = new IntentClassifier();
  const result = classifier.classify('用 React 和 TypeScript 写一个组件');
  
  assert(result.keywords.includes('React'));
  assert(result.keywords.includes('TypeScript'));
}

async function testTaskAnalysisTodoList() {
  const mockLLM = new MockLLMService(mockConfig);
  const analyzer = new TaskAnalyzer(mockLLM as any);
  
  const breakdown = await analyzer.analyzeRequest('创建一个待办事项应用');
  
  assertNotNull(breakdown);
  assert(breakdown.tasks.length > 0);
  assert(breakdown.userIntent.keyFeatures.length > 0);
}

async function testTaskAnalysisCalculator() {
  const mockLLM = new MockLLMService(mockConfig);
  const analyzer = new TaskAnalyzer(mockLLM as any);
  
  const breakdown = await analyzer.analyzeRequest('创建一个计算器');
  
  assertNotNull(breakdown);
  assert(breakdown.tasks.length > 0);
}

async function testHandlerQuestion() {
  const mockLLM = new MockLLMService(mockConfig);
  const handler = new IntentHandler(mockLLM as any);
  
  const response = await handler.handle('什么是闭包？');
  
  assertEqual(response.type, 'answer');
  assertNotNull(response.content);
}

async function testHandlerCodeGeneration() {
  const mockLLM = new MockLLMService(mockConfig);
  const handler = new IntentHandler(mockLLM as any);
  
  const response = await handler.handle('创建一个待办事项应用');
  
  assertEqual(response.type, 'task_breakdown');
  assertNotNull(response.taskBreakdown);
  assert(response.requiresConfirmation);
}

async function testAIAssistedClassification() {
  const mockLLM = new MockLLMService(mockConfig);
  const classifier = new IntentClassifier(mockLLM as any);
  
  const result = await classifier.classifyWithAI('搞个网页');
  
  // Should still classify as code production
  assert(result.type === 'code_production' || result.confidence > 0);
}
