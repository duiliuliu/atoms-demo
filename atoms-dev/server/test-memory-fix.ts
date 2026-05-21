#!/usr/bin/env tsx
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MemoryManager } from './src/services/MemoryManager.js';
import { IntentClassifier } from './src/services/IntentClassifier.js';
import { TaskAnalyzer } from './src/services/TaskAnalyzer.js';
import { MockLLMService } from './src/services/llm/MockLLMService.js';

console.log('🧪 测试记忆系统修复\n');

// 创建测试目录
const testDir = path.join(process.cwd(), 'test-memory-fix');
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true });
}
fs.mkdirSync(testDir, { recursive: true });

const memoryManager = new MemoryManager(path.join(testDir, 'memory'));
const mockLLM = new MockLLMService();
memoryManager.setLLMService(mockLLM);

const testUserId = uuidv4();
const testProjectId = uuidv4();

async function runTests() {
  let allPassed = true;

  // 测试 1: 创建项目记忆
  console.log('📋 测试 1: 创建项目记忆');
  try {
    await memoryManager.createProjectMemory(testProjectId, testUserId, '天气应用');
    await memoryManager.updateProjectGoal(testProjectId, '创建一个功能完整的天气展示应用');
    console.log('  ✅ 项目记忆创建成功\n');
  } catch (e) {
    console.log('  ❌ 失败:', e);
    allPassed = false;
  }

  // 测试 2: 添加第一轮对话
  console.log('📋 测试 2: 添加第一轮对话');
  try {
    await memoryManager.addMessageWithCompression(
      testProjectId,
      testUserId,
      '做一个天气展示应用',
      '好的，我来为你创建一个天气展示应用...'
    );
    
    // 验证记忆被保存
    const memoryPath = await memoryManager.getMemoryFilePath(testProjectId);
    if (memoryPath && fs.existsSync(memoryPath)) {
      console.log('  ✅ 对话保存成功\n');
    } else {
      throw new Error('记忆文件未创建');
    }
  } catch (e) {
    console.log('  ❌ 失败:', e);
    allPassed = false;
  }

  // 测试 3: 测试 IntentClassifier 对"继续"请求的分类
  console.log('📋 测试 3: 测试 IntentClassifier 对"继续"请求的分类');
  try {
    const classifier = new IntentClassifier(mockLLM);
    const result = classifier.classify('继续输出');
    console.log('  分类结果:', result.type);
    if (result.type === 'modify') {
      console.log('  ✅ "继续"请求被正确分类为 modify\n');
    } else {
      throw new Error(`期望 classify 为 'modify', 实际得到 '${result.type}'`);
    }
  } catch (e) {
    console.log('  ❌ 失败:', e);
    allPassed = false;
  }

  // 测试 4: 测试 getCompressedMemory 返回正确的记忆
  console.log('📋 测试 4: 测试获取压缩记忆');
  try {
    const compressed = await memoryManager.getCompressedMemory(testUserId, testProjectId);
    console.log('  记忆长度:', compressed.length, '字符');
    if (compressed.includes('天气应用')) {
      console.log('  ✅ 压缩记忆包含项目信息\n');
    } else {
      throw new Error('压缩记忆中未找到项目信息');
    }
  } catch (e) {
    console.log('  ❌ 失败:', e);
    allPassed = false;
  }

  // 测试 5: 测试 flushAll 和重新加载
  console.log('📋 测试 5: 测试 flushAll 和重新加载');
  try {
    await memoryManager.flushAll();
    
    // 创建新的 MemoryManager 实例
    const newMemoryManager = new MemoryManager(path.join(testDir, 'memory'));
    const memoryPath = await newMemoryManager.getMemoryFilePath(testProjectId);
    
    if (memoryPath) {
      const loadedMemory = await newMemoryManager.loadMemoryFromFile(memoryPath);
      if (loadedMemory && loadedMemory.name === '天气应用') {
        console.log('  ✅ 记忆成功从磁盘重新加载\n');
      } else {
        throw new Error('重新加载的记忆不正确');
      }
    }
  } catch (e) {
    console.log('  ❌ 失败:', e);
    allPassed = false;
  }

  // 测试 6: TaskAnalyzer 对继续请求的处理
  console.log('📋 测试 6: TaskAnalyzer 对继续请求的处理');
  try {
    const analyzer = new TaskAnalyzer(mockLLM);
    const context = '## 项目记忆\n项目名称: 天气应用\n项目目标: 创建一个功能完整的天气展示应用';
    const breakdown = await analyzer.analyzeRequest('继续输出', context);
    
    console.log('  任务类型:', breakdown.tasks[0].type);
    console.log('  关键功能:', breakdown.userIntent.keyFeatures);
    
    if (breakdown.tasks[0].type === 'update_file') {
      console.log('  ✅ 继续请求被正确处理为更新文件\n');
    }
  } catch (e) {
    console.log('  ❌ 失败:', e);
    allPassed = false;
  }

  // 总结
  console.log('='.repeat(50));
  if (allPassed) {
    console.log('🎉 所有测试通过！记忆系统修复成功！');
  } else {
    console.log('⚠️ 部分测试失败，请检查');
  }
  console.log('='.repeat(50));
}

runTests().catch(console.error);
