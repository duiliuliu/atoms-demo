import type { TaskType } from './task.js';

// 构建任务
export interface BuildTask {
  id: string;
  type: TaskType;
  target: string; // 文件路径或命令
  content?: string;
  estimatedTokens: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  dependencies: string[];
  result?: string;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

// 任务队列状态
export interface TaskQueueState {
  projectId: string;
  userId: string;
  tasks: BuildTask[];
  currentTaskIndex: number;
  status: 'idle' | 'in_progress' | 'paused' | 'completed';
  currentBatch: number;
  totalBatches: number;
  batchSize: number;
  createdAt: number;
  updatedAt: number;
}

// 上下文快照
export interface ContextSnapshot {
  projectId: string;
  recentFiles: Record<string, string>;
  completedTasks: string[];
  memoryDigest: string;
  timestamp: number;
}
