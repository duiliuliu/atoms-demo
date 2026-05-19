# Vercel 前端 + Render 后端 部署清单

## ✅ 部署前检查清单

### 1. GitHub 准备
- [ ] 代码已推送到 GitHub
- [ ] GitHub 仓库是公开的（Render Blueprint 需要）
- [ ] 包含完整的项目结构

### 2. 后端 (Render) 准备
- [ ] `render.yaml` 文件存在
- [ ] 环境变量已准备：
  - [ ] `DEEPSEEK_API_KEY`
  - [ ] `ZHIPU_API_KEY`
  - [ ] `CORS_ORIGIN`（先留空，之后填入 Vercel URL）

### 3. 前端 (Vercel) 准备
- [ ] `vercel.json` 文件存在
- [ ] 需要修改的文件已确认：
  - [ ] `src/stores/index.ts` - Socket.IO 配置
  - [ ] 可选：`src/api/client.ts` - API 客户端

---

## 📋 部署步骤清单

### 第一阶段：后端部署 (Render)

#### 步骤 1: 连接 GitHub
- [ ] 登录 Render
- [ ] 点击 "New +"
- [ ] 选择 "Blueprint"
- [ ] 连接 GitHub 仓库
- [ ] 选择正确的仓库

#### 步骤 2: 配置 Blueprint
- [ ] Render 自动检测 `render.yaml`
- [ ] 检查配置：
  - Service Name: `atoms-dev-server`
  - Region: Singapore
  - Root Directory: `server`
  - Build Command: `npm install && npm run build`
  - Start Command: `npm start`

#### 步骤 3: 设置环境变量
- [ ] 添加 `MODE` = `production`
- [ ] 添加 `NODE_ENV` = `production`
- [ ] 添加 `RENDER` = `true`
- [ ] 添加 `DEEPSEEK_API_KEY` = `sk-xxx`
- [ ] 添加 `ZHIPU_API_KEY` = `xxx`（可选）
- [ ] 添加 `CORS_ORIGIN` = `https://your-app.vercel.app`（**稍后填入**）

#### 步骤 4: 部署
- [ ] 点击 "Apply" 或 "Create Blueprint"
- [ ] 等待构建完成（约 2-3 分钟）
- [ ] 状态变为 "Live"

#### 步骤 5: 验证后端
- [ ] 访问 `https://your-server.onrender.com/health`
- [ ] 应该返回 JSON：`{"status":"ok",...}`
- [ ] 记录后端 URL

### 第二阶段：前端部署 (Vercel)

#### 步骤 6: 连接 GitHub
- [ ] 登录 Vercel
- [ ] 点击 "Add New Project"
- [ ] 选择 "Import Git Repository"
- [ ] 选择 `atoms-dev` 仓库

#### 步骤 7: 配置项目
- [ ] Framework Preset: Vite（或 Auto）
- [ ] Root Directory: `./`（根目录）
- [ ] Build Command: `npm run build`（默认）
- [ ] Output Directory: `dist`（默认）

#### 步骤 8: 添加环境变量
- [ ] 点击 "Environment Variables"
- [ ] 添加：
  - Name: `VITE_BACKEND_URL`
  - Value: `https://your-server.onrender.com`（第一步的后端 URL）
  - Scope: Production（生产环境）

#### 步骤 9: 部署
- [ ] 点击 "Deploy"
- [ ] 等待构建完成（约 1-2 分钟）
- [ ] 获得 Vercel URL

#### 步骤 10: 记录 Vercel URL
- [ ] 记录为：`https://your-app.vercel.app`

### 第三阶段：CORS 配置

#### 步骤 11: 更新后端 CORS
- [ ] 回到 Render
- [ ] 进入后端 Service
- [ ] 点击 "Environment"
- [ ] 修改 `CORS_ORIGIN` = `https://your-app.vercel.app`
- [ ] 保存，自动重新部署

#### 步骤 12: 等待后端重新部署
- [ ] 状态变回 "Live"
- [ ] 验证 `/health` 仍然正常

### 第四阶段：测试

#### 步骤 13: 功能测试
- [ ] 访问 `https://your-app.vercel.app`
- [ ] 打开浏览器控制台 (F12)
- [ ] 检查是否有 WebSocket 连接成功日志
- [ ] 在输入框输入："创建一个简单的 todo 应用"
- [ ] 点击发送
- [ ] 观察：
  - [ ] 左侧显示 AI 响应
  - [ ] 右侧预览区显示生成的页面
  - [ ] 代码编辑器显示文件列表
  - [ ] 终端显示执行日志

#### 步骤 14: 验证 WebSocket
- [ ] 控制台应该显示：`[Socket] Connected`
- [ ] 如果显示连接失败，检查 CORS 配置

#### 步骤 15: 验证预览
- [ ] 预览区应该显示 iframe
- [ ] iframe 内应该显示生成的 HTML 页面
- [ ] 如果 404，检查后端沙箱目录

---

## 🎉 部署成功确认

如果以下所有项目都通过，恭喜你部署成功！🎉

### 功能验收清单
- [ ] ✅ 页面加载正常
- [ ] ✅ WebSocket 连接成功
- [ ] ✅ 可以发送消息
- [ ] ✅ AI 响应正常
- [ ] ✅ 预览区显示生成的应用
- [ ] ✅ 代码编辑器工作正常
- [ ] ✅ 终端显示日志

### 性能验收清单
- [ ] ✅ 页面加载 < 3秒
- [ ] ✅ AI 响应速度合理
- [ ] ✅ 预览刷新流畅

---

## 🐛 问题排查清单

如果遇到问题，按顺序检查：

### 问题 1: 页面无法访问
- [ ] Vercel 部署状态是否为 "Ready"
- [ ] 是否有构建错误
- [ ] 尝试重新部署

### 问题 2: WebSocket 连接失败
- [ ] 后端是否正常运行
- [ ] `VITE_BACKEND_URL` 是否设置正确
- [ ] CORS 配置是否包含 Vercel 域名
- [ ] 查看浏览器控制台的详细错误

### 问题 3: 预览无法加载
- [ ] 后端 `/health` 是否正常
- [ ] 沙箱目录是否有权限问题
- [ ] 检查 Render 日志

### 问题 4: CORS 错误
- [ ] `CORS_ORIGIN` 是否包含完整 URL（含 `https://`）
- [ ] 是否包含尾随斜杠（不应该有）
- [ ] 后端是否已重新部署

---

## 📞 调试技巧

### 查看后端日志
```bash
# 登录 Render Dashboard
# 进入你的 Service
# 点击 "Logs" 标签
# 实时查看日志
```

### 测试后端 API
```bash
# 健康检查
curl https://your-server.onrender.com/health

# 测试 WebSocket
wscat -c wss://your-server.onrender.com/socket.io/?EIO=4&transport=websocket

# 测试文件访问
curl https://your-server.onrender.com/sandbox-id/index.html
```

### 查看前端网络请求
1. 打开浏览器开发者工具 (F12)
2. 切换到 "Network" 标签
3. 发送一条消息
4. 查找 `/socket.io/` 请求
5. 检查状态码和响应

---

## 📝 快速参考

### 常用 URL
- 后端健康检查: `https://your-server.onrender.com/health`
- Vercel 管理: `https://vercel.com/dashboard`
- Render 管理: `https://dashboard.render.com`

### 常用命令
```bash
# 本地启动后端
cd server && npm run dev

# 本地启动前端
cd client && npm run dev

# 构建前端
cd client && npm run build

# 测试后端
curl http://localhost:3001/health
```

### 环境变量速查
**Vercel**:
```
VITE_BACKEND_URL = https://your-server.onrender.com
```

**Render**:
```
MODE = production
NODE_ENV = production
RENDER = true
CORS_ORIGIN = https://your-app.vercel.app
DEEPSEEK_API_KEY = sk-xxx
ZHIPU_API_KEY = xxx
```

---

## ✅ 部署完成！

完成所有检查清单后，你已经成功部署了完整的 AI 应用生成平台！

**不要忘记**：
- [ ] 将文档分享给团队成员
- [ ] 配置自定义域名（可选）
- [ ] 设置监控和告警（可选）

---

**最后更新**: 2024-05-19
