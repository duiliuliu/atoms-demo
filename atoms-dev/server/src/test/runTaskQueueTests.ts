// Run TaskQueueManager tests
import { TestRunner } from './utils/testRunner.js';
import { createTaskQueueTests } from './TaskQueueManager.test.js';

async function main() {
  console.log('🔬 TaskQueueManager 测试套件\n');
  
  const runner = new TestRunner();
  
  await createTaskQueueTests(runner);
  
  const results = await runner.run();
  
  const failed = results.filter(r => r.status === 'fail').length;
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});
