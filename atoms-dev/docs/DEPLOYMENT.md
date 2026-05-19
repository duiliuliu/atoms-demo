# Atoms.dev 部署指南

## 架构概述

- **前端**: Vercel (https://your-app.vercel.app)
- **后端**: Render (https://your-server.onrender.com)

---

## 一、后端部署 (Render)

### 1. 准备工作

1. 在 Render 上创建账户
2. 连接你的 GitHub 仓库
3. 在 Render 中创建新的 Web Service

### 2. 配置环境变量

在 Render 后台设置以下环境变量:

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `NODE_ENV` | `production` | ✅ |
| `RENDER` | `true` | ✅ |
| `PORT` | `10000` (Render 自动设置) | ✅ |
| `CORS_ORIGIN` | 你的 Vercel 域名，如 `https://xxx.vercel.app` | ✅ |
| `DEEPSEEK_API_KEY` | DeepSeek API Key | ✅ |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` | ✅ |
| `ZHIPU_API_KEY` | Zhipu AI API Key | ✅ |
| `ZHIPU_BASE_URL` | `https://open.bigmodel.cn/api/paas/v4/` | ✅ |

### 3. 使用 render.yaml (推荐)

项目根目录已包含 `render.yaml`，可以直接:

1. 在 Render 中选择 "Blueprint"
2. 连接你的仓库
3. Render 会自动读取配置并部署

### 4. 手动配置

如果不使用 Blueprint:

```yaml
Service Type: Web Service
Environment: Node
Plan: Starter
Region: Singapore
Root Directory: server
Build Command: npm install && npm run build
Start Command: npm start
Health Check: /health
```

### 5. 沙箱目录策略

- **生产环境 (Render)**: `/tmp/atoms-sandbox/`
- **开发环境 (本地)**: `server/atoms-sandbox/`

---

## 二、前端部署 (Vercel)

### 1. 准备工作

1. 在 Vercel 上创建账户
2. 连接你的 GitHub 仓库
3. 导入项目

### 2. 配置

Vercel 会自动读取根目录的 `vercel.json`，会将部署根目录设为 `client/`

### 3. 环境变量

在 Vercel 后台设置:

```
VITE_BACKEND_URL=https://your-server.onrender.com
```

### 4. 一键部署

点击 Vercel 部署按钮，或推送代码到 `main` 分支即可。

---

## 三、部署后配置

### 1. 验证后端健康检查

访问 `https://your-server.onrender.com/health`，应该返回:

```json
{
  "status": "ok",
  "timestamp": "...",
  "environment": "production",
  "platform": "render"
}
```

### 2. 验证前端

访问你的 Vercel 域名，应该能看到界面。

### 3. 验证功能

1. 发送 "创建一个 todo 应用" 消息
2. 右侧应该能看到预览
3. 左侧应该能看到代码文件

---

## 四、常见问题

### Q: CORS 错误

**A**: 确保在 Render 后台设置了正确的 `CORS_ORIGIN` 为你的 Vercel 域名。

### Q: 文件找不到 / Cannot GET /xxx

**A**: 生产环境沙箱目录是 `/tmp/atoms-sandbox/`，权限应该没问题。重启服务试试。

### Q: 如何修改 CORS 允许的域名

**A**: 修改 `server/src/index.ts` 中的 `corsOptions`。

### Q: 如何添加新的 AI 模型

**A**: 参考 `server/src/services/llm/` 下的现有代码。

---

## 五、本地开发

```bash
# 启动前端
cd client
npm install
npm run dev

# 启动后端 (另一个终端)
cd server
npm install
npm run dev
```

---

## 六、部署架构图

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                     │
│  - Static assets                                         │
│  - React SPA                                             │
│  - Vite build output                                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ API Calls & WebSocket
                 │
┌─────────────────────────────────────────────────────────┐
│                   Render (Backend)                       │
│  - Node.js + Express                                     │
│  - Socket.io (WebSocket)                                 │
│  - AI Agent Service                                      │
│  - Sandbox files in /tmp/atoms-sandbox/                  │
└─────────────────────────────────────────────────────────┘
```
