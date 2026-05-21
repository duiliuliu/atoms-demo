import * as fs from 'fs';
import * as path from 'path';
import { getSandboxBaseDir } from '../config/env.js';
import type { TaskQueueState, BuildTask, ContextSnapshot } from '../types/task-queue.js';

export class TaskQueueManager {
  private queues: Map<string, TaskQueueState> = new Map();
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.join(getSandboxBaseDir(), '..', 'task-queues');
    this.ensureDirectories();
    this.loadQueuesFromDisk();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private loadQueuesFromDisk(): void {
    try {
      const files = fs.readdirSync(this.baseDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = fs.readFileSync(path.join(this.baseDir, file), 'utf-8');
          const queue = JSON.parse(content) as TaskQueueState;
          this.queues.set(queue.projectId, queue);
        }
      }
    } catch (e) {
      console.warn('[TaskQueue] Failed to load queues:', e);
    }
  }

  private saveQueueToDisk(projectId: string): void {
    const queue = this.queues.get(projectId);
    if (queue) {
      const filePath = path.join(this.baseDir, `${projectId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(queue, null, 2), 'utf-8');
    }
  }

  createQueue(projectId: string, userId: string, tasks: BuildTask[], batchSize: number = 2): TaskQueueState {
    const queue: TaskQueueState = {
      projectId,
      userId,
      tasks: [...tasks],
      currentTaskIndex: 0,
      status: 'idle',
      currentBatch: 0,
      totalBatches: Math.ceil(tasks.length / batchSize),
      batchSize,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.queues.set(projectId, queue);
    this.saveQueueToDisk(projectId);
    return queue;
  }

  getQueue(projectId: string): TaskQueueState | undefined {
    return this.queues.get(projectId);
  }

  getCurrentBatch(projectId: string): BuildTask[] {
    const queue = this.queues.get(projectId);
    if (!queue) return [];
    
    const start = queue.currentTaskIndex;
    const end = Math.min(start + queue.batchSize, queue.tasks.length);
    return queue.tasks.slice(start, end);
  }

  startQueue(projectId: string): TaskQueueState | undefined {
    const queue = this.queues.get(projectId);
    if (!queue) return undefined;
    
    queue.status = 'in_progress';
    queue.updatedAt = Date.now();
    this.saveQueueToDisk(projectId);
    return queue;
  }

  updateTaskStatus(
    projectId: string, 
    taskId: string, 
    status: BuildTask['status'], 
    result?: string, 
    error?: string
  ): TaskQueueState | undefined {
    const queue = this.queues.get(projectId);
    if (!queue) return undefined;

    const task = queue.tasks.find(t => t.id === taskId);
    if (!task) return undefined;

    task.status = status;
    if (status === 'in_progress') {
      task.startedAt = Date.now();
    }
    if (status === 'completed' || status === 'failed') {
      task.completedAt = Date.now();
      task.result = result;
      task.error = error;
    }

    queue.updatedAt = Date.now();
    this.saveQueueToDisk(projectId);
    return queue;
  }

  moveToNextBatch(projectId: string): TaskQueueState | undefined {
    const queue = this.queues.get(projectId);
    if (!queue) return undefined;

    queue.currentTaskIndex += queue.batchSize;
    
    if (queue.currentTaskIndex >= queue.tasks.length) {
      queue.status = 'completed';
    }
    
    queue.currentBatch++;
    queue.updatedAt = Date.now();
    this.saveQueueToDisk(projectId);
    return queue;
  }

  createSnapshot(projectId: string, recentFiles: Record<string, string>, memoryDigest: string): ContextSnapshot {
    const queue = this.queues.get(projectId);
    const snapshot: ContextSnapshot = {
      projectId,
      recentFiles,
      completedTasks: queue?.tasks.filter(t => t.status === 'completed').map(t => t.id) || [],
      memoryDigest,
      timestamp: Date.now(),
    };
    return snapshot;
  }

  clearQueue(projectId: string): void {
    this.queues.delete(projectId);
    const filePath = path.join(this.baseDir, `${projectId}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
