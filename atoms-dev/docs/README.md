# 项目文档总览

## 📚 文档列表

| 文档 | 说明 | 优先级 |
|------|------|--------|
| [快速开始](./QUICK_START.md) | 5分钟快速部署指南 | ⭐⭐⭐ |
| [完整部署指南](./VERCEL_RENDER_INTEGRATION.md) | Vercel + Render 详细配置 | ⭐⭐⭐ |
| [部署配置改动总结](./DEPLOYMENT_CHANGES.md) | 本次改动的技术细节 | ⭐⭐ |
| [环境配置分析](./ENV_ANALYSIS.md) | 环境检测方案分析 | ⭐⭐ |
| [P0需求实现方案](./P0需求实现方案.md) | 产品和技术架构设计 | ⭐⭐ |
| [部署文档](./DEPLOYMENT.md) | 原始部署指南 | ⭐ |

---

## 🎯 推荐阅读顺序

### 快速体验（5分钟）
1. [快速开始](./QUICK_START.md) ← 从这里开始！

### 深入理解（15分钟）
1. [完整部署指南](./VERCEL_RENDER_INTEGRATION.md)
2. [环境配置分析](./ENV_ANALYSIS.md)
3. [部署配置改动总结](./DEPLOYMENT_CHANGES.md)

### 产品和技术设计
1. [P0需求实现方案](./P0需求实现方案.md)

---

## 📋 核心配置文件

| 文件 | 位置 | 说明 |
|------|------|------|
| Vercel 配置 | `/vercel.json` | Vercel 构建配置 |
| Render 配置 | `/render.yaml` | Render 自动部署配置 |
| 环境变量示例 | `/server/.env.example` | 后端环境变量模板 |
| Git 忽略规则 | `/.gitignore` | 统一忽略规则 |

---

## 🛠️ 技术栈

### 前端 (Vercel)
- **框架**: React 18 + TypeScript
- **构建**: Vite
- **样式**: Tailwind CSS
- **状态**: Zustand
- **编辑器**: Monaco Editor
- **终端**: xterm.js
- **实时通信**: Socket.IO Client

### 后端 (Render)
- **框架**: Express + Node.js
- **实时通信**: Socket.IO
- **AI 集成**: LangChain.js + DeepSeek + 智谱AI
- **沙箱**: 本地文件系统 + Docker（未来）

---

## 🌐 部署架构

```
┌─────────────────────────────────────────────────────────┐
│                   Vercel (Frontend)                     │
│  ┌─────────────────────────────────────────────────┐     │
│  │  React SPA + Vite                               │     │
│  │  ├─ Chat UI (对话界面)                          │     │
│  │  ├─ Preview (实时预览)                           │     │
│  │  ├─ Editor (代码编辑器)                          │     │
│  │  └─ Terminal (终端)                              │     │
│  └─────────────────────────────────────────────────┘     │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ WebSocket (wss://)
                         │ HTTP API (https://)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   Render (Backend)                       │
│  ┌─────────────────────────────────────────────────┐     │
│  │  Express + Socket.IO                            │     │
│  │  ├─ Agent Service (AI Agent)                     │     │
│  │  ├─ LLM Service (DeepSeek + 智谱AI)             │     │
│  │  └─ Sandbox Manager (代码沙箱)                   │     │
│  └─────────────────────────────────────────────────┘     │
│  📁 File Storage: /tmp/atoms-sandbox/                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 关键环境变量

### 前端 (.env.local)
```bash
VITE_BACKEND_URL=https://your-server.onrender.com
```

### 后端 (Render)
```bash
MODE=production
NODE_ENV=production
RENDER=true
PORT=10000
CORS_ORIGIN=https://your-app.vercel.app
DEEPSEEK_API_KEY=sk-xxx
ZHIPU_API_KEY=xxx
```

---

## 📖 详细功能说明

### 🎨 产品功能
- **对话式生成**: 通过自然语言描述需求
- **实时预览**: 生成的应用实时显示在右侧
- **代码编辑**: 查看和修改生成的代码
- **终端模拟**: 查看 AI Agent 的执行过程
- **多 AI 模型**: 支持 DeepSeek 和智谱AI

### 🔧 技术特性
- **环境检测**: 智能识别开发和生产环境
- **沙箱隔离**: 用户代码在独立目录中运行
- **版本管理**: 支持代码快照和回滚（未来）
- **多 Agent**: AI Agent 协作生成代码（未来）

---

## 🐛 调试和排查

### 查看后端日志
1. 登录 Render
2. 进入你的 Service
3. 点击 "Logs"

### 查看前端错误
1. 打开浏览器开发者工具 (F12)
2. 切换到 Console 标签
3. 查看 Socket.IO 连接状态

### 常用测试命令
```bash
# 测试后端健康检查
curl https://your-server.onrender.com/health

# 测试 WebSocket 连接
wscat -c wss://your-server.onrender.com/socket.io/?EIO=4&transport=websocket
```

---

## 📞 获取帮助

### 遇到问题？
1. 查阅 [完整部署指南](./VERCEL_RENDER_INTEGRATION.md) 的常见问题部分
2. 查看 Render 日志定位后端错误
3. 查看浏览器控制台定位前端错误

### 提交改进？
- 欢迎提交 Issue 和 Pull Request！
- 文档改进也欢迎

---

## 🔮 未来规划

- [ ] 多 Agent 协作系统
- [ ] 完整的版本管理
- [ ] Docker 沙箱隔离
- [ ] 用户认证系统
- [ ] 模板市场
- [ ] 团队协作功能

---

## ✅ 快速链接

- **GitHub**: https://github.com/YOUR_USERNAME/atoms-dev
- **Vercel**: https://vercel.com/dashboard
- **Render**: https://dashboard.render.com
- **DeepSeek API**: https://platform.deepseek.com/
- **智谱AI**: https://open.bigmodel.cn/

---

**最后更新**: 2024-05-19
