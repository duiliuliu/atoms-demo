# 部署配置改动总结

## 一、已完成的改动

### 1. 新增文件

| 文件 | 说明 |
|------|------|
| `server/src/config/env.ts` | 环境配置模块，判断环境和获取沙箱目录 |
| `server/.env.example` | 环境变量配置示例文件 |
| `render.yaml` | Render Blueprint 配置文件 |
| `vercel.json` | Vercel 部署配置 |
| `docs/DEPLOYMENT.md` | 完整的部署指南 |
| `docs/P0需求实现方案.md` | P0 功能设计文档 |
| `client/src/components/Layout/Tooltip.tsx` | 悬浮提示组件 |

### 2. 修改文件

| 文件 | 改动 |
|------|------|
| `server/src/index.ts` | 重构 CORS 配置，使用环境判断，添加健康检查 |
| `server/src/services/sandbox/SandboxManager.ts` | 使用环境配置获取沙箱目录 |
| `server/package.json` | 添加 Render 部署脚本和 engines 配置 |
| `client/src/components/Chat/InputBox.tsx` | 添加文件上传按钮的 Tooltip 提示 |
| `.gitignore` (根目录) | 统一 Git 忽略规则 |
| `server/.gitignore` | 添加沙箱目录忽略 |

---

## 二、核心功能说明

### 1. 环境检测策略

```typescript
// 判断是否为生产环境
isProduction(): boolean
  - 检查 NODE_ENV === 'production' 或 RENDER === 'true'

// 判断是否为 Render 环境
isRender(): boolean
  - 检查 RENDER === 'true'

// 获取沙箱目录
getSandboxBaseDir(): string
  - 生产: '/tmp/atoms-sandbox'
  - 开发: '/workspace/atoms-dev/atoms-sandbox'
```

### 2. CORS 配置

- **开发环境**: 默认允许 `http://localhost:5173`
- **Render 环境**: 自动允许 `*.onrender.com` 和 `*.vercel.app`

### 3. Render 配置

```yaml
- Node.js >= 18
- 自动部署
- 健康检查: /health
- 沙箱目录: /tmp/atoms-sandbox (生产)
```

---

## 三、验证测试

### ✅ 开发环境测试

```
Server running on port 3001
Environment: Development
Sandbox dir: /workspace/atoms-dev/atoms-sandbox
Health check: /health
```

---

## 四、部署步骤

### 步骤 1: 后端部署 (Render)

1. 连接 GitHub 仓库到 Render
2. 使用 `render.yaml` 中的 Blueprint 配置
3. 设置环境变量 (见 docs/DEPLOYMENT.md)
4. 等待部署完成

### 步骤 2: 前端部署 (Vercel)

1. 导入 GitHub 仓库到 Vercel
2. 设置 `VITE_BACKEND_URL` 为你的 Render 域名
3. 部署完成

详细内容见 `docs/DEPLOYMENT.md`

---

## 五、架构图

```
┌─────────────────────────────────────┐
│         Vercel (Client)             │
│  React + Vite + Tailwind CSS        │
└──────────────┬──────────────────────┘
               │ WebSocket + API
               ▼
┌─────────────────────────────────────┐
│         Render (Backend)            │
│  Express + Socket.io + AI Agent     │
│  /tmp/atoms-sandbox (production)    │
└─────────────────────────────────────┘
```
