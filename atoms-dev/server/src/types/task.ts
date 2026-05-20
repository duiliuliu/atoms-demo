
// 任务类型
export type TaskType = 
  | 'create_file'      // 创建文件
  | 'update_file'      // 更新文件
  | 'delete_file'      // 删除文件
  | 'create_folder'    // 创建文件夹
  | 'run_command'      // 执行命令
  | 'preview'          // 预览确认
  | 'modify_style'     // 样式调整
  | 'add_interaction'; // 添加交互

// 单个任务
export interface Task {
  id: string;
  type: TaskType;
  description: string;        // 任务描述
  files: string[];            // 相关文件列表
  content?: string;           // 文件内容（如果需要）
  estimatedTokens: number;    // 预估Token消耗
  dependencies: string[];     // 依赖任务ID
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

// 用户意图分析
export interface UserIntent {
  originalRequest: string;   // 原始需求
  understoodGoal: string;     // AI理解的目标
  scope: 'small' | 'medium' | 'large';
  complexity: 'simple' | 'moderate' | 'complex';
  techStack: string[];        // 技术栈选择
  keyFeatures: string[];      // 核心功能点
  potentialIssues?: string[]; // 潜在问题
}

// 任务拆分结果
export interface TaskBreakdown {
  id: string;
  userIntent: UserIntent;
  tasks: Task[];
  totalEstimatedTokens: number;
  createdAt: number;
  status: 'pending' | 'confirmed' | 'modified' | 'executing' | 'completed';
}
