# AI产出存储与版本管理方案

## 综述

### 功能列表

| 功能模块 | 功能点 | 优先级 |
|---------|--------|--------|
| 用户目录结构 | 子目录设计、路径规范、权限控制 | P0 |
| 内容存储 | 结构化存储、元数据管理、媒体资源 | P0 |
| 前端渲染接口 | API设计、实时推送、Webhook | P0 |
| 版本管理系统 | 快照机制、差异存储、版本历史 | P0 |
| 版本对比 | 差异计算、合并策略、冲突处理 | P1 |
| Git vs 自建对比 | 场景分析、决策依据、选型建议 | P0 |

### 优先级说明
- **P0**：核心能力，系统运行的基础
- **P1**：增强功能，提升用户体验

---

## 详细设计

### 1. 用户目录结构设计

#### 1.1 目录架构概览

```
用户存储空间 (User Storage)
│
├── 📁 projects/                          # 项目根目录
│   ├── 📁 proj_abc123/                  # 项目目录 (UUID)
│   │   ├── 📄 project.json               # 项目元数据
│   │   ├── 📄 config.json                # 项目配置
│   │   │
│   │   ├── 📁 src/                      # 源代码目录
│   │   │   ├── 📁 components/
│   │   │   ├── 📁 pages/
│   │   │   ├── 📁 hooks/
│   │   │   └── 📁 utils/
│   │   │
│   │   ├── 📁 assets/                   # 静态资源
│   │   │   ├── 📁 images/
│   │   │   ├── 📁 fonts/
│   │   │   └── 📁 videos/
│   │   │
│   │   ├── 📁 ai-outputs/               # AI产出物目录 ⭐
│   │   │   ├── 📁 sessions/             # 会话记录
│   │   │   │   ├── 📄 session_2024_01_01.json
│   │   │   │   └── 📄 session_2024_01_02.json
│   │   │   ├── 📁 thought-chains/      # 思维链记录
│   │   │   │   └── 📄 chain_abc.json
│   │   │   ├── 📁 artifacts/            # 生成产物
│   │   │   │   ├── 📁 design/
│   │   │   │   ├── 📁 code/
│   │   │   │   └── 📁 docs/
│   │   │   └── 📁 reviews/              # 审核记录
│   │   │       └── 📄 review_001.json
│   │   │
│   │   └── 📁 .versions/                # 版本快照 (隐藏)
│   │       ├── 📄 v1.0.0.json
│   │       ├── 📄 v0.9.0.json
│   │       └── 📄 manifest.json         # 版本清单
│   │
│   └── 📁 proj_def456/
│
├── 📁 shared/                           # 共享资源
│   ├── 📁 templates/                    # 模板库
│   └── 📁 components/                   # 共享组件
│
├── 📁 trash/                            # 回收站
│   └── (30天后自动清理)
│
└── 📄 user.meta.json                    # 用户元数据
```

#### 1.2 AI产出物目录详解

```
ai-outputs/                    # AI产出物核心目录
│
├── 📁 sessions/              # 会话记录目录
│   │
│   ├── 📄 session_{timestamp}_{session_id}.json
│   │
│   └── 结构:
│       {
│         "id": "sess_xxx",
│         "started_at": "2024-01-01T10:00:00Z",
│         "ended_at": "2024-01-01T10:30:00Z",
│         "mode": "team",           // engineer | team
│         "context": {
│           "project_id": "proj_abc123",
│           "version": "v0.9.0"
│         },
│         "messages": [
│           {
│             "id": "msg_001",
│             "role": "user",
│             "content": "创建一个电商网站",
│             "timestamp": 1704100000
│           },
│           {
│             "id": "msg_002",
│             "role": "agent",
│             "agent": "Mike",
│             "content": "好的，我来帮你创建...",
│             "timestamp": 1704100001,
│             "metadata": {
│               "tokens_used": 1500,
│               "model": "claude-sonnet"
│             }
│           }
│         ],
│         "artifacts": ["file1.js", "file2.css"]
│       }
│
├── 📁 thought-chains/        # 思维链目录 ⭐
│   │
│   ├── 📄 chain_{task_id}.json
│   │
│   └── 结构:
│       {
│         "id": "chain_xxx",
│         "task_id": "task_yyy",
│         "created_at": "2024-01-01T10:00:00Z",
│         "user_input": "创建一个电商网站",
│         "steps": [
│           {
│             "id": "step_1",
│             "type": "understanding",
│             "title": "理解需求",
│             "content": "分析用户想要...",
│             "reasoning": [
│               "1. 用户需要电商功能",
│               "2. 需要商品展示、购物车、支付"
│             ],
│             "status": "completed"
│           },
│           {
│             "id": "step_2",
│             "type": "decision",
│             "title": "方案选择",
│             "options": [
│               {
│                 "id": "opt_react",
│                 "label": "React方案",
│                 "selected": true,
│                 "user_choice": true
│               }
│             ]
│           }
│         ],
│         "final_output": {
│           "plan_id": "plan_zzz",
│           "files_created": ["App.tsx", "index.css"]
│         }
│       }
│
├── 📁 artifacts/              # 生成产物目录
│   │
│   ├── 📁 design/             # 设计类产物
│   │   ├── 📄 mockups.json
│   │   ├── 📄 color-scheme.json
│   │   └── 📄 ux-flow.svg
│   │
│   ├── 📁 code/               # 代码类产物
│   │   ├── 📁 generated/
│   │   └── 📁 refactored/
│   │
│   └── 📁 docs/               # 文档类产物
│       ├── 📄 README.md
│       ├── 📄 API.md
│       └── 📄 CHANGELOG.md
│
└── 📁 reviews/                # 审核记录目录
    │
    ├── 📄 review_{timestamp}.json
    │
    └── 结构:
        {
          "id": "review_001",
          "task_id": "task_yyy",
          "created_at": "2024-01-01T10:15:00Z",
          "reviewer": "Architect",
          "subject_type": "code",
          "subject_id": "file_App_tsx",
          "scores": {
            "completeness": 95,
            "correctness": 90,
            "efficiency": 85,
            "maintainability": 88,
            "security": 92
          },
          "comments": "代码质量良好，建议...",
          "approved": true,
          "suggestions": [
            {
              "type": "improvement",
              "description": "建议添加错误边界",
              "severity": "low"
            }
          ]
        }
```

#### 1.3 路径规范与权限

```typescript
// 路径生成规则
class PathGenerator {
  // 用户根目录
  static userRoot(userId: string): string {
    return `/users/${userId}`;
  }
  
  // 项目目录
  static project(userId: string, projectId: string): string {
    return `${this.userRoot(userId)}/projects/${projectId}`;
  }
  
  // AI产出目录
  static aiOutputs(userId: string, projectId: string): string {
    return `${this.project(userId, projectId)}/ai-outputs`;
  }
  
  // 会话记录
  static session(userId: string, projectId: string, sessionId: string): string {
    return `${this.aiOutputs(userId, projectId)}/sessions/session_${sessionId}.json`;
  }
  
  // 思维链
  static thoughtChain(userId: string, projectId: string, chainId: string): string {
    return `${this.aiOutputs(userId, projectId)}/thought-chains/chain_${chainId}.json`;
  }
  
  // 版本快照
  static version(userId: string, projectId: string, versionId: string): string {
    return `${this.project(userId, projectId)}/.versions/v${versionId}.json`;
  }
}

// 权限矩阵
const PERMISSIONS = {
  OWNER: ['read', 'write', 'delete', 'share', 'admin'],
  EDITOR: ['read', 'write'],
  VIEWER: ['read'],
  GUEST: ['read'],
};
```

---

### 2. 前端渲染接口设计

#### 2.1 API架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      前端渲染接口架构                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐         ┌─────────────┐         ┌──────────┐│
│  │   前端      │◄──────►│   API       │◄──────►│   存储    ││
│  │   应用      │         │   Gateway   │         │   服务    ││
│  └──────┬──────┘         └──────┬──────┘         └──────────┘│
│         │                         │                            │
│         │    WebSocket            │                            │
│         └─────────────────────────┘                            │
│                                                                 │
│  实时推送通道                                                    │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  • 会话消息实时接收                                       │  │
│  │  • 思维链步骤更新                                        │  │
│  │  • 思维链步骤更新                                        │  │
│  │  • 部署状态推送                                          │  │
│  │  • 审核结果通知                                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.2 REST API 设计

```typescript
// ============ 会话管理 API ============

// 获取会话列表
interface GETSessionsRequest {
  project_id: string;
  page?: number;
  page_size?: number;
  start_date?: string;
  end_date?: string;
}

interface GETSessionsResponse {
  sessions: Session[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
  };
}

// 创建新会话
interface POSTSessionRequest {
  project_id: string;
  mode: 'engineer' | 'team';
  context?: {
    version?: string;
    parent_session_id?: string;
  };
}

interface POSTSessionResponse {
  session_id: string;
  created_at: string;
}

// 获取会话详情
interface GETSessionDetailRequest {
  session_id: string;
  include_messages?: boolean;
  include_artifacts?: boolean;
}

interface GETSessionDetailResponse {
  session: Session;
  messages: Message[];
  artifacts: Artifact[];
}

// ============ 思维链 API ============

// 获取思维链
interface GETThoughtChainRequest {
  chain_id: string;
}

interface GETThoughtChainResponse {
  chain: ThoughtChain;
  current_step: number;
  is_complete: boolean;
}

// 订阅思维链实时更新 (WebSocket)
interface WSSubscribeThoughtChain {
  type: 'subscribe_thought_chain';
  chain_id: string;
}

interface WSThoughtChainUpdate {
  type: 'thought_chain_update';
  chain_id: string;
  update: {
    step_id: string;
    status: 'pending' | 'active' | 'completed';
    content?: string;
    reasoning?: string[];
  };
}

// ============ 版本管理 API ============

// 获取版本列表
interface GETVersionsRequest {
  project_id: string;
  page?: number;
  limit?: number;
}

interface GETVersionsResponse {
  versions: Version[];
  total: number;
}

// 获取版本详情
interface GETVersionRequest {
  version_id: string;
  include_files?: boolean;
}

interface GETVersionResponse {
  version: Version;
  files?: FileSnapshot[];
}

// 创建版本
interface POSTVersionRequest {
  project_id: string;
  name?: string;
  description?: string;
  type: 'manual' | 'auto' | 'deploy';
}

interface POSTVersionResponse {
  version_id: string;
  version_name: string;
  created_at: string;
}

// 对比版本
interface GETVersionDiffRequest {
  version_a: string;
  version_b: string;
}

interface GETVersionDiffResponse {
  diff: VersionDiff;
  summary: {
    files_added: number;
    files_modified: number;
    files_deleted: number;
    lines_added: number;
    lines_deleted: number;
  };
}

// ============ 内容推送 API (服务端 -> 前端) ============

// WebSocket 消息类型
interface WSMessageTypes {
  // 会话消息
  'session:message': {
    session_id: string;
    message: Message;
  };
  
  // 思维链更新
  'thought_chain:step': {
    chain_id: string;
    step: ThoughtStep;
  };
  
  // 任务进度
  'task:progress': {
    task_id: string;
    progress: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
  };
  
  // 审核结果
  'review:result': {
    review_id: string;
    approved: boolean;
    scores: Scores;
  };
  
  // 文件变更
  'file:changed': {
    path: string;
    action: 'created' | 'modified' | 'deleted';
    hash: string;
  };
  
  // 版本创建
  'version:created': {
    version_id: string;
    version_name: string;
  };
}
```

#### 2.3 前端状态管理

```typescript
// 前端状态管理 (Zustand)
interface AIStore {
  // 会话状态
  sessions: {
    current: Session | null;
    list: Session[];
    loading: boolean;
  };
  
  // 思维链状态
  thoughtChain: {
    current: ThoughtChain | null;
    activeStep: number;
    isComplete: boolean;
  };
  
  // 版本状态
  versions: {
    list: Version[];
    current: Version | null;
    diff: VersionDiff | null;
  };
  
  // 操作方法
  actions: {
    // 会话
    loadSessions: (projectId: string) => Promise<void>;
    createSession: (projectId: string, mode: 'engineer' | 'team') => Promise<Session>;
    loadSessionDetail: (sessionId: string) => Promise<void>;
    
    // 思维链
    subscribeThoughtChain: (chainId: string) => void;
    unsubscribeThoughtChain: () => void;
    
    // 版本
    loadVersions: (projectId: string) => Promise<void>;
    createVersion: (projectId: string, options: CreateVersionOptions) => Promise<Version>;
    switchVersion: (versionId: string) => Promise<void>;
    compareVersions: (a: string, b: string) => Promise<VersionDiff>;
  };
}

// 使用示例
const useAIStore = create<AIStore>((set, get) => ({
  sessions: {
    current: null,
    list: [],
    loading: false,
  },
  thoughtChain: {
    current: null,
    activeStep: 0,
    isComplete: false,
  },
  versions: {
    list: [],
    current: null,
    diff: null,
  },
  actions: {
    loadSessions: async (projectId) => {
      set(state => ({ sessions: { ...state.sessions, loading: true } }));
      const response = await api.getSessions({ project_id: projectId });
      set(state => ({
        sessions: {
          ...state.sessions,
          list: response.sessions,
          loading: false,
        },
      }));
    },
    
    subscribeThoughtChain: (chainId) => {
      const ws = getWebSocket();
      ws.send({ type: 'subscribe_thought_chain', chain_id: chainId });
    },
    
    // ... 其他方法
  },
}));
```

#### 2.4 前端渲染组件

```tsx
// ============ 会话列表组件 ============
const SessionList: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { sessions, actions } = useAIStore();
  
  useEffect(() => {
    actions.loadSessions(projectId);
  }, [projectId]);
  
  return (
    <div className="session-list">
      <List
        dataSource={sessions.list}
        renderItem={(session) => (
          <List.Item
            actions={[
              <Button key="view" onClick={() => actions.loadSessionDetail(session.id)}>
                查看
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={session.mode === 'team' ? '👥 团队模式' : '🔧 工程师模式'}
              description={formatDate(session.started_at)}
            />
          </List.Item>
        )}
      />
    </div>
  );
};

// ============ 思维链展示组件 ============
const ThoughtChainViewer: React.FC<{ chainId: string }> = ({ chainId }) => {
  const { thoughtChain, actions } = useAIStore();
  
  useEffect(() => {
    actions.subscribeThoughtChain(chainId);
    return () => actions.unsubscribeThoughtChain();
  }, [chainId]);
  
  // WebSocket 监听
  useEffect(() => {
    const ws = getWebSocket();
    const handleMessage = (msg: WSThoughtChainUpdate) => {
      if (msg.type === 'thought_chain_update') {
        set(state => ({
          thoughtChain: {
            ...state.thoughtChain,
            current: updateChainStep(state.thoughtChain.current, msg.update),
          },
        }));
      }
    };
    
    ws.on('message', handleMessage);
    return () => ws.off('message', handleMessage);
  }, []);
  
  if (!thoughtChain.current) return null;
  
  return (
    <div className="thought-chain-viewer">
      {thoughtChain.current.steps.map((step, index) => (
        <ThoughtStepCard
          key={step.id}
          step={step}
          isActive={index === thoughtChain.activeStep}
          onSelect={() => actions.selectStep(index)}
        />
      ))}
    </div>
  );
};

// ============ 版本对比组件 ============
const VersionCompare: React.FC<{ versionA: string; versionB: string }> = ({ 
  versionA, 
  versionB 
}) => {
  const { versions, actions } = useAIStore();
  
  useEffect(() => {
    actions.compareVersions(versionA, versionB);
  }, [versionA, versionB]);
  
  if (!versions.diff) return <Loading />;
  
  return (
    <div className="version-compare">
      <VersionDiffSummary 
        added={versions.diff.files_added.length}
        modified={versions.diff.files_modified.length}
        deleted={versions.diff.files_deleted.length}
      />
      
      <DiffViewer diff={versions.diff} />
    </div>
  );
};
```

---

### 3. 版本管理系统设计

#### 3.1 版本存储结构

```
.versions/                              # 版本存储目录
│
├── manifest.json                       # 版本清单 (索引)
│
├── v1.0.0_full.json                   # 完整快照 (可选)
│
├── v0.9.0_delta.json                  # 增量快照
│
└── v0.8.0_delta.json                  # 增量快照
```

```json
// manifest.json 结构
{
  "project_id": "proj_abc123",
  "versions": [
    {
      "id": "v1.0.0",
      "name": "v1.0.0",
      "created_at": "2024-01-15T10:00:00Z",
      "type": "deploy",
      "parent": "v0.9.0",
      "snapshot_type": "full",
      "snapshot_path": "v1.0.0_full.json",
      "size": 524288,
      "files_count": 45,
      "description": "正式发布版本"
    },
    {
      "id": "v0.9.0",
      "name": "v0.9.0",
      "created_at": "2024-01-14T16:30:00Z",
      "type": "auto",
      "parent": "v0.8.0",
      "snapshot_type": "delta",
      "snapshot_path": "v0.9.0_delta.json",
      "size": 32768,
      "files_count": 8,
      "description": "添加购物车功能"
    }
  ],
  "current": "v1.0.0"
}
```

#### 3.2 快照机制

```typescript
// 快照类型
type SnapshotType = 'full' | 'delta' | 'hybrid';

interface Snapshot {
  id: string;
  version_id: string;
  type: SnapshotType;
  created_at: string;
  
  // 全量快照
  full?: {
    files: FileSnapshot[];
    total_size: number;
  };
  
  // 增量快照
  delta?: {
    parent_version: string;
    changes: FileChange[];
    total_size: number;
  };
  
  // 混合模式 (结合全量和增量)
  hybrid?: {
    base_snapshot: string;    // 基础快照引用
    incremental_changes: FileChange[];
  };
}

// 文件变更
interface FileChange {
  path: string;
  action: 'create' | 'modify' | 'delete' | 'rename';
  content?: string;          // create/modify 时有
  content_hash?: string;
  previous_hash?: string;     // modify 时有
  old_path?: string;          // rename 时有
}

// 版本服务
class VersionSnapshotService {
  // 创建快照
  async createSnapshot(
    projectId: string,
    options: {
      type: SnapshotType;
      description?: string;
    }
  ): Promise<Snapshot> {
    const previousVersion = await this.getLatestVersion(projectId);
    
    // 获取当前文件列表
    const currentFiles = await this.fileService.listFiles(projectId);
    
    let snapshot: Snapshot;
    
    switch (options.type) {
      case 'full':
        snapshot = await this.createFullSnapshot(projectId, currentFiles);
        break;
        
      case 'delta':
        snapshot = await this.createDeltaSnapshot(
          projectId, 
          currentFiles, 
          previousVersion
        );
        break;
        
      case 'hybrid':
        snapshot = await this.createHybridSnapshot(
          projectId,
          currentFiles,
          previousVersion
        );
        break;
    }
    
    // 保存快照
    await this.storage.save(snapshot);
    
    return snapshot;
  }
  
  // 创建全量快照
  private async createFullSnapshot(
    projectId: string,
    files: FileInfo[]
  ): Promise<Snapshot> {
    const fileSnapshots = await Promise.all(
      files.map(async (file) => ({
        path: file.path,
        content: await this.fileService.readFile(file.path),
        content_hash: await this.hash(file.content),
        language: this.detectLanguage(file.path),
        size: file.size,
      }))
    );
    
    return {
      id: generateId(),
      type: 'full',
      created_at: new Date().toISOString(),
      full: {
        files: fileSnapshots,
        total_size: fileSnapshots.reduce((sum, f) => sum + f.size, 0),
      },
    };
  }
  
  // 创建增量快照
  private async createDeltaSnapshot(
    projectId: string,
    currentFiles: FileInfo[],
    previousVersion: Version | null
  ): Promise<Snapshot> {
    let previousFiles: Map<string, FileInfo> = new Map();
    
    if (previousVersion) {
      // 从之前的快照重建文件列表
      previousFiles = await this.reconstructFileList(previousVersion);
    }
    
    // 计算差异
    const changes: FileChange[] = [];
    
    for (const file of currentFiles) {
      const previous = previousFiles.get(file.path);
      
      if (!previous) {
        // 新建
        changes.push({
          path: file.path,
          action: 'create',
          content: await this.fileService.readFile(file.path),
          content_hash: await this.hash(file.content),
        });
      } else if (file.hash !== previous.hash) {
        // 修改
        changes.push({
          path: file.path,
          action: 'modify',
          content: await this.fileService.readFile(file.path),
          content_hash: await this.hash(file.content),
          previous_hash: previous.hash,
        });
      }
      
      previousFiles.delete(file.path);
    }
    
    // 删除的文件
    for (const [path, file] of previousFiles) {
      changes.push({
        path,
        action: 'delete',
        previous_hash: file.hash,
      });
    }
    
    return {
      id: generateId(),
      type: 'delta',
      created_at: new Date().toISOString(),
      delta: {
        parent_version: previousVersion?.id || 'none',
        changes,
        total_size: changes.reduce((sum, c) => sum + (c.content?.length || 0), 0),
      },
    };
  }
  
  // 恢复指定版本
  async restoreVersion(versionId: string): Promise<void> {
    const snapshot = await this.storage.get(versionId);
    
    let files: FileSnapshot[];
    
    if (snapshot.full) {
      files = snapshot.full.files;
    } else if (snapshot.delta) {
      files = await this.reconstructFromDelta(snapshot.delta);
    } else if (snapshot.hybrid) {
      files = await this.reconstructFromHybrid(snapshot.hybrid);
    }
    
    // 写入文件
    for (const file of files) {
      await this.fileService.writeFile(file.path, file.content);
    }
  }
}
```

#### 3.3 版本历史管理

```typescript
class VersionHistoryService {
  // 获取版本历史
  async getHistory(
    projectId: string,
    options?: {
      limit?: number;
      offset?: number;
      type?: 'manual' | 'auto' | 'deploy';
    }
  ): Promise<VersionHistory[]> {
    const manifest = await this.storage.getManifest(projectId);
    
    let versions = manifest.versions;
    
    // 过滤
    if (options?.type) {
      versions = versions.filter(v => v.type === options.type);
    }
    
    // 分页
    const offset = options?.offset || 0;
    const limit = options?.limit || 20;
    
    return versions.slice(offset, offset + limit);
  }
  
  // 自动创建版本
  async autoCreateVersion(projectId: string): Promise<Version> {
    const lastAutoVersion = await this.getLastAutoVersion(projectId);
    
    // 检查是否需要创建新版本
    if (!this.shouldAutoCreate(lastAutoVersion)) {
      return null;
    }
    
    // 创建增量快照
    const snapshot = await this.snapshotService.createSnapshot(projectId, {
      type: 'delta',
      description: '自动保存',
    });
    
    // 创建版本记录
    const version: Version = {
      id: this.generateVersionId(lastAutoVersion),
      name: this.generateVersionName(lastAutoVersion),
      created_at: new Date().toISOString(),
      type: 'auto',
      parent: lastAutoVersion?.id,
      snapshot_id: snapshot.id,
    };
    
    await this.storage.saveVersion(projectId, version);
    
    return version;
  }
  
  // 判断是否需要自动创建版本
  private shouldAutoCreate(lastVersion: Version | null): boolean {
    if (!lastVersion) return true;
    
    const lastTime = new Date(lastVersion.created_at).getTime();
    const now = Date.now();
    const hoursSinceLast = (now - lastTime) / (1000 * 60 * 60);
    
    // 超过2小时自动创建
    return hoursSinceLast >= 2;
  }
}
```

---

### 4. 为什么不用 Git？

#### 4.1 Git 的优势与劣势分析

```
┌─────────────────────────────────────────────────────────────────┐
│                      Git vs 自建版本系统对比                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Git 优势                    │  Git 劣势 / 自建场景              │
│  ────────────────────────────┼─────────────────────────────────  │
│  • 分布式架构               │  • 学习成本高                     │
│  • 分支管理强大             │  • 操作复杂（merge/rebase）       │
│  • 社区生态成熟             │  • 不适合非技术用户               │
│  • 代码审核能力             │  • 存储开销大（完整历史）         │
│  • 协作工作流成熟           │  • 权限控制粒度粗                 │
│  • 离线可用                 │  • UI定制受限                     │
│                              │  • 与AI产出物结合困难             │
│                              │  • 大文件支持差                   │
│                              │  • 分支策略复杂                   │
│                              │  • 冲突解决困难                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2 场景对比分析

| 场景 | Git 适用性 | 自建系统优势 |
|------|-----------|-------------|
| **技术团队协作开发** | ✅ 非常适合 | 需要额外配置 |
| **非技术用户快速原型** | ❌ 门槛太高 | ✅ 简单易用 |
| **AI 辅助生成内容管理** | ❌ 结构性差 | ✅ 可定制元数据 |
| **实时协作编辑** | ❌ 冲突频繁 | ✅ OT/CRDT 集成 |
| **大媒体文件** | ❌ Git LFS 昂贵 | ✅ 对象存储集成 |
| **思维链可视化** | ❌ 不支持 | ✅ 专用数据结构 |
| **一键回滚** | ⚠️ 需要命令 | ✅ 界面化操作 |
| **AI 审核记录** | ❌ 不支持 | ✅ 专用记录格式 |

#### 4.3 核心原因详解

##### 原因一：目标用户不同

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户群体分析                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    传统开发者                    AI 开发平台用户                  │
│    ─────────────                 ─────────────────              │
│                                                                 │
│    • 懂 Git 命令                  • 大部分不懂 Git                │
│    • 需要分支策略                 • 需要的是"版本"概念            │
│    • 熟悉冲突解决                 • 希望一键回退                  │
│    • 需要代码审核                 • 希望看到变更摘要              │
│                                                                 │
│    ┌─────────────────┐            ┌─────────────────┐           │
│    │   Git 操作      │            │   界面化操作     │           │
│    │                 │            │                 │           │
│    │ $ git commit    │            │  [保存版本]      │           │
│    │ $ git push      │            │  [版本历史]      │           │
│    │ $ git merge     │            │  [对比] [恢复]   │           │
│    │                 │            │                 │           │
│    │ 学习曲线: 高     │            │ 学习曲线: 低     │           │
│    └─────────────────┘            └─────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### 原因二：数据结构差异

Git 适合代码文本，但 AI 产出物包含多种类型：

```typescript
// AI 产出物类型
interface AIGeneratedContent {
  type: 'code' | 'design' | 'document' | 'thought_chain' | 'review';
  
  // 思维链 - Git 无法原生支持
  thoughtChain?: {
    steps: ReasoningStep[];
    userDecisions: UserChoice[];
  };
  
  // 审核记录 - 需要专用结构
  review?: {
    scores: QualityScores;
    comments: ReviewComment[];
    suggestions: Suggestion[];
  };
  
  // AI 元数据
  metadata: {
    model: string;
    tokensUsed: number;
    latency: number;
    confidence?: number;
  };
}
```

##### 原因三：性能与存储

```
┌─────────────────────────────────────────────────────────────────┐
│                        存储效率对比                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Git 存储模型:                                                   │
│  • 每个 commit 存储完整内容或引用                                │
│  • Delta 存储有限（默认压缩）                                    │
│  • 大文件效率低                                                 │
│  • 克隆整个历史                                                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  项目 A (100个版本, 每个50个文件)                        │    │
│  │  Git 存储: ~500MB (完整历史)                           │    │
│  │  自建系统: ~50MB (增量快照 + 压缩)                      │    │
│  │  节省: 90%                                             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  项目 B (含大图片/视频素材)                              │    │
│  │  Git: 需要 Git LFS, 额外成本                            │    │
│  │  自建: 直接对象存储，成本低                             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### 原因四：用户体验

```
┌─────────────────────────────────────────────────────────────────┐
│                    用户操作对比                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Git 操作流程:                    自建系统操作流程:              │
│  ───────────────                  ──────────────────              │
│                                                                 │
│  1. git add .                    1. 点击"保存版本"              │
│  2. git commit -m "xxx"          2. 输入版本描述                 │
│  3. git push                     3. 自动保存                    │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  版本回退:                                                      │
│                                                                 │
│  Git:                                                          │
│  $ git log                            $ git checkout xxx        │
│  $ git diff HEAD~3..HEAD             $ git reset --hard xxx    │
│                                                                 │
│  自建:                                                          │
│  [版本列表] ──► [选择版本] ──► [预览变更] ──► [一键恢复]        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### 原因五：AI 集成需求

Git 无法理解 AI 特有的数据结构：

```typescript
// Git 能做的
git.commit("更新代码")

// Git 无法做的
{
  "thought_chain": {
    "reasoning_steps": [...],     // Git 无法追踪
    "confidence_scores": [...],   // Git 无法存储
    "user_selections": [...]      // Git 无法关联
  },
  "review": {
    "quality_scores": {...},      // Git 无法计算
    "agent_approval": {...}       // Git 无法审核
  }
}
```

#### 4.4 选型建议

```
┌─────────────────────────────────────────────────────────────────┐
│                        选型决策树                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                     开始                                         │
│                       │                                         │
│                       ▼                                         │
│            ┌─────────────────────┐                              │
│            │ 用户是开发者吗？      │                              │
│            └─────────────────────┘                              │
│                  │           │                                   │
│                 是          否                                    │
│                  │           │                                   │
│                  ▼           ▼                                   │
│         ┌────────────┐  ┌────────────┐                          │
│         │ 需要协作   │  │ 需要简化  │                          │
│         │ 开发吗？  │  │ 版本管理？│                          │
│         └────────────┘  └────────────┘                          │
│              │                │                                   │
│             是               │                                   │
│              │              否                                   │
│              ▼               ▼                                   │
│     ┌────────────┐    ┌────────────┐                            │
│     │ Git + UI   │    │  自建版本   │                            │
│     │ 包装       │    │  系统       │                            │
│     └────────────┘    └────────────┘                            │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  混合方案 (高级用户):                                             │
│  • 自建版本系统作为主版本管理                                    │
│  • Git 作为可选的高级功能（导出/导入）                            │
│  • 支持 Git 仓库导出                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.5 结论

**不使用 Git 的核心原因**：

1. **用户群体**：目标用户大多是非技术背景，"版本"比"提交"更容易理解

2. **数据结构**：AI 产出物包含思维链、审核记录等非代码内容，Git 无法原生支持

3. **性能优化**：增量快照比 Git 的完整历史存储更高效

4. **用户体验**：一键保存/恢复比 Git 命令行更符合产品定位

5. **定制能力**：自建系统可以完全按照产品需求定制，包括 AI 特有功能

**推荐方案**：

```
┌─────────────────────────────────────────────────────────────────┐
│                      最终推荐架构                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  自建版本系统 (主系统)                                           │
│  ├── 简单易用的界面                                              │
│  ├── 增量快照存储                                                │
│  ├── AI 产出物元数据                                            │
│  ├── 思维链记录                                                  │
│  └── 一键回滚                                                    │
│                              +                                   │
│  Git 导出 (可选功能)                                             │
│  ├── 高级用户可导出为 Git 仓库                                   │
│  ├── 与外部开发工作流集成                                        │
│  └── 保持兼容性                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5. 实现方案

#### 5.1 技术选型

| 组件 | 选型 | 理由 |
|------|------|------|
| 对象存储 | S3 / MinIO / COS | 大文件支持、低成本、高可用 |
| 元数据存储 | PostgreSQL | 结构化查询、事务支持 |
| 缓存层 | Redis | 高频访问加速 |
| 实时推送 | WebSocket | 实时性要求 |
| 快照压缩 | zstd | 高压缩比、快速解压 |

#### 5.2 API 端点设计

```typescript
// API 路由设计
const API_ROUTES = {
  // 会话
  'GET /api/sessions': '获取会话列表',
  'POST /api/sessions': '创建会话',
  'GET /api/sessions/:id': '获取会话详情',
  
  // 思维链
  'GET /api/thought-chains/:id': '获取思维链',
  'WS /api/thought-chains/:id/subscribe': '订阅思维链更新',
  
  // 版本
  'GET /api/projects/:id/versions': '获取版本列表',
  'POST /api/projects/:id/versions': '创建版本',
  'GET /api/versions/:id': '获取版本详情',
  'POST /api/versions/:id/restore': '恢复版本',
  'GET /api/versions/compare': '对比版本',
  
  // 文件
  'GET /api/projects/:id/files': '获取文件列表',
  'GET /api/files/:id/content': '获取文件内容',
};
```

#### 5.3 数据流设计

```
用户操作                    系统处理                    存储层
   │                          │                          │
   │  点击"保存版本"          │                          │
   │─────────────────────────►│                          │
   │                          │                          │
   │                          │  1. 生成快照              │
   │                          │────────────────────────►│
   │                          │                          │
   │                          │  2. 存储快照              │
   │                          │────────────────────────►│
   │                          │                          │
   │                          │  3. 更新 manifest        │
   │                          │────────────────────────►│
   │                          │                          │
   │  版本创建成功             │                          │
   │◄─────────────────────────│                          │
   │                          │                          │
   │  WebSocket 推送           │                          │
   │◄─────────────────────────│                          │
   │                          │                          │
```
