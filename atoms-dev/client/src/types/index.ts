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
  type: 'command' | 'stdout' | 'stderr' | 'error';
  content: string;
  timestamp: number;
}

export interface AgentStatus {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export type LLMProvider = 'deepseek' | 'zhipu';

export type TabType = 'preview' | 'code' | 'terminal';
