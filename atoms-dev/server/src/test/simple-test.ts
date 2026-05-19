#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';

console.log('=== 开始简化测试...');

// Import the services we need to test
import { ProjectManager } from '../services/ProjectManager';
import { IntentClassifier } from '../services/IntentClassifier';
import { MemoryManager } from '../services/MemoryManager';

// Test configuration
const TEST_DIR = path.join(process.cwd(), 'test-temp');
const TEST_USER_ID = 'test-user-123';

console.log('✅ 1. 测试项目管理器...');
try {
  // Cleanup
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DIR, { recursive: true });

  const pm = new ProjectManager(TEST_DIR);
  
  // Create a few projects
  console.log('   - 创建项目 1-6');
  const p1 = await pm.createProject(TEST_USER_ID, '项目一');
  const p2 = await pm.createProject(TEST_USER_ID, '项目二');
  const p3 = await pm.createProject(TEST_USER_ID, '项目三');
  const p4 = await pm.createProject(TEST_USER_ID, '项目四');
  const p5 = await pm.createProject(TEST_USER_ID, '项目五');
  const p6 = await pm.createProject(TEST_USER_ID, '项目六'); // This should trigger cleanup
  
  // Check the limit
  const projects = pm.listProjects(TEST_USER_ID);
  console.log(`   - 项目数: ${projects.length} (应<=5)`);
  
  if (projects.length <=5) console.log('   ✅ 5个项目限制正常');

  // Test get and delete
  console.log('   - 测试获取和删除');
  const found = pm.getProject(p1.id, TEST_USER_ID);
  if (!found) console.log('   ✅ 最旧项目被正确清理');
  
  const toDel = await pm.createProject(TEST_USER_ID, '要删除的项目');
  await pm.deleteProject(toDel.id, TEST_USER_ID);
  const shouldNotFind = pm.getProject(toDel.id, TEST_USER_ID);
  if (!shouldNotFind) console.log('   ✅ 删除项目正常');
  
  console.log('✅ 项目管理器测试完成');
} catch (e) {
  console.error('❌ 项目管理器测试失败:', e);
}

console.log('\n');
console.log('✅ 2. 测试意图分类器...');
try {
  const ic = new IntentClassifier();
  
  const testCases = [
    { input: '什么是 React?', expected: 'question' },
    { input: '创建一个网页', expected: 'code_production' },
    { input: '重构这个组件', expected: 'refactor' },
    { input: '修复这个bug', expected: 'debug' },
    { input: '写一段文字', expected: 'text_generation' },
  ];
  
  let passed = 0;
  for (const test of testCases) {
    const result = ic.classify(test.input);
    const ok = result.type === test.expected;
    console.log(`   - ${test.input} → ${result.type} (期望: ${test.expected}) ${ok ? '✅' : '❌'}`);
    if (ok) passed++;
  }
  console.log(`   - 测试通过: ${passed}/${testCases.length}`);
  
  // Test keywords
  const result = ic.classify('用React和TypeScript创建组件');
  console.log(`   - 关键词提取: ${result.keywords.join(', ')}`);
  if (result.keywords.includes('React') && result.keywords.includes('TypeScript')) {
    console.log('   ✅ 关键词提取正常');
  }
  
  console.log('✅ 意图分类器测试完成');
} catch (e) {
  console.error('❌ 意图分类器测试失败:', e);
}

console.log('\n');
console.log('✅ 3. 测试记忆管理器...');
try {
  const mm = new MemoryManager(path.join(TEST_DIR, 'memory'));
  await mm.createProjectMemory('test-proj', TEST_USER_ID, '记忆测试');
  
  await mm.addUserMessage('test-proj', TEST_USER_ID, '用户消息1');
  await mm.addAssistantMessage('test-proj', 'AI回复1');
  await mm.addUserMessage('test-proj', TEST_USER_ID, '用户消息2');
  await mm.addAssistantMessage('test-proj', 'AI回复2');
  
  const context = await mm.buildContext(TEST_USER_ID, 'test-proj');
  console.log('   - 构建上下文长度:', context.length);
  console.log('   ✅ 记忆管理器测试完成');
} catch (e) {
  console.error('❌ 记忆管理器测试失败:', e);
}

console.log('\n');
console.log('✅ 4. 测试AI分类...');
try {
  const ic = new IntentClassifier(); // Without LLM, should still work
  const result = await ic.classifyWithAI('测试一下');
  console.log('   - 分类结果:', result.type, result.confidence);
  console.log('   ✅ AI分类器测试完成');
} catch (e) {
  console.error('❌ AI分类器测试失败:', e);
}

console.log('\n');
console.log('=== 所有测试完成！');

// Cleanup
if (fs.existsSync(TEST_DIR)) {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
}
