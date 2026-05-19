
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
}

// 项目列表返回数据（精简版）
export interface ProjectListItem {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}
