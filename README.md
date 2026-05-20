# Atoms.dev - AI 驱动的应用生成平台

<img width="2534" height="1408" alt="image" src="https://github.com/user-attachments/assets/59ddcf1a-61da-41c5-8d8d-3d051036343d" />
<img width="2514" height="1384" alt="image" src="https://github.com/user-attachments/assets/a6698746-d619-4047-8f0a-ac7bfd5453ea" />



> 🚀 用自然语言描述你的想法，AI 为你生成可运行的完整应用

---

## 🏗️ 项目概览

Atoms.dev 是一个基于 AI 的可视化应用生成平台，通过自然语言对话即可快速创建网页应用、原型、组件。

### 核心特色

- ✨ **自然语言开发** - 用中文描述需求，AI 自动生成代码
- 📱 **实时预览** - 边写边看，代码变更实时生效
- 🔧 **内置编辑器** - Monaco Editor 专业代码编辑体验
- 📦 **项目持久化** - 自动保存项目状态，刷新不丢失
- 🤖 **多 AI 支持** - DeepSeek + 智谱 AI，任你选择

---

## 🎯 阶段性成果

### 第一阶段 ✅ 已完成 - MVP 基础版本

**完成时间**: 2024年5月

| 功能 | 状态 | 说明 |
|------|------|------|
| 自然语言交互 | ✅ 已完成 | AI 理解并执行用户需求 |
| 单 Agent 驱动 | ✅ 已完成 | DeepSeek/Zhipu AI 集成 |
| 实时预览 | ✅ 已完成 | iframe 渲染，设备切换 |
| 代码编辑器 | ✅ 已完成 | Monaco Editor 集成 |
| 基础终端 | ✅ 已完成 | xterm.js 终端模拟 |
| 前端部署 | ✅ 已完成 | Vercel 部署 |
| 后端部署 | ✅ 已完成 | Render 部署 |
| Socket.IO 通信 | ✅ 已完成 | WebSocket 实时通信 |
| 多模型支持 | ✅ 已完成 | DeepSeek + 智谱 AI |

---

### 第二阶段 ✅ 已完成 - 项目管理与记忆系统

**完成时间**: 2024年5月下旬

**核心模块**:

#### 1️⃣ 项目持久化管理
- ✅ 用户识别（浏览器指纹）
- ✅ 项目元数据存储（创建时间、更新时间、文件列表）
- ✅ 最多 5 个项目限制 + 自动清理旧项目
- ✅ 项目列表展示，可快速切换
- ✅ 页面刷新自动恢复项目状态

#### 2️⃣ 智能意图识别
- ✅ 意图分类（问答/代码生成/文本生成/文档生成）
- ✅ 任务拆分与确认（可修改、取消任务）
- ✅ 执行状态展示与进度跟踪

#### 3️⃣ 记忆管理系统
- ✅ **用户级记忆** - 跨项目的用户偏好、常用技术栈、编码风格
- ✅ **项目级记忆** - 每个项目的上下文、技术栈、已完成任务
- ✅ Markdown 格式持久化，人类可读，LLM 友好
- ✅ 记忆压缩与智能摘要

#### 4️⃣ 交互体验优化
- ✅ 侧边栏折叠/展开功能
- ✅ 代码保存按钮与状态指示
- ✅ 保存后预览自动刷新
- ✅ 控制台支持前端日志和 JavaScript 命令
- ✅ 项目重命名、删除、切换

**技术亮点**:
- `react-resizable-panels` 实现可调整布局
- Zustand 状态管理
- 服务端沙箱文件系统管理
- 完整的 WebSocket 事件体系

---

## 🛠️ 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建**: Vite
- **样式**: Tailwind CSS
- **状态**: Zustand
- **编辑器**: Monaco Editor
- **终端**: xterm.js
- **实时通信**: Socket.IO Client
- **布局**: React Resizable Panels

### 后端
- **框架**: Express + Node.js
- **实时通信**: Socket.IO
- **AI 集成**: DeepSeek + 智谱 AI
- **文件管理**: 本地沙箱系统
- **类型安全**: TypeScript

---

## 📁 项目结构

```
atoms-dev/
├── client/                 # 前端项目
│   ├── src/
│   │   ├── components/     # React 组件
│   │   ├── stores/         # Zustand 状态管理
│   │   ├── types/          # TypeScript 类型定义
│   │   └── App.tsx         # 主应用入口
│   └── package.json
├── server/                 # 后端项目
│   ├── src/
│   │   ├── services/       # 核心服务
│   │   ├── websocket/      # Socket 处理
│   │   └── index.ts        # 服务入口
│   └── package.json
└── docs/                   # 项目文档
    ├── P0需求方案.md
    ├── P1需求方案.md
    └── 第二阶段方案.md
```

---

## 🚀 快速开始

### 前置条件
- Node.js 18+
- npm/yarn/pnpm
- DeepSeek API Key 或 智谱 AI API Key

### 本地开发

1. **克隆项目**
```bash
git clone <your-repo-url>
cd atoms-dev
```

2. **后端启动**
```bash
cd server
npm install
npm run dev
```

3. **前端启动**
```bash
cd client
npm install
npm run dev
```

4. **访问应用**
打开浏览器访问 `http://localhost:5173`

---

## 🔮 第三阶段规划

### 🎯 核心目标

构建更智能、更强大的 AI 应用开发平台，从"能运行"升级到"专业级"开发工具。

---

### 📋 功能路线图

#### Phase 3.1 - 文件管理与预览增强 🔨

| 功能 | 优先级 | 说明 |
|------|--------|------|
| **完整文件管理器** | P0 | 树形文件结构、右键菜单、拖拽排序 |
| **Inspect 模式** | P0 | 预览区元素高亮、选中、跳转到代码 |
| **智能刷新控制** | P0 | 自动刷新间隔、暂停/继续、手动刷新 |
| **设备模拟增强** | P1 | 自定义尺寸、横屏/竖屏、截图功能 |
| **多 Tab 预览** | P1 | 支持同时预览多个页面 |

#### Phase 3.2 - 一键部署与分享 🌐

| 功能 | 优先级 | 说明 |
|------|--------|------|
| **一键发布** | P0 | 生成可访问的公网 URL |
| **部署状态** | P0 | 显示进度（准备→构建→上传→完成） |
| **分享功能** | P0 | 复制链接、社交分享、二维码 |
| **版本历史** | P1 | 保存部署历史，支持回滚 |
| **自定义域名** | P2 | 绑定用户自己的域名 |

#### Phase 3.3 - 智能增强 🤖

| 功能 | 优先级 | 说明 |
|------|--------|------|
| **多 Agent 协作** | P0 | MetaGPT 框架，规划师+架构师+工程师 |
| **智能纠错** | P0 | 自动检测并修复代码错误 |
| **代码审查** | P1 | AI 给出代码优化建议 |
| **模板系统** | P1 | 预置常用模板（Landing Page、Todo、Dashboard） |
| **智能补全** | P1 | 基于上下文的代码补全建议 |

#### Phase 3.4 - 平台化功能 🏗️

| 功能 | 优先级 | 说明 |
|------|--------|------|
| **用户认证** | P1 | 登录注册、个人中心 |
| **云端存储** | P1 | Atoms Cloud，项目云同步 |
| **团队协作** | P2 | 多人协作、实时编辑 |
| **插件系统** | P2 | 第三方插件扩展 |
| **API 市场** | P2 | 集成常用第三方服务 |

---

### 🎨 UI/UX 升级规划

1. **Dark Mode 完善** - 完整的深色主题支持
2. **动画与过渡** - 流畅的交互动画
3. **移动端适配** - 手机/平板响应式布局
4. **主题定制** - 支持自定义主题颜色
5. **快捷键系统** - 常用功能快捷键支持

---


## 📖 开发文档

详细的技术文档请查看 [docs/](docs/) 目录：

- [P0 需求实现方案](docs/P0需求实现方案.md) - 第一阶段设计文档
- [P1 需求实现方案](docs/P1需求实现方案.md) - 第二阶段设计文档
- [第二阶段实现方案](docs/第二阶段实现方案.md) - 详细技术方案
- [部署文档](atoms-dev/docs/DEPLOYMENT.md) - Vercel + Render 部署指南

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发规范
- 遵循 TypeScript 类型安全
- 前端使用 Tailwind CSS 样式
- 后端代码保持模块化
- 提交前运行 lint 和 type check

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

## 🙏 致谢

感谢以下开源项目：
- [Monaco Editor](https://github.com/microsoft/monaco-editor)
- [xterm.js](https://github.com/xtermjs/xterm.js)
- [Zustand](https://github.com/pmndrs/zustand)
- [Vite](https://github.com/vitejs/vite)
- [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss)

---

<p align="center">
  Made with ❤️ by duiliuliu
</p>
