
// 任务状态类型
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

// 单个任务数据结构
export interface ProjectTask {
  id: string;
  description: string;
  status: TaskStatus;
  output?: string;
  createdAt: number;
  completedAt?: number;
}

// 项目数据结构（用于持久化）
export interface StoredProject {
  id: string;                    // 项目ID
  userId: string;                // 用户标识
  name: string;                  // 项目名称
  description?: string;          // 项目描述
  createdAt: number;             // 创建时间
  updatedAt: number;             // 更新时间
  tags: string[];                // 标签
  techStack: string[];           // 技术栈
  sandboxId?: string;            // 沙箱ID（用于持久化）
  files?: Array<{
    path: string;
    content: string;
  }>;                            // 文件内容（用于持久化）
  tasks?: ProjectTask[];         // 任务列表
  messages?: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;                            // 聊天历史
}

// 项目列表返回数据（精简版）
export interface ProjectListItem {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}
