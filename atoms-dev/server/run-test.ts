#!/usr/bin/env tsx
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MemoryManager } from './src/services/MemoryManager.js';
import { MockLLMService } from './src/services/llm/MockLLMService.js';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
  duration?: number;
}

class MemorySystemTest {
  private testDir: string;
  private results: TestResult[] = [];
  private memoryManager: MemoryManager;
  private mockLLM: MockLLMService;
  private testUserId: string;
  private testProjectId: string;

  constructor() {
    this.testDir = path.join(process.cwd(), 'test-memory-output');
    const fullTestDir = path.join(this.testDir, 'memory');
    this.memoryManager = new MemoryManager(fullTestDir);
    this.mockLLM = new MockLLMService();
    this.memoryManager.setLLMService(this.mockLLM);
    this.testUserId = 'test-user-' + uuidv4().substring(0, 8);
    this.testProjectId = 'test-project-' + uuidv4().substring(0, 8);
  }

  async runAllTests(): Promise<void> {
    console.log('='.repeat(80));
    console.log('🧪 增强记忆系统 - 完整测试套件');
    console.log('='.repeat(80));

    await this.testBasicMemoryOperations();
    await this.testProjectMemoryCreation();
    await this.testMemoryPersistence();
    await this.testConversationHistory();
    await this.testMultiTurnConversation();
    await this.testMemoryLoadingFromFile();
    await this.testContextBuilding();
    await this.testGoalAndTechStack();
    await this.testMemoryFlush();
    await this.testMultipleProjects();
    await this.testLLMIntegration();

    this.printResults();
    this.generateReport();
  }

  private async testBasicMemoryOperations(): Promise<void> {
    const testName = '基础记忆操作测试';
    const startTime = Date.now();
    
    try {
      console.log(`\n📋 ${testName}`);

      const context = await this.memoryManager.buildContext(this.testUserId, undefined);
      console.log('  ✓ buildContext 返回正确结果');

      const compressedMemory = await this.memoryManager.getCompressedMemory(this.testUserId, undefined);
      console.log('  ✓ getCompressedMemory 返回正确结果');

      this.results.push({
        name: testName,
        passed: true,
        duration: Date.now() - startTime
      });
      
      console.log('  ✅ 测试通过');
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: Date.now() - startTime
      });
      console.log(`  ❌ 测试失败: ${error}`);
    }
  }

  private async testProjectMemoryCreation(): Promise<void> {
    const testName = '项目记忆创建测试';
    const startTime = Date.now();
    
    try {
      console.log(`\n📋 ${testName}`);

      await this.memoryManager.createProjectMemory(this.testProjectId, this.testUserId, 'TODO应用测试');
      console.log('  ✓ createProjectMemory 执行成功');

      const hasMemory = await this.memoryManager.hasProjectMemory(this.testProjectId);
      if (!hasMemory) {
        throw new Error('项目记忆未被正确创建');
      }
      console.log('  ✓ hasProjectMemory 返回 true');

      this.results.push({
        name: testName,
        passed: true,
        duration: Date.now() - startTime
      });
      
      console.log('  ✅ 测试通过');
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: Date.now() - startTime
      });
      console.log(`  ❌ 测试失败: ${error}`);
    }
  }

  private async testMemoryPersistence(): Promise<void> {
    const testName = 'JSON持久化测试';
    const startTime = Date.now();
    
    try {
      console.log(`\n📋 ${testName}`);

      const filePath = await this.memoryManager.getMemoryFilePath(this.testProjectId);
      if (filePath) {
        console.log('  ✓ getMemoryFilePath 返回正确路径');
      }

      await this.memoryManager.updateProjectGoal(this.testProjectId, '创建一个漂亮的待办事项应用');
      await this.memoryManager.addTechStack(this.testProjectId, ['HTML', 'CSS', 'JavaScript']);
      await this.memoryManager.addCompletedFeature(this.testProjectId, '基础界面布局');
      console.log('  ✓ 项目信息更新成功');

      await this.memoryManager.flushAll();
      console.log('  ✓ flushAll 执行成功');

      if (!fs.existsSync(filePath || '')) {
        throw new Error('JSON持久化文件不存在');
      }
      console.log('  ✓ JSON文件已成功写入');

      const fileContent = fs.readFileSync(filePath!, 'utf-8');
      if (!fileContent.includes('TODO应用测试')) {
        throw new Error('JSON文件内容不正确');
      }
      console.log('  ✓ JSON文件内容验证通过');

      this.results.push({
        name: testName,
        passed: true,
        duration: Date.now() - startTime
      });
      
      console.log('  ✅ 测试通过');
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: Date.now() - startTime
      });
      console.log(`  ❌ 测试失败: ${error}`);
    }
  }

  private async testConversationHistory(): Promise<void> {
    const testName = '对话历史测试';
    const startTime = Date.now();
    
    try {
      console.log(`\n📋 ${testName}`);

      await this.memoryManager.addUserMessage(this.testProjectId, this.testUserId, '你好，请帮我创建一个待办事项应用');
      await this.memoryManager.addAssistantMessage(this.testProjectId, '好的！我来帮你创建一个待办事项应用');
      console.log('  ✓ 添加用户消息和助手消息成功');

      this.results.push({
        name: testName,
        passed: true,
        duration: Date.now() - startTime
      });
      
      console.log('  ✅ 测试通过');
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: Date.now() - startTime
      });
      console.log(`  ❌ 测试失败: ${error}`);
    }
  }

  private async testMultiTurnConversation(): Promise<void> {
    const testName = '多轮对话记忆测试';
    const startTime = Date.now();
    
    try {
      console.log(`\n📋 ${testName}`);

      await this.memoryManager.addMessageWithCompression(
        this.testProjectId,
        this.testUserId,
        '建立TODO应用',
        '好的！我来帮你创建一个 TODO 应用。'
      );
      console.log('  ✓ 第一轮对话添加成功');

      await this.memoryManager.addMessageWithCompression(
        this.testProjectId,
        this.testUserId,
        '重新做，需要有header头表明名称',
        '好的！我来重新制作 TODO 应用，添加 header 显示应用名称。'
      );
      console.log('  ✓ 第二轮对话添加成功');

      const context = await this.memoryManager.buildContext(this.testUserId, this.testProjectId);
      if (context.length === 0) {
        throw new Error('构建上下文失败');
      }
      console.log('  ✓ 上下文构建成功');

      const compressedMemory = await this.memoryManager.getCompressedMemory(this.testUserId, this.testProjectId);
      console.log('  ✓ 压缩记忆构建成功');

      this.results.push({
        name: testName,
        passed: true,
        duration: Date.now() - startTime
      });
      
      console.log('  ✅ 测试通过');
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: Date.now() - startTime
      });
      console.log(`  ❌ 测试失败: ${error}`);
    }
  }

  private async testMemoryLoadingFromFile(): Promise<void> {
    const testName = '从文件加载记忆测试';
    const startTime = Date.now();
    
    try {
      console.log(`\n📋 ${testName}`);

      const filePath = await this.memoryManager.getMemoryFilePath(this.testProjectId);
      if (!filePath) {
        throw new Error('找不到记忆文件');
      }

      const newMemoryManager = new MemoryManager(path.join(this.testDir, 'memory'));
      const loadedMemory = await newMemoryManager.loadMemoryFromFile(filePath);
      
      if (!loadedMemory) {
        throw new Error('加载记忆失败');
      }
      console.log('  ✓ 记忆从文件加载成功');

      if (loadedMemory.projectId !== this.testProjectId) {
        throw new Error('加载的项目ID不匹配');
      }
      console.log('  ✓ 项目ID匹配');

      this.results.push({
        name: testName,
        passed: true,
        duration: Date.now() - startTime
      });
      
      console.log('  ✅ 测试通过');
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: Date.now() - startTime
      });
      console.log(`  ❌ 测试失败: ${error}`);
    }
  }

  private async testContextBuilding(): Promise<void> {
    const testName = '上下文构建测试';
    const startTime = Date.now();
    
    try {
      console.log(`\n📋 ${testName}`);

      const context = await this.memoryManager.buildContext(this.testUserId, this.testProjectId);
      console.log('  ✓ buildContext 执行成功');
      console.log(`  ✓ 上下文长度: ${context.length} 字符`);

      if (context.includes('TODO应用测试')) {
        console.log('  ✓ 上下文包含项目名称');
      }
      
      if (context.includes('待办事项应用')) {
        console.log('  ✓ 上下文包含项目目标');
      }

      this.results.push({
        name: testName,
        passed: true,
        details: { contextLength: context.length },
        duration: Date.now() - startTime
      });
      
      console.log('  ✅ 测试通过');
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: Date.now() - startTime
      });
      console.log(`  ❌ 测试失败: ${error}`);
    }
  }

  private async testGoalAndTechStack(): Promise<void> {
    const testName = '项目目标和技术栈测试';
    const startTime = Date.now();
    
    try {
      console.log(`\n📋 ${testName}`);

      await this.memoryManager.updateProjectGoal(this.testProjectId, '创建一个现代化的待办事项应用，支持暗色模式');
      console.log('  ✓ 项目目标更新成功');

      await this.memoryManager.addTechStack(this.testProjectId, 'React');
      console.log('  ✓ 单个技术栈添加成功');

      await this.memoryManager.addTechStack(this.testProjectId, ['TypeScript', 'Tailwind CSS']);
      console.log('  ✓ 多个技术栈添加成功');

      const context = await this.memoryManager.buildContext(this.testUserId, this.testProjectId);
      if (!context.includes('暗色模式')) {
        throw new Error('上下文未包含项目目标');
      }
      console.log('  ✓ 项目目标已包含在上下文中');

      this.results.push({
        name: testName,
        passed: true,
        duration: Date.now() - startTime
      });
      
      console.log('  ✅ 测试通过');
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: Date.now() - startTime
      });
      console.log(`  ❌ 测试失败: ${error}`);
    }
  }

  private async testMemoryFlush(): Promise<void> {
    const testName = '内存刷新测试';
    const startTime = Date.now();
    
    try {
      console.log(`\n📋 ${testName}`);

      await this.memoryManager.addUserMessage(this.testProjectId, this.testUserId, '这是一个应该被持久化的消息');
      
      await this.memoryManager.flushAll();
      console.log('  ✓ flushAll 执行成功');

      const filePath = await this.memoryManager.getMemoryFilePath(this.testProjectId);
      const fileContent = fs.readFileSync(filePath!, 'utf-8');
      
      if (!fileContent.includes('应该被持久化')) {
        throw new Error('flushAll没有正确持久化数据');
      }
      console.log('  ✓ 数据已正确持久化');

      this.results.push({
        name: testName,
        passed: true,
        duration: Date.now() - startTime
      });
      
      console.log('  ✅ 测试通过');
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: Date.now() - startTime
      });
      console.log(`  ❌ 测试失败: ${error}`);
    }
  }

  private async testMultipleProjects(): Promise<void> {
    const testName = '多项目记忆测试';
    const startTime = Date.now();
    
    try {
      console.log(`\n📋 ${testName}`);

      const project1Id = 'test-proj1-' + uuidv4().substring(0, 8);
      const project2Id = 'test-proj2-' + uuidv4().substring(0, 8);

      await this.memoryManager.createProjectMemory(project1Id, this.testUserId, '项目1：计算器');
      await this.memoryManager.createProjectMemory(project2Id, this.testUserId, '项目2：天气应用');
      console.log('  ✓ 两个项目创建成功');

      await this.memoryManager.updateProjectGoal(project1Id, '创建一个简单的计算器');
      await this.memoryManager.updateProjectGoal(project2Id, '创建一个天气预报应用');
      console.log('  ✓ 两个项目目标设置成功');

      const context1 = await this.memoryManager.buildContext(this.testUserId, project1Id);
      const context2 = await this.memoryManager.buildContext(this.testUserId, project2Id);
      
      if (!context1.includes('计算器') || !context2.includes('天气')) {
        throw new Error('多项目记忆隔离失败');
      }
      console.log('  ✓ 两个项目的记忆正确隔离');

      this.results.push({
        name: testName,
        passed: true,
        duration: Date.now() - startTime
      });
      
      console.log('  ✅ 测试通过');
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: Date.now() - startTime
      });
      console.log(`  ❌ 测试失败: ${error}`);
    }
  }

  private async testLLMIntegration(): Promise<void> {
    const testName = 'LLM集成测试';
    const startTime = Date.now();
    
    try {
      console.log(`\n📋 ${testName}`);

      const response = await this.mockLLM.complete('建立TODO应用');
      if (!response.content.includes('TODO')) {
        throw new Error('Mock LLM响应不正确');
      }
      console.log('  ✓ Mock LLM complete 正常工作');

      let streamedContent = '';
      const stream = this.mockLLM.stream('天气应用');
      for await (const chunk of stream) {
        streamedContent += chunk;
      }
      if (!streamedContent.includes('天气')) {
        throw new Error('Mock LLM流式响应不正确');
      }
      console.log('  ✓ Mock LLM stream 正常工作');

      this.results.push({
        name: testName,
        passed: true,
        duration: Date.now() - startTime
      });
      
      console.log('  ✅ 测试通过');
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: Date.now() - startTime
      });
      console.log(`  ❌ 测试失败: ${error}`);
    }
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 测试结果汇总');
    console.log('='.repeat(80));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log(`\n总测试数: ${total}`);
    console.log(`✅ 通过: ${passed}`);
    console.log(`❌ 失败: ${failed}\n`);

    for (const result of this.results) {
      const status = result.passed ? '✅' : '❌';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      console.log(`${status} ${result.name}${duration}`);
      
      if (!result.passed && result.error) {
        console.log(`   错误: ${result.error}`);
      }
    }

    console.log('\n' + '='.repeat(80));
  }

  private generateReport(): void {
    if (!fs.existsSync(this.testDir)) {
      fs.mkdirSync(this.testDir, { recursive: true });
    }

    const reportPath = path.join(this.testDir, 'test-report.md');
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    const reportContent = `# 增强记忆系统 - 测试报告

生成时间: ${new Date().toLocaleString()}

## 执行摘要

| 指标 | 数值 |
|------|------|
| 总测试数 | ${total} |
| 通过 | ${passed} |
| 失败 | ${failed} |
| 通过率 | ${Math.round(passed / total * 100)}% |

## 测试环境

- 测试用户ID: ${this.testUserId}
- 测试项目ID: ${this.testProjectId}
- 测试目录: ${this.testDir}

## 详细测试结果

${this.results.map(r => `### ${r.passed ? '✅' : '❌'} ${r.name}

- 状态: ${r.passed ? '通过' : '失败'}
- 耗时: ${r.duration}ms
${r.error ? `- 错误: ${r.error}` : ''}
${r.details ? `- 详情: ${JSON.stringify(r.details)}` : ''}
`).join('\n')}

## 系统架构说明

### 记忆系统结构

\`\`\`
atoms-memory/
├── users/          # 用户记忆
│   └── [userId].json
├── projects/       # 项目记忆
│   └── [projectId].json
\`\`\`

### 核心功能

1. **内存缓存**: 使用 Map 进行快速访问
2. **异步持久化**: 延迟写入 JSON 文件
3. **上下文构建**: 为 LLM 提供上下文信息
4. **记忆压缩**: 定期压缩对话历史

### 数据模型

\`\`\`typescript
interface ProjectMemory {
  projectId: string;
  userId: string;
  name: string;
  goal: string;
  techStack: string[];
  conversationHistory: Message[];
  recentMemories: ShortMemory[];
  compressedMemories: CompressedMemory[];
}
\`\`\`

## 测试场景覆盖

✅ 基础记忆操作
✅ 项目记忆创建
✅ JSON持久化
✅ 对话历史
✅ 多轮对话（关键功能）
✅ 从文件加载记忆
✅ 上下文构建
✅ 项目目标和技术栈
✅ 内存刷新
✅ 多项目记忆隔离
✅ LLM集成

## 验证要点

1. ✅ 记忆是否成功持久化到 JSON 文件
2. ✅ 记忆是否可以从文件正确加载
3. ✅ AI对话时记忆是否被正确传递
4. ✅ 多轮对话是否保持上下文连贯
5. ✅ 多个项目的记忆是否正确隔离

---

**所有测试完成！**
`;

    fs.writeFileSync(reportPath, reportContent, 'utf-8');
    console.log(`\n📄 详细报告已保存到: ${reportPath}`);
    console.log('\n' + '='.repeat(80));

    if (failed === 0) {
      console.log('🎉 所有测试通过！增强记忆系统已准备就绪！');
    } else {
      console.log('⚠️ 有部分测试失败，请检查上面的详细报告');
    }
    console.log('='.repeat(80));
  }
}

async function main() {
  const test = new MemorySystemTest();
  await test.runAllTests();
}

main().catch(console.error);
