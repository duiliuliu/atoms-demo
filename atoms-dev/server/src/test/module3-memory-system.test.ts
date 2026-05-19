// Test Module 3 - Memory System
import * as path from 'path';
import { MemoryManager } from '../services/MemoryManager.js';
import { TestRunner, cleanTestDir, assert, assertEqual, assertNotNull } from './utils/testRunner.js';

const TEST_MEMORY_DIR = path.join(process.cwd(), 'test-sandbox-memory');
const TEST_USER = 'test-user-001';

export async function createMemoryTests(runner: TestRunner) {
  runner.addModule({
    name: '模块3 - 记忆体系',
    tests: [
      {
        name: '创建项目记忆',
        fn: testCreateProjectMemory
      },
      {
        name: '添加用户消息',
        fn: testAddUserMessage
      },
      {
        name: '添加助手消息',
        fn: testAddAssistantMessage
      },
      {
        name: '添加完成的功能',
        fn: testAddCompletedFeature
      },
      {
        name: '构建上下文 - 包含对话历史',
        fn: testBuildContextWithHistory
      },
      {
        name: '添加多条对话 - 测试截断',
        fn: testConversationTruncation
      },
      {
        name: '内存缓存 - 延迟写入',
        fn: testMemoryCacheWithDelay
      },
      {
        name: '完整对话流程测试',
        fn: testFullConversationFlow
      }
    ]
  });
}

async function testCreateProjectMemory() {
  cleanTestDir(TEST_MEMORY_DIR);
  const manager = new MemoryManager(path.join(TEST_MEMORY_DIR, 'memory'));
  
  await manager.createProjectMemory('test-proj-1', TEST_USER, 'My Test Project');
  
  const context = await manager.buildContext(TEST_USER, 'test-proj-1');
  assertNotNull(context);
}

async function testAddUserMessage() {
  cleanTestDir(TEST_MEMORY_DIR);
  const manager = new MemoryManager(path.join(TEST_MEMORY_DIR, 'memory'));
  
  await manager.createProjectMemory('test-proj-2', TEST_USER, 'Project');
  await manager.addUserMessage('test-proj-2', TEST_USER, '你好，请创建一个网站');
  
  const context = await manager.buildContext(TEST_USER, 'test-proj-2');
  assert(context.includes('你好'));
}

async function testAddAssistantMessage() {
  cleanTestDir(TEST_MEMORY_DIR);
  const manager = new MemoryManager(path.join(TEST_MEMORY_DIR, 'memory'));
  
  await manager.createProjectMemory('test-proj-3', TEST_USER, 'Project');
  await manager.addUserMessage('test-proj-3', TEST_USER, '用户消息');
  await manager.addAssistantMessage('test-proj-3', '助手回复');
  
  const context = await manager.buildContext(TEST_USER, 'test-proj-3');
  assert(context.includes('助手回复'));
}

async function testAddCompletedFeature() {
  cleanTestDir(TEST_MEMORY_DIR);
  const manager = new MemoryManager(path.join(TEST_MEMORY_DIR, 'memory'));
  
  await manager.createProjectMemory('test-proj-4', TEST_USER, 'Project');
  await manager.addCompletedFeature('test-proj-4', '首页');
  await manager.addCompletedFeature('test-proj-4', '用户登录');
  
  const context = await manager.buildContext(TEST_USER, 'test-proj-4');
  assert(context.includes('首页'));
}

async function testBuildContextWithHistory() {
  cleanTestDir(TEST_MEMORY_DIR);
  const manager = new MemoryManager(path.join(TEST_MEMORY_DIR, 'memory'));
  
  await manager.createProjectMemory('test-proj-5', TEST_USER, 'Project');
  await manager.addUserMessage('test-proj-5', TEST_USER, '第一轮对话');
  await manager.addAssistantMessage('test-proj-5', '第一轮回复');
  await manager.addUserMessage('test-proj-5', TEST_USER, '第二轮对话');
  await manager.addAssistantMessage('test-proj-5', '第二轮回复');
  
  const context = await manager.buildContext(TEST_USER, 'test-proj-5');
  
  // Should include both rounds of conversation
  assert(context.includes('第一轮'));
  assert(context.includes('第二轮'));
}

async function testConversationTruncation() {
  cleanTestDir(TEST_MEMORY_DIR);
  const manager = new MemoryManager(path.join(TEST_MEMORY_DIR, 'memory'));
  
  await manager.createProjectMemory('test-proj-6', TEST_USER, 'Project');
  
  // Add 100 conversations - should truncate
  for (let i = 1; i <= 100; i++) {
    await manager.addUserMessage('test-proj-6', TEST_USER, `对话 ${i}`);
    await manager.addAssistantMessage('test-proj-6', `回复 ${i}`);
  }
  
  const context = await manager.buildContext(TEST_USER, 'test-proj-6');
  
  // Should still work and not crash
  assertNotNull(context);
  assert(context.length > 0);
}

async function testMemoryCacheWithDelay() {
  cleanTestDir(TEST_MEMORY_DIR);
  const manager = new MemoryManager(path.join(TEST_MEMORY_DIR, 'memory'));
  
  await manager.createProjectMemory('test-proj-7', TEST_USER, 'Project');
  
  // Write many things in quick succession - should batch writes
  for (let i = 1; i <= 10; i++) {
    await manager.addUserMessage('test-proj-7', TEST_USER, `Quick message ${i}`);
  }
  
  // Flush everything immediately to ensure it's saved
  await manager.flushAll();
  
  // Verify data is still there after flush
  const context = await manager.buildContext(TEST_USER, 'test-proj-7');
  assert(context.includes('Quick message'));
}

async function testFullConversationFlow() {
  cleanTestDir(TEST_MEMORY_DIR);
  const manager = new MemoryManager(path.join(TEST_MEMORY_DIR, 'memory'));
  
  // Simulate a full conversation
  await manager.createProjectMemory('convo-test', TEST_USER, 'Todo List Project');
  await manager.addUserMessage('convo-test', TEST_USER, '创建一个待办事项应用');
  await manager.addConversation('convo-test', {
    userRequest: '创建一个待办事项应用',
    aiUnderstanding: '用户需要一个待办事项应用',
    tasks: ['创建HTML', '添加样式'],
    result: '创建了index.html'
  });
  await manager.addCompletedFeature('convo-test', '基本界面');
  
  await manager.addUserMessage('convo-test', TEST_USER, '添加数据统计功能');
  await manager.addAssistantMessage('convo-test', '好的，我来添加数据统计');
  
  const context = await manager.buildContext(TEST_USER, 'convo-test');
  
  assert(context.includes('待办事项'));
  assert(context.includes('数据统计'));
  assert(context.includes('基本界面'));
}
