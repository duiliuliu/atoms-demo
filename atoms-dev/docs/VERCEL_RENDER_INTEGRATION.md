# Vercel 前端 + Render 后端 部署指南

## 一、架构说明

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                     │
│  域名: https://your-app.vercel.app                       │
│  前端: React + Vite                                      │
│  职责: 用户界面、代码编辑器、实时预览                       │
└────────────────────┬────────────────────────────────────┘
                     │ WebSocket + HTTP
                     │ WebSocket: wss://your-server.onrender.com
                     │ HTTP: https://your-server.onrender.com
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Render (Backend)                       │
│  域名: https://your-server.onrender.com                   │
│  后端: Node.js + Express + Socket.IO                     │
│  职责: AI Agent、代码生成、沙箱管理                        │
└─────────────────────────────────────────────────────────┘
```

---

## 二、前端需要修改的配置

### 1. 创建环境变量文件

#### 本地开发 (.env.local)
```bash
# /workspace/atoms-dev/client/.env.local
VITE_BACKEND_URL=http://localhost:3001
```

#### 生产环境
在 Vercel 控制台设置：
```
VITE_BACKEND_URL=https://your-server.onrender.com
```

### 2. 修改 Socket.IO 连接配置

需要修改 [client/src/stores/index.ts](file:///workspace/atoms-dev/client/src/stores/index.ts#L162-L171)：

```typescript
export function initSocket(): Socket {
  if (socket) return socket;
  
  const backendUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;
  
  socket = io(backendUrl, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    path: '/socket.io',
  });
  
  // ... 其余代码保持不变
}
```

### 3. 修改 API 调用配置

#### 创建 API 客户端
新建 [client/src/api/client.ts](file:///workspace/atoms-dev/client/src/api/client.ts):

```typescript
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

export const api = {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  },

  async post<T>(url: string, data: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  },
};
```

#### 在 Chat 中使用 API 客户端
修改 [client/src/components/Chat/ChatContainer.tsx](file:///workspace/atoms-dev/client/src/components/Chat/ChatContainer.tsx):

```typescript
import { api } from '@/api/client';

export const ChatContainer: React.FC = () => {
  // 获取历史消息
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await api.get<{ messages: Message[] }>('/api/chat/history');
        // 处理历史消息
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    };
    loadHistory();
  }, []);

  // ... 其余代码保持不变
};
```

### 4. 修改 Vite 配置（可选）

如果需要代理，可以在 [client/vite.config.ts](file:///workspace/atoms-dev/client/vite.config.ts) 中添加：

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
        secure: false,
      },
    },
  },
});
```

---

## 三、Vercel 部署步骤

### 1. 准备阶段

#### a. 连接 GitHub 仓库
1. 登录 [Vercel](https://vercel.com)
2. 点击 "New Project"
3. 选择 "Import Git Repository"
4. 选择你的 atoms-dev 仓库

#### b. 配置项目
1. **Framework Preset**: Vite (或自动检测)
2. **Root Directory**: `./` 或 `client`（根据你的目录结构）
3. **Build Command**: `npm run build` (默认)
4. **Output Directory**: `dist` (默认)

### 2. 设置环境变量

在 Vercel 项目设置中添加：

| 环境变量名 | 值 | 说明 |
|-----------|-----|------|
| `VITE_BACKEND_URL` | `https://your-server.onrender.com` | 后端服务地址（**重要！**）|

**注意**：
- 前缀必须是 `VITE_`，否则 Vite 无法读取
- 生产环境和预览环境可以设置不同的值
- 部署预览分支时会自动使用预览环境变量

### 3. 部署

1. 点击 "Deploy"
2. 等待构建完成
3. 访问生成的 URL（如：`https://your-app.vercel.app`）

---

## 四、后端 Render 配置

### 1. 确保 CORS 配置正确

在后端 [server/src/index.ts](file:///workspace/atoms-dev/server/src/index.ts) 中：

```typescript
app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins: (string | RegExp)[] = [
      getEnv('CORS_ORIGIN', 'http://localhost:5173'),
    ];
    
    // 生产环境允许 Vercel 域名
    if (isProduction() || isRender()) {
      allowedOrigins.push(/.*\.vercel\.app$/);
      // 如果你有自定义域名，也添加
      // allowedOrigins.push('https://your-domain.com');
    }
    
    if (!origin || allowedOrigins.some(pattern => {
      if (typeof pattern === 'string') {
        return origin === pattern;
      } else {
        return pattern.test(origin);
      }
    })) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
```

### 2. Render 环境变量

确保在 Render 后台设置了：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `MODE` | `production` | 强制生产模式 |
| `NODE_ENV` | `production` | Node 环境 |
| `RENDER` | `true` | Render 平台标识 |
| `CORS_ORIGIN` | `https://your-app.vercel.app` | 你的 Vercel 域名 |
| `DEEPSEEK_API_KEY` | `sk-xxx` | DeepSeek API Key |
| `ZHIPU_API_KEY` | `xxx` | 智谱 AI API Key |

---

## 五、完整部署流程清单

### ✅ 后端 (Render) 部署

```bash
# 1. 准备
git add .
git commit -m "Deploy backend to Render"
git push origin main

# 2. 在 Render 上
# - 连接 GitHub 仓库
# - 使用 render.yaml 自动配置
# - 设置环境变量（API Keys、CORS_ORIGIN）
# - 等待部署完成
# - 获取后端 URL: https://your-server.onrender.com
```

### ✅ 前端 (Vercel) 部署

```bash
# 1. 修改代码（如需要）
# - 添加 VITE_BACKEND_URL 环境变量
# - 修改 Socket.IO 配置

# 2. 部署
git add .
git commit -m "Update frontend config"
git push origin main

# 3. 在 Vercel 上
# - 连接 GitHub 仓库
# - 设置 VITE_BACKEND_URL=https://your-server.onrender.com
# - 点击 Deploy
# - 获取前端 URL: https://your-app.vercel.app
```

---

## 六、测试验证

### 1. 本地测试后端
```bash
curl https://your-server.onrender.com/health
# 应返回: {"status":"ok","timestamp":"...","environment":"production","platform":"render"}
```

### 2. 本地测试前端（模拟生产）
```bash
cd client
VITE_BACKEND_URL=https://your-server.onrender.com npm run build
# 检查生成的 index.html 中的资源路径
```

### 3. Vercel 部署后测试
1. 访问 `https://your-app.vercel.app`
2. 打开浏览器控制台 (F12)
3. 尝试发送一条消息
4. 检查是否有 WebSocket 连接成功的信息
5. 检查预览区域是否正常显示

---

## 七、常见问题排查

### ❌ 问题 1: WebSocket 连接失败

**症状**：
```
WebSocket connection to 'wss://your-server.onrender.com/socket.io/...' failed
```

**排查步骤**：
1. 检查后端是否正常运行
2. 检查 CORS 配置是否包含 Vercel 域名
3. 检查浏览器控制台的 CORS 错误信息
4. 确认 `VITE_BACKEND_URL` 设置正确

**解决方案**：
```typescript
// 在后端 index.ts 中临时添加调试日志
console.log('CORS Origin:', origin);
console.log('Allowed Origins:', allowedOrigins);
```

### ❌ 问题 2: API 请求 404

**症状**：
```
API Error: 404
```

**排查步骤**：
1. 检查 API 路径是否正确（是否有 `/api` 前缀）
2. 检查后端路由配置
3. 检查 `VITE_BACKEND_URL` 是否包含尾随斜杠

**解决方案**：
```typescript
// 确认 API_BASE_URL 不包含尾随斜杠
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';
```

### ❌ 问题 3: 预览文件 404

**症状**：
```
Cannot GET /abc123/index.html
```

**排查步骤**：
1. 检查沙箱目录是否存在
2. 检查文件是否创建成功
3. 检查文件服务路由

**解决方案**：
```bash
# SSH 到 Render 实例（如果可用）
ls -la /tmp/atoms-sandbox/
# 检查文件是否存在
```

### ❌ 问题 4: CORS 错误

**症状**：
```
Access to fetch at 'https://your-server.onrender.com' from origin 'https://your-app.vercel.app' 
has been blocked by CORS policy
```

**排查步骤**：
1. 检查 `CORS_ORIGIN` 环境变量是否设置
2. 检查是否设置正确（包含协议 `https://`）
3. 检查是否使用了通配符或正则表达式

**解决方案**：
```
# 在 Render 后台设置
CORS_ORIGIN = https://your-app.vercel.app
```

---

## 八、环境变量快速参考

### 前端 (Vercel)

| 变量名 | 值示例 | 必填 |
|--------|--------|------|
| `VITE_BACKEND_URL` | `https://your-server.onrender.com` | ✅ |

### 后端 (Render)

| 变量名 | 值示例 | 必填 |
|--------|--------|------|
| `MODE` | `production` | ✅ |
| `NODE_ENV` | `production` | ✅ |
| `RENDER` | `true` | ✅ |
| `PORT` | `10000` | ✅ (Render 自动) |
| `CORS_ORIGIN` | `https://your-app.vercel.app` | ✅ |
| `DEEPSEEK_API_KEY` | `sk-xxx` | ✅ |
| `ZHIPU_API_KEY` | `xxx` | ✅ |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` | ✅ |
| `ZHIPU_BASE_URL` | `https://open.bigmodel.cn/api/paas/v4/` | ✅ |

---

## 九、后续维护

### 更新环境变量

**Vercel**:
1. 进入项目 Settings → Environment Variables
2. 修改对应的值
3. 需要重新部署才能生效

**Render**:
1. 进入 Service → Environment
2. 修改对应的值
3. 自动重新部署

### 重新部署

**Vercel**:
- 方法 1: Git push 触发自动部署
- 方法 2: Vercel Dashboard → Deployments → 点击 "..." → Redeploy

**Render**:
- 方法 1: Git push 触发自动部署
- 方法 2: Render Dashboard → Service → Manual Deploy → Deploy latest commit

---

## 十、推荐：使用 Preview Deployments

Vercel 支持预览部署，可以为每个 PR 生成独立的预览 URL：

1. 创建新分支: `git checkout -b feature/new-feature`
2. 修改代码
3. 推送: `git push origin feature/new-feature`
4. Vercel 自动创建预览部署
5. 分享预览链接给团队成员测试
6. 合并到 main 后自动部署到生产环境

**预览环境优势**：
- 不影响生产环境
- 可以同时测试多个功能
- 团队协作更方便
