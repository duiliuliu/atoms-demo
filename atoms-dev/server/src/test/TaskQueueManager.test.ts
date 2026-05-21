// Test Module - TaskQueueManager
import * as fs from 'fs';
import * as path from 'path';
import { TaskQueueManager } from '../services/TaskQueueManager.js';
import { TestRunner, cleanTestDir, assert, assertEqual, assertNotNull } from './utils/testRunner.js';

export async function createTaskQueueTests(runner: TestRunner) {
  runner.addModule({
    name: '模块 - TaskQueueManager',
    tests: [
      {
        name: '创建队列',
        fn: testCreateQueue
      },
      {
        name: '获取当前批次',
        fn: testGetCurrentBatch
      },
      {
        name: '更新任务状态',
        fn: testUpdateTaskStatus
      },
      {
        name: '移动到下一个批次',
        fn: testMoveToNextBatch
      },
      {
        name: '持久化队列到磁盘',
        fn: testPersistQueue
      },
      {
        name: '清空队列',
        fn: testClearQueue
      },
      {
        name: '创建快照',
        fn: testCreateSnapshot
      }
    ]
  });
}

function createTestTasks() {
  return [
    { 
      id: '1', 
      type: 'create_file' as const, 
      target: 'file1.html', 
      content: '', 
      estimatedTokens: 100, 
      status: 'pending' as const, 
      dependencies: [] 
    },
    { 
      id: '2', 
      type: 'create_file' as const, 
      target: 'file2.html', 
      content: '', 
      estimatedTokens: 100, 
      status: 'pending' as const, 
      dependencies: [] 
    },
    { 
      id: '3', 
      type: 'create_file' as const, 
      target: 'file3.html', 
      content: '', 
      estimatedTokens: 100, 
      status: 'pending' as const, 
      dependencies: [] 
    }
  ];
}

async function testCreateQueue() {
  const testDir = path.join(process.cwd(), 'test-tq-' + Date.now());
  cleanTestDir(testDir);
  
  try {
    const manager = new TaskQueueManager(testDir);
    const tasks = createTestTasks();
    
    const queue = manager.createQueue('test-project', 'user1', tasks);
    
    assertNotNull(queue, '队列不应为空');
    assertEqual(queue.projectId, 'test-project');
    assertEqual(queue.userId, 'user1');
    assertEqual(queue.tasks.length, 3);
    assertEqual(queue.totalBatches, 2); // 3 tasks with batchSize=2
    assertEqual(queue.status, 'idle');
    assertEqual(queue.currentBatch, 0);
    assertEqual(queue.currentTaskIndex, 0);
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
}

async function testGetCurrentBatch() {
  const testDir = path.join(process.cwd(), 'test-tq-batch-' + Date.now());
  cleanTestDir(testDir);
  
  try {
    const manager = new TaskQueueManager(testDir);
    const tasks = createTestTasks();
    
    manager.createQueue('test-project', 'user1', tasks, 2);
    const batch = manager.getCurrentBatch('test-project');
    
    assertEqual(batch.length, 2);
    assertEqual(batch[0].id, '1');
    assertEqual(batch[1].id, '2');
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
}

async function testUpdateTaskStatus() {
  const testDir = path.join(process.cwd(), 'test-tq-status-' + Date.now());
  cleanTestDir(testDir);
  
  try {
    const manager = new TaskQueueManager(testDir);
    const tasks = createTestTasks();
    
    manager.createQueue('test-project', 'user1', tasks);
    
    const updated = manager.updateTaskStatus('test-project', '1', 'in_progress');
    assertNotNull(updated);
    assertEqual(updated.tasks[0].status, 'in_progress');
    assertNotNull(updated.tasks[0].startedAt);
    
    const completed = manager.updateTaskStatus('test-project', '1', 'completed', 'Success result');
    assertNotNull(completed);
    assertEqual(completed.tasks[0].status, 'completed');
    assertEqual(completed.tasks[0].result, 'Success result');
    assertNotNull(completed.tasks[0].completedAt);
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
}

async function testMoveToNextBatch() {
  const testDir = path.join(process.cwd(), 'test-tq-next-' + Date.now());
  cleanTestDir(testDir);
  
  try {
    const manager = new TaskQueueManager(testDir);
    const tasks = createTestTasks();
    
    manager.createQueue('test-project', 'user1', tasks, 2);
    manager.startQueue('test-project');
    
    const updated = manager.moveToNextBatch('test-project');
    assertNotNull(updated);
    assertEqual(updated.currentBatch, 1);
    assertEqual(updated.currentTaskIndex, 2);
    
    // Get batch should now return task 3
    const batch = manager.getCurrentBatch('test-project');
    assertEqual(batch.length, 1);
    assertEqual(batch[0].id, '3');
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
}

async function testPersistQueue() {
  const testDir = path.join(process.cwd(), 'test-tq-persist-' + Date.now());
  cleanTestDir(testDir);
  
  try {
    const manager = new TaskQueueManager(testDir);
    const tasks = createTestTasks();
    
    manager.createQueue('test-project', 'user1', tasks);
    
    // Create a new manager instance to verify persistence
    const newManager = new TaskQueueManager(testDir);
    const loadedQueue = newManager.getQueue('test-project');
    
    assertNotNull(loadedQueue);
    assertEqual(loadedQueue.projectId, 'test-project');
    assertEqual(loadedQueue.tasks.length, 3);
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
}

async function testClearQueue() {
  const testDir = path.join(process.cwd(), 'test-tq-clear-' + Date.now());
  cleanTestDir(testDir);
  
  try {
    const manager = new TaskQueueManager(testDir);
    const tasks = createTestTasks();
    
    manager.createQueue('test-project', 'user1', tasks);
    manager.clearQueue('test-project');
    
    const queue = manager.getQueue('test-project');
    assert(queue === undefined, '队列应该被清空');
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
}

async function testCreateSnapshot() {
  const testDir = path.join(process.cwd(), 'test-tq-snapshot-' + Date.now());
  cleanTestDir(testDir);
  
  try {
    const manager = new TaskQueueManager(testDir);
    const tasks = createTestTasks();
    
    manager.createQueue('test-project', 'user1', tasks);
    
    // Mark some tasks as completed
    manager.updateTaskStatus('test-project', '1', 'completed');
    manager.updateTaskStatus('test-project', '2', 'completed');
    
    const snapshot = manager.createSnapshot(
      'test-project',
      { 'file1.html': 'content1' },
      'memory summary'
    );
    
    assertEqual(snapshot.projectId, 'test-project');
    assertEqual(snapshot.recentFiles['file1.html'], 'content1');
    assertEqual(snapshot.memoryDigest, 'memory summary');
    assertEqual(snapshot.completedTasks.length, 2);
    assert(snapshot.completedTasks.includes('1'));
    assert(snapshot.completedTasks.includes('2'));
    assertNotNull(snapshot.timestamp);
  } finally {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
}
