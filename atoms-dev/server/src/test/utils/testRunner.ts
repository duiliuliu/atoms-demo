// Test Runner - Utility for running tests and collecting results
import * as fs from 'fs';
import * as path from 'path';

export interface TestResult {
  module: string;
  testName: string;
  status: 'pass' | 'fail' | 'skip';
  details: string;
  duration: number;
  error?: string;
}

export interface TestModule {
  name: string;
  tests: Array<{
    name: string;
    fn: () => Promise<void>;
  }>;
}

export class TestRunner {
  private results: TestResult[] = [];
  private modules: TestModule[] = [];

  addModule(module: TestModule) {
    this.modules.push(module);
  }

  async run(): Promise<TestResult[]> {
    console.log('🚀 Starting test suite...\n');

    for (const module of this.modules) {
      console.log(`📦 Testing module: ${module.name}`);
      console.log('='.repeat(60));

      for (const test of module.tests) {
        await this.runTest(module.name, test.name, test.fn);
      }

      console.log('');
    }

    this.printSummary();
    return this.results;
  }

  private async runTest(module: string, testName: string, testFn: () => Promise<void>) {
    const start = Date.now();

    try {
      console.log(`  🧪 Running: ${testName}...`);
      await testFn();

      const duration = Date.now() - start;
      console.log(`  ✅ PASS: ${testName} (${duration}ms)`);

      this.results.push({
        module,
        testName,
        status: 'pass',
        details: 'Test completed successfully',
        duration
      });
    } catch (error) {
      const duration = Date.now() - start;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.log(`  ❌ FAIL: ${testName} - ${errorMessage}`);
      
      this.results.push({
        module,
        testName,
        status: 'fail',
        details: `Error: ${errorMessage}`,
        duration,
        error: errorMessage
      });
    }
  }

  private printSummary() {
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const skipped = this.results.filter(r => r.status === 'skip').length;
    const total = this.results.length;
    const duration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${failed}/${total}`);
    if (skipped > 0) console.log(`⏭️ Skipped: ${skipped}/${total}`);
    console.log(`⏱️ Total duration: ${duration}ms`);
    console.log('='.repeat(60));
  }

  getResults(): TestResult[] {
    return [...this.results];
  }

  generateReport(): string {
    const passed = this.results.filter(r => r.status === 'pass');
    const failed = this.results.filter(r => r.status === 'fail');
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    let report = '# 第二阶段实现方案 - 完整测试报告\n\n';
    report += `生成时间: ${new Date().toLocaleString()}\n\n`;
    report += '## 执行摘要\n\n';
    report += `- ✅ 通过: ${passed.length}/${this.results.length}\n`;
    report += `- ❌ 失败: ${failed.length}/${this.results.length}\n`;
    report += `- ⏱️ 总耗时: ${totalDuration}ms\n\n`;

    // Group by module
    const modules = new Set(this.results.map(r => r.module));
    for (const moduleName of modules) {
      const moduleResults = this.results.filter(r => r.module === moduleName);
      const modulePassed = moduleResults.filter(r => r.status === 'pass').length;

      report += `## ${moduleName}\n\n`;
      report += `状态: ${modulePassed === moduleResults.length ? '✅ 全部通过' : '⚠️ 有失败'}\n\n`;

      for (const result of moduleResults) {
        const icon = result.status === 'pass' ? '✅' : '❌';
        report += `### ${icon} ${result.testName}\n`;
        report += `- 耗时: ${result.duration}ms\n`;
        report += `- 状态: ${result.status}\n`;
        report += `- 详情: ${result.details}\n`;
        
        if (result.error) {
          report += `- 错误: ${result.error}\n`;
        }
        report += '\n';
      }
    }

    if (failed.length > 0) {
      report += '## 失败详情\n\n';
      for (const result of failed) {
        report += `- **${result.module} - ${result.testName}**: ${result.details}\n`;
      }
      report += '\n';
    }

    return report;
  }
}

// Helper function to clean test directories
export function cleanTestDir(dirPath: string) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
  fs.mkdirSync(dirPath, { recursive: true });
}

// Assertion helpers
export function assert(condition: boolean, message: string = 'Assertion failed') {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

export function assertNotNull<T>(value: T, message?: string) {
  if (value == null) {
    throw new Error(message || 'Expected non-null value');
  }
}
