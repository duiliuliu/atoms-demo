import { TaskQueueManager } from '../services/TaskQueueManager.js';
import { MemoryManager } from '../services/MemoryManager.js';
import * as fs from 'fs';
import * as path from 'path';
import { TestRunner, cleanTestDir, assert, assertEqual, assertNotNull } from './utils/testRunner.js';

export async function createIntegrationTests(runner: TestRunner) {
  runner.addModule({
    name: 'TaskQueue & Memory Integration',
    tests: [
      {
        name: '创建项目与任务和记忆',
        fn: testCreateProjectWithTasksAndMemory
      },
      {
        name: '处理批次执行',
        fn: testBatchExecution
      },
      {
        name: '跨管理器持久化',
        fn: testPersistAcrossManagerRestarts
      }
    ]
  });
}

async function testCreateProjectWithTasksAndMemory() {
  const testDir = path.join(process.cwd(), 'test-integration-' + Date.now());
  cleanTestDir(testDir);

  try {
    const projectId = 'proj-' + Date.now();
    const userId = 'user-1';

    const tqManager = new TaskQueueManager(path.join(testDir, 'queues'));
    const memManager = new MemoryManager(path.join(testDir, 'memory'));

    await memManager.createProjectMemory(projectId, userId, 'Weather App');
    await memManager.updateProjectGoal(projectId, 'Create a weather app');

    const tasks = [
      { id: '1', type: 'create_file' as const, target: 'index.html', content: '<html></html>', estimatedTokens: 100, status: 'pending' as const, dependencies: [] },
      { id: '2', type: 'create_file' as const, target: 'style.css', content: 'body {}', estimatedTokens: 50, status: 'pending' as const, dependencies: [] },
    ];

    const queue = tqManager.createQueue(projectId, userId, tasks);

    const memory = await memManager.getCompressedMemory(userId, projectId);
    assert(memory.includes('Weather App'), '记忆应包含 Weather App');

    assertEqual(queue.tasks.length, 2);
    assertEqual(queue.totalBatches, 1);

    tqManager.startQueue(projectId);
    tqManager.updateTaskStatus(projectId, '1', 'completed', 'Created successfully');

    const updatedQueue = tqManager.getQueue(projectId);
    assertNotNull(updatedQueue);
    assertEqual(updatedQueue.tasks[0].status, 'completed');

    await memManager.addMessageWithCompression(
      projectId,
      userId,
      'Create weather app',
      'Creating weather app...'
    );

    const finalMemory = await memManager.getCompressedMemory(userId, projectId);
    assert(finalMemory.includes('Weather'), '最终记忆应包含 Weather');
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
}

async function testBatchExecution() {
  const testDir = path.join(process.cwd(), 'test-batch-' + Date.now());
  cleanTestDir(testDir);

  try {
    const projectId = 'proj-batch-' + Date.now();
    const userId = 'user-1';

    const tqManager = new TaskQueueManager(testDir);

    const tasks = [
      { id: '1', type: 'create_file' as const, target: 'file1.html', content: '', estimatedTokens: 100, status: 'pending' as const, dependencies: [] },
      { id: '2', type: 'create_file' as const, target: 'file2.html', content: '', estimatedTokens: 100, status: 'pending' as const, dependencies: [] },
      { id: '3', type: 'create_file' as const, target: 'file3.html', content: '', estimatedTokens: 100, status: 'pending' as const, dependencies: [] },
      { id: '4', type: 'create_file' as const, target: 'file4.html', content: '', estimatedTokens: 100, status: 'pending' as const, dependencies: [] },
    ];

    const queue = tqManager.createQueue(projectId, userId, tasks, 2);
    assertEqual(queue.totalBatches, 2);

    const batch1 = tqManager.getCurrentBatch(projectId);
    assertEqual(batch1.length, 2);
    assertEqual(batch1[0].target, 'file1.html');
    assertEqual(batch1[1].target, 'file2.html');

    for (const task of batch1) {
      tqManager.updateTaskStatus(projectId, task.id, 'completed');
    }
    tqManager.moveToNextBatch(projectId);

    const batch2 = tqManager.getCurrentBatch(projectId);
    assertEqual(batch2.length, 2);
    assertEqual(batch2[0].target, 'file3.html');
    assertEqual(batch2[1].target, 'file4.html');

    for (const task of batch2) {
      tqManager.updateTaskStatus(projectId, task.id, 'completed');
    }
    const finalQueue = tqManager.moveToNextBatch(projectId);
    assertNotNull(finalQueue);
    assertEqual(finalQueue.status, 'completed');
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
}

async function testPersistAcrossManagerRestarts() {
  const testDir = path.join(process.cwd(), 'test-persist-' + Date.now());
  cleanTestDir(testDir);

  try {
    const projectId = 'proj-persist-' + Date.now();
    const userId = 'user-1';

    const tqManager = new TaskQueueManager(path.join(testDir, 'queues'));
    const memManager = new MemoryManager(path.join(testDir, 'memory'));

    const tasks = [
      { id: '1', type: 'create_file' as const, target: 'app.html', content: '', estimatedTokens: 100, status: 'pending' as const, dependencies: [] },
    ];
    tqManager.createQueue(projectId, userId, tasks);

    await memManager.createProjectMemory(projectId, userId, 'Test Project');

    const tqManager2 = new TaskQueueManager(path.join(testDir, 'queues'));
    const memManager2 = new MemoryManager(path.join(testDir, 'memory'));

    const loadedQueue = tqManager2.getQueue(projectId);
    assertNotNull(loadedQueue);
    assertEqual(loadedQueue.projectId, projectId);

    const loadedMemory = await memManager2.getCompressedMemory(userId, projectId);
    assert(loadedMemory.includes('Test Project'), '加载的记忆应包含 Test Project');
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
}

async function main() {
  console.log('🔬 TaskQueue & Memory 集成测试套件\n');

  const runner = new TestRunner();

  await createIntegrationTests(runner);

  const results = await runner.run();

  const failed = results.filter(r => r.status === 'fail').length;
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});
