import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { EnhancedMemoryService } from '../services/EnhancedMemoryService.js';
import { MockLLMService } from '../services/llm/MockLLMService.js';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
  duration?: number;
}

class EnhancedMemorySystemTester {
  private testDir: string;
  private results: TestResult[] = [];
  private memoryService: EnhancedMemoryService;
  private mockLLM: MockLLMService;
  private testUserId: string = 'test-user-' + uuidv4();
  private testProjectId: string = 'test-project-' + uuidv4();
  private testProjectName: string = '测试项目';

  constructor() {
    this.testDir = path.join(process.cwd(), 'test-temp-memory');
    this.memoryService = new EnhancedMemoryService(this.testDir);
    this.mockLLM = new MockLLMService();
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 开始增强记忆系统测试...\n');
    
    await this.testBasicMemoryOperations();
    await this.testProjectContextBuilding();
    await this.testMarkdownPersistence();
    await this.testMultiTurnConversation();
    await this.testKeyDecisionsTracking();
    await this.testTechStackManagement();
    await this.testContextRetrieval();
    await this.testCachePersistence();
    await this.testMockLLMIntegration();
    await this.testMemoryFlush();
    
    this.printResults();
    this.cleanup();
  }

  private async testBasicMemoryOperations(): Promise<void> {
    const testName = '基础记忆操作测试';
    const startTime = Date.now();
    
    try {
      console.log(`📋 测试: ${testName}`);
      
      const context = await this.memoryService.getOrCreateProjectContext(
        this.testProjectId,
        this.testUserId,
        this.testProjectName
      );
      
      if (context.projectId !== this.testProjectId) {
        throw new Error('项目ID不匹配');
      }
      if (context.userId !== this.testUserId) {
        throw new Error('用户ID不匹配');
      }
      
      await this.memoryService.updateProjectGoal(
        this.testProjectId,
        this.testUserId,
        this.testProjectName,
        '创建一个漂亮的TODO应用'
      );
      
      await this.memoryService.addTechStack(
        this.testProjectId,
        this.testUserId,
        this.testProjectName,
        ['HTML', 'CSS', 'JavaScript']
      );
      
      const updatedContext = await this.memoryService.getOrCreateProjectContext(
        this.testProjectId,
        this.testUserId,
        this.testProjectName
      );
      
      if (updatedContext.goal !== '创建一个漂亮的TODO应用') {
        throw new Error('项目目标未正确保存');
      }
      if (updatedContext.techStack.length !== 3) {
        throw new Error('技术栈未正确保存');
      }
      
      this.results.push({
        name: testName,
        passed: true,
        duration: Date.now() - startTime
      });
      
      console.log('✅ 测试通过\n');
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: Date.now() - startTime
      });
      console.log(`❌ 测试失败: ${error}\n`);
    }
  }

  private async testProjectContextBuilding(): Promise<void> {
    const testName = '项目上下文构建测试';
    const startTime = Date.now();
    
    try {
      console.log(`📋 测试: ${testName}`);
      
      const prompt = await this.memoryService.buildContextPrompt(
        this.testProjectId,
        this.testUserId,
        this.testProjectName
      );
      
      if (!prompt.includes('项目上下文')) {
        throw new Error('上下文未正确生成');
      }
      if (!prompt.includes('项目目标')) {
        throw new Error('项目目标未包含在上下文中');
      }
      if (!prompt.includes('技术栈')) {
        throw new Error('技术栈未包含在上下文中');
      }
      
      this.results.push({
        name: testName,
        passed: true,
        details: { promptLength: prompt.length },
        duration: Date.now() - startTime
      });
      
      console.log('✅ 测试通过\n');
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: Date.now() - startTime
      });
      console.log(`❌ 测试失败: ${error}\n`);
    }
  }

  private async testMarkdownPersistence(): Promise<void> {
    const testName = 'Markdown持久化测试';
    const startTime = Date.now();
    
    try {
      console.log(`📋 测试: ${testName}`);
      
      await this.memoryService.flushAll();
      
      const markdownFile = path.join(this.testDir, 'enhanced-projects', `${this.testProjectId}.md`);
      
      if (!fs.existsSync(markdownFile)) {
        throw new Error('Markdown文件未创建');
      }
      
      const content = fs.readFileSync(markdownFile, 'utf-8');
      if (!content.includes('项目: 测试项目')) {
        throw new Error('Markdown内容不完整');
      }
      
      const newMemoryService = new EnhancedMemoryService(this.testDir);
      const recoveredContext = await newMemoryService.getOrCreateProjectContext(
        this.testProjectId,
        this.testUserId,
        this.testProjectName
      );
      
      if (recoveredContext.goal !== '创建一个漂亮的TODO应用') {
        throw new Error('从Markdown恢复失败');
      }
      
      this.results.push({
        name: testName,
        passed: true,
        duration: Date.now() - startTime
      });
      
      console.log('✅ 测试通过\n');
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: Date.now() - startTime
      });
      console.log(`❌ 测试失败: ${error}\n`);
    }
  }

  private async testMultiTurnConversation(): Promise<void> {
    const testName = '多轮对话测试';
    const startTime = Date.now();
    
    try {
      console.log(`📋 测试: ${testName}`);
      
      await this.memoryService.addConversationSummary(
        this.testProjectId,
        this.testUserId,
        this.testProjectName,
        '建立TODO应用',
        '创建了index.html和style.css'
      );
      
      await this.memoryService.addConversationSummary(
        this.testProjectId,
        this.testUserId,
        this.testProjectName,
        '重新做，需要有header头表明名称',
        '重新创建了带header的index.html'
      );
      
      const context = await this.memoryService.getOrCreateProjectContext(
        this.testProjectId,
        this.testUserId,
        this.testProjectName
      );
      
      if (context.conversationSummary.length !== 2) {
        throw new Error('对话记录未正确保存');
      }
      
      const prompt = await this.memoryService.buildContextPrompt(
        this.testProjectId,
        this.testUserId,
        this.testProjectName
      );
      
      if (!prompt.includes('第1轮') || !prompt.includes('第2轮')) {
        throw new Error('对话历史未包含在上下文中');
      }
      
      this.results.push({
        name: testName,
        passed: true,
        duration: Date.now() - startTime
      });
      
      console.log('✅ 测试通过\n');
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: Date.now() - startTime
      });
      console.log(`❌ 测试失败: ${error}\n`);
    }
  }

  private async testKeyDecisionsTracking(): Promise<void> {
    const testName = '关键决策跟踪测试';
    const startTime = Date.now();
    
    try {
      console.log(`📋 测试: ${testName}`);
      
      await this.memoryService.addKeyDecision(
        this.testProjectId,
        this.testUserId,
        this.testProjectName,
        '使用纯HTML/CSS/JS',
        '用户要求快速原型，不需要框架'
      );
      
      await this.memoryService.addKeyDecision(
        this.testProjectId,
        this.testUserId,
        this.testProjectName,
        '添加Header显示名称',
        '用户明确要求在顶部显示应用名称'
      );
      
      const context = await this.memoryService.getOrCreateProjectContext(
        this.testProjectId,
        this.testUserId,
        this.testProjectName
      );
      
      if (context.keyDecisions.length !== 2) {
        throw new Error('关键决策未正确保存');
      }
      
      this.results.push({
        name: testName,
        passed: true,
        duration: Date.now() - startTime
      });
      
      console.log('✅ 测试通过\n');
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: Date.now() - startTime
      });
      console.log(`❌ 测试失败: ${error}\n`);
    }
  }

  private async testTechStackManagement(): Promise<void> {
    const testName = '技术栈管理测试';
    const startTime = Date.now();
    
    try {
      console.log(`📋 测试: ${testName}`);
      
      await this.memoryService.addTechStack(
        this.testProjectId,
        this.testUserId,
        this.testProjectName,
        'Tailwind CSS'
      );
      
      await this.memoryService.addTechStack(
        this.testProjectId,
        this.testUserId,
        this.testProjectName,
        'HTML'
      );
      
      const context = await this.memoryService.getOrCreateProjectContext(
        this.testProjectId,
        this.testUserId,
        this.testProjectName
      );
      
      if (context.techStack.indexOf('HTML') !== context.techStack.lastIndexOf('HTML')) {
        throw new Error('技术栈出现重复');
      }
      
      this.results.push({
        name: testName,
        passed: true,
        duration: Date.now() - startTime
      });
      
      console.log('✅ 测试通过\n');
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: Date.now() - startTime
      });
      console.log(`❌ 测试失败: ${error}\n`);
    }
  }

  private async testContextRetrieval(): Promise<void> {
    const testName = '上下文检索测试';
    const startTime = Date.now();
    
    try {
      console.log(`📋 测试: ${testName}`);
      
      await this.memoryService.addCompletedFile(
        this.testProjectId,
        this.testUserId,
        this.testProjectName,
        'index.html'
      );
      
      await this.memoryService.addCompletedFile(
        this.testProjectId,
        this.testUserId,
        this.testProjectName,
        'style.css'
      );
      
      await this.memoryService.addKeyFeature(
        this.testProjectId,
        this.testUserId,
        this.testProjectName,
        '添加新待办事项'
      );
      
      await this.memoryService.addKeyFeature(
        this.testProjectId,
        this.testUserId,
        this.testProjectName,
        '标记完成'
      );
      
      const context = await this.memoryService.getOrCreateProjectContext(
        this.testProjectId,
        this.testUserId,
        this.testProjectName
      );
      
      if (context.completedFiles.length !== 2) {
        throw new Error('文件列表不正确');
      }
      
      if (context.keyFeatures.length !== 2) {
        throw new Error('功能列表不正确');
      }
      
      const prompt = await this.memoryService.buildContextPrompt(
        this.testProjectId,
        this.testUserId,
        this.testProjectName
      );
      
      console.log('📝 生成的上下文提示:');
      console.log(prompt.substring(0, 300) + '...\n');
      
      this.results.push({
        name: testName,
        passed: true,
        duration: Date.now() - startTime
      });
      
      console.log('✅ 测试通过\n');
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: Date.now() - startTime
      });
      console.log(`❌ 测试失败: ${error}\n`);
    }
  }

  private async testCachePersistence(): Promise<void> {
    const testName = '缓存持久化测试';
    const startTime = Date.now();
    
    try {
      console.log(`📋 测试: ${testName}`);
      
      await this.memoryService.flushAll();
      
      const memoryService2 = new EnhancedMemoryService(this.testDir);
      
      const context1 = await this.memoryService.getOrCreateProjectContext(
        this.testProjectId,
        this.testUserId,
        this.testProjectName
      );
      
      const context2 = await memoryService2.getOrCreateProjectContext(
        this.testProjectId,
        this.testUserId,
        this.testProjectName
      );
      
      if (context1.goal !== context2.goal) {
        throw new Error('持久化恢复失败');
      }
      
      this.results.push({
        name: testName,
        passed: true,
        duration: Date.now() - startTime
      });
      
      console.log('✅ 测试通过\n');
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: Date.now() - startTime
      });
      console.log(`❌ 测试失败: ${error}\n`);
    }
  }

  private async testMockLLMIntegration(): Promise<void> {
    const testName = 'Mock LLM集成测试';
    const startTime = Date.now();
    
    try {
      console.log(`📋 测试: ${testName}`);
      
      const response1 = await this.mockLLM.complete('请帮我建立TODO应用');
      if (!response1.content.includes('TODO')) {
        throw new Error('Mock响应不正确');
      }
      
      const response2 = await this.mockLLM.complete('重新做，需要有header头表明名称');
      if (!response2.content.includes('header')) {
        throw new Error('Mock响应不正确');
      }
      
      const parts: string[] = [];
      for await (const chunk of this.mockLLM.stream('建立TODO应用')) {
        parts.push(chunk);
      }
      
      if (parts.length === 0) {
        throw new Error('流式响应未工作');
      }
      
      this.results.push({
        name: testName,
        passed: true,
        duration: Date.now() - startTime
      });
      
      console.log('✅ 测试通过\n');
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: Date.now() - startTime
      });
      console.log(`❌ 测试失败: ${error}\n`);
    }
  }

  private async testMemoryFlush(): Promise<void> {
    const testName = '内存刷新测试';
    const startTime = Date.now();
    
    try {
      console.log(`📋 测试: ${testName}`);
      
      const tempProjectId = 'temp-flush-' + uuidv4();
      await this.memoryService.getOrCreateProjectContext(
        tempProjectId,
        this.testUserId,
        '临时项目'
      );
      await this.memoryService.updateProjectGoal(
        tempProjectId,
        this.testUserId,
        '临时项目',
        '测试目标'
      );
      
      await this.memoryService.flushAll();
      
      const checkFile = path.join(this.testDir, 'enhanced-projects', `${tempProjectId}.md`);
      if (!fs.existsSync(checkFile)) {
        throw new Error('刷新前文件未保存');
      }
      
      this.results.push({
        name: testName,
        passed: true,
        duration: Date.now() - startTime
      });
      
      console.log('✅ 测试通过\n');
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: Date.now() - startTime
      });
      console.log(`❌ 测试失败: ${error}\n`);
    }
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试结果汇总');
    console.log('='.repeat(60));
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    
    console.log(`\n总测试: ${total} | 通过: ${passed} | 失败: ${failed}\n`);
    
    for (const result of this.results) {
      const status = result.passed ? '✅' : '❌';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      console.log(`${status} ${result.name}${duration}`);
      
      if (!result.passed && result.error) {
        console.log(`   错误: ${result.error}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (failed === 0) {
      console.log('🎉 所有测试通过！');
    } else {
      console.log(`⚠️ 有 ${failed} 个测试失败`);
    }
    console.log('='.repeat(60));
    
    this.generateReport();
  }

  private generateReport(): void {
    const reportPath = path.join(this.testDir, 'test-report.md');
    const reportContent = this.results.map(r => {
      return `## ${r.passed ? '✅' : '❌'} ${r.name}
- 状态: ${r.passed ? '通过' : '失败'}
- 耗时: ${r.duration}ms
${r.error ? `- 错误: ${r.error}` : ''}`;
    }).join('\n\n');
    
    const fullReport = `# 增强记忆系统测试报告

生成时间: ${new Date().toLocaleString()}

## 汇总
- 总测试: ${this.results.length}
- 通过: ${this.results.filter(r => r.passed).length}
- 失败: ${this.results.filter(r => !r.passed).length}

---

## 详细结果

${reportContent}
`;
    
    fs.writeFileSync(reportPath, fullReport, 'utf-8');
    console.log(`\n📄 详细报告已保存到: ${reportPath}`);
  }

  private cleanup(): void {
    try {
      if (fs.existsSync(this.testDir)) {
        const files = fs.readdirSync(path.join(this.testDir, 'enhanced-projects'));
        for (const file of files) {
          if (file.includes('test') || file.includes('temp')) {
            fs.unlinkSync(path.join(this.testDir, 'enhanced-projects', file));
          }
        }
      }
    } catch (e) {
    }
  }
}

async function main() {
  const tester = new EnhancedMemorySystemTester();
  await tester.runAllTests();
}

main().catch(console.error);
