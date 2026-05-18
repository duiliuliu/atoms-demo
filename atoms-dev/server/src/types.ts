export interface Message {
  id: string;
  role: 'user' | 'ai' | 'system';
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

export interface Project {
  id: string;
  name: string;
  files: Map<string, FileInfo>;
  sandboxId?: string;
  previewUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRequest {
  content: string;
  projectId?: string;
}

export interface AgentStatus {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface CommandResult {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
}
