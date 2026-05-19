// Main Test Runner - Run all tests
import * as fs from 'fs';
import * as path from 'path';
import { TestRunner } from './utils/testRunner.js';
import { createPersistenceTests } from './module1-project-persistence.test.js';
import { createIntentTests } from './module2-intent-classification.test.js';
import { createMemoryTests } from './module3-memory-system.test.js';

async function main() {
  console.log('🔬 Atoms.dev 第二阶段实现方案 - 完整测试套件\n');
  
  const runner = new TestRunner();
  
  // Add all test modules
  await createPersistenceTests(runner);
  await createIntentTests(runner);
  await createMemoryTests(runner);
  
  // Run all tests
  const results = await runner.run();
  
  // Generate and save report
  const report = runner.generateReport();
  const reportPath = path.join(process.cwd(), '..', 'TEST_REPORT_BACKEND.md');
  fs.writeFileSync(reportPath, report, 'utf-8');
  
  console.log(`\n📄 测试报告已保存到: ${reportPath}`);
  
  // Exit with appropriate code
  const failed = results.filter(r => r.status === 'fail').length;
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Test suite failed to run:', error);
  process.exit(1);
});
