export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  agent?: string;
}

export interface FileInfo {
  path: string;
  name: string;
  content: string;
  language: string;
  size: number;
}

export interface TerminalLine {
  id: string;
  type: 'command' | 'stdout' | 'stderr' | 'error' | 'log' | 'info' | 'warn';
  content: string;
  timestamp: number;
}

export interface AgentStatus {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export type LLMProvider = 'deepseek' | 'zhipu';

export type TabType = 'preview' | 'code' | 'terminal';

// 消息类型扩展
export type MessageType = 'text' | 'task_breakdown' | 'task_execution' | 'task_summary';

export interface TaskExecutionContent {
  tasks: Array<{
    id: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    output?: string;
  }>;
  batchId: string;
  currentBatch: number;
  totalBatches: number;
  isComplete: boolean;
}

export interface EnhancedMessage {
  id: string;
  type: MessageType;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  taskBreakdown?: any;
  taskExecution?: TaskExecutionContent;
}
