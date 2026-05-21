# 增强记忆系统 - 架构文档

## 概述

本系统实现了一个完整的记忆系统，用于 AI 代码生成平台，支持多轮对话、上下文保持、记忆持久化等核心功能。

## 目录结构

```
server/src/
├── services/
│   ├── MemoryManager.ts          # 记忆管理核心服务
│   └── llm/
│       └── MockLLMService.ts     # Mock LLM 服务（用于测试）
└── types/
    └── memory.ts                 # 记忆系统类型定义
```

## 数据模型

### UserMemory（用户记忆）

```typescript
interface UserMemory {
  userId: string;
  createdAt: number;
  updatedAt: number;
  techStack: Array<{ tech: string; frequency: number }>;
  recentMemories: Array<{
    content: string;
    projectId: string;
    timestamp: number;
  }>;
  compressedMemory: string;
  conversationCount: number;
  context?: string;
}
```

### ProjectMemory（项目记忆）

```typescript
interface ProjectMemory {
  projectId: string;
  userId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  goal: string;
  techStack: string[];
  completedFeatures: string[];
  inProgressFeatures: string[];
  plannedFeatures: string[];
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    userRequest?: string;
    aiUnderstanding?: string;
    tasks?: string[];
    result?: string;
  }>;
  context: string;
  recentMemories: Array<{
    content: string;
    timestamp: number;
    round: number;
  }>;
  compressedMemories: Array<{
    content: string;
    timestamp: number;
    rounds: string;
  }>;
  conversationCount: number;
}
```

## 核心功能

### 1. 内存缓存

使用 `Map` 数据结构实现快速访问：

```typescript
private projectCache: Map<string, ProjectMemory> = new Map();
private userCache: Map<string, UserMemory> = new Map();
```

### 2. 异步 JSON 持久化

- 延迟写入（默认 1 秒）
- 防抖机制
- 文件位置：`{baseDir}/atoms-memory/projects/[projectId].json`

```typescript
private pendingWrites: Map<string, NodeJS.Timeout> = new Map();

private saveProjectMemory(projectId: string, memory: ProjectMemory): void {
  this.projectCache.set(projectId, memory);
  
  if (this.pendingWrites.has(projectId)) {
    clearTimeout(this.pendingWrites.get(projectId));
  }
  
  const timeout = setTimeout(() => {
    const memoryFile = path.join(this.projectsDir, `${projectId}.json`);
    fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2), 'utf-8');
    this.pendingWrites.delete(projectId);
  }, this.PERSIST_DELAY);
  
  this.pendingWrites.set(projectId, timeout);
}
```

### 3. 上下文构建

为 LLM 提供上下文信息，包括：

- 用户偏好
- 项目目标
- 技术栈
- 对话历史
- 已完成功能

```typescript
async buildContext(
  userId: string, 
  projectId?: string, 
  options?: MemoryPromptOptions
): Promise<string>
```

### 4. 记忆压缩

- 每 8 轮对话压缩一次
- 使用 LLM 生成摘要
- 保存历史压缩记录

### 5. 多项目隔离

每个项目有独立的记忆文件，确保上下文隔离。

## API 说明

### MemoryManager API

| 方法 | 说明 |
|------|------|
| `createProjectMemory()` | 创建项目记忆 |
| `updateProjectGoal()` | 更新项目目标 |
| `addTechStack()` | 添加技术栈 |
| `addCompletedFeature()` | 添加完成的功能 |
| `addUserMessage()` | 添加用户消息 |
| `addAssistantMessage()` | 添加助手消息 |
| `addMessageWithCompression()` | 添加消息并压缩 |
| `buildContext()` | 构建上下文提示 |
| `getCompressedMemory()` | 获取压缩记忆 |
| `hasProjectMemory()` | 检查项目记忆是否存在 |
| `getMemoryFilePath()` | 获取记忆文件路径 |
| `loadMemoryFromFile()` | 从文件加载记忆 |
| `flushAll()` | 刷新所有待写入的数据 |

## 使用示例

### 初始化

```typescript
import { MemoryManager } from './services/MemoryManager.js';
import { MockLLMService } from './services/llm/MockLLMService.js';

const memoryManager = new MemoryManager();
const mockLLM = new MockLLMService();
memoryManager.setLLMService(mockLLM);
```

### 创建项目

```typescript
const projectId = 'project-123';
const userId = 'user-456';

await memoryManager.createProjectMemory(projectId, userId, '我的应用');
await memoryManager.updateProjectGoal(projectId, '创建一个现代化的 Web 应用');
await memoryManager.addTechStack(projectId, ['React', 'TypeScript', 'Tailwind CSS']);
```

### 添加对话

```typescript
// 第一轮对话
await memoryManager.addMessageWithCompression(
  projectId,
  userId,
  '建立TODO应用',
  '好的！我来帮你创建一个 TODO 应用。'
);

// 第二轮对话（保持上下文）
await memoryManager.addMessageWithCompression(
  projectId,
  userId,
  '重新做，需要有header头表明名称',
  '好的！我来重新制作 TODO 应用，添加 header 显示应用名称。'
);
```

### 获取上下文

```typescript
const context = await memoryManager.buildContext(userId, projectId);
console.log(context);
```

## 测试覆盖

### 测试场景

| 测试名称 | 说明 |
|---------|------|
| 基础记忆操作测试 | 测试 buildContext 和 getCompressedMemory |
| 项目记忆创建测试 | 测试 createProjectMemory 和 hasProjectMemory |
| JSON持久化测试 | 测试文件写入和内容验证 |
| 对话历史测试 | 测试 addUserMessage 和 addAssistantMessage |
| 多轮对话记忆测试 | 测试两轮对话的上下文保持 |
| 从文件加载记忆测试 | 测试记忆的持久化和恢复 |
| 上下文构建测试 | 验证上下文包含正确信息 |
| 项目目标和技术栈测试 | 验证目标和技术栈更新 |
| 内存刷新测试 | 测试 flushAll 功能 |
| 多项目记忆测试 | 验证项目间的记忆隔离 |
| LLM集成测试 | 测试 Mock LLM 的响应 |

### 运行测试

构建项目后运行测试：

```bash
cd server
npm run build
npx tsx run-test.ts
```

## 持久化文件结构

```
atoms-memory/
├── users/
│   └── {userId}.json
│       {
│         "userId": "...",
│         "createdAt": 123456789,
│         "updatedAt": 123456789,
│         "techStack": [...],
│         "recentMemories": [...],
│         "compressedMemory": "...",
│         "conversationCount": 5
│       }
└── projects/
    └── {projectId}.json
        {
          "projectId": "...",
          "userId": "...",
          "name": "...",
          "createdAt": 123456789,
          "updatedAt": 123456789,
          "goal": "...",
          "techStack": [...],
          "completedFeatures": [...],
          "conversationHistory": [...],
          "recentMemories": [...],
          "compressedMemories": [...]
        }
```

## SocketHandler 集成

在现有的 SocketHandler 中已经集成了记忆系统：

```typescript
// 在 chat:message 事件中
const compressedMemory = await this.memoryManager.getCompressedMemory(userId, projectId);

// 在 task:confirm 事件中
const compressedMemory = await this.memoryManager.getCompressedMemory(userId, targetProjectId);

// 在处理完成后
await this.memoryManager.addMessageWithCompression(targetProjectId, userId, userRequest, fullResponse);
```

## 设计特点

1. **性能优化**：内存缓存 + 延迟写入，减少 I/O 操作
2. **类型安全**：完整的 TypeScript 类型定义
3. **数据一致性**：防抖机制避免频繁写入
4. **可扩展性**：易于添加新的记忆维度
5. **测试友好**：提供 Mock LLM 支持完整测试

## 关键用例

### 多轮对话场景

**第一轮**：用户说 "建立TODO应用"
- 系统记住项目目标
- 保存对话历史

**第二轮**：用户说 "重新做，需要有header头表明名称"
- 系统理解这是对同一个TODO项目的修改
- 记忆包含项目目标和之前的对话
- 正确构建上下文传递给AI

### 多项目切换

- 用户切换项目时，记忆系统自动加载对应项目的记忆
- 不同项目的记忆完全隔离
- 用户跨项目的偏好保存在用户记忆中

## 总结

✅ **记忆成功持久化到 JSON 文件**
✅ **记忆可以从文件正确加载**
✅ **AI对话时记忆被正确传递**
✅ **多轮对话保持上下文连贯**
✅ **多个项目的记忆正确隔离**
