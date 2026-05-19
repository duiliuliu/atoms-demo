# 快速开始指南（5分钟部署）

## 前置准备

1. ✅ GitHub 账户
2. ✅ Vercel 账户（注册地址：https://vercel.com）
3. ✅ Render 账户（注册地址：https://render.com）
4. ✅ DeepSeek API Key（获取地址：https://platform.deepseek.com/）

---

## 第一步：部署后端 (Render) - 2分钟

### 1.1 推送代码到 GitHub
```bash
cd atoms-dev
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/atoms-dev.git
git push -u origin main
```

### 1.2 创建 Render Web Service
1. 登录 [Render](https://render.com)
2. 点击 **"New +"** → **"Blueprint"**
3. 连接你的 GitHub 仓库
4. Render 会自动读取 `render.yaml` 文件
5. 点击 **"Apply"**

### 1.3 设置环境变量
在 Render 控制台设置以下必填变量：

| 变量名 | 值 |
|--------|-----|
| `CORS_ORIGIN` | 稍后填入（等 Vercel 部署后获取） |
| `DEEPSEEK_API_KEY` | 你的 DeepSeek API Key |
| `ZHIPU_API_KEY` | 你的智谱 AI API Key（可选） |

### 1.4 等待部署完成
- 状态变为 "Live" 时完成
- 点击查看 URL，如：`https://atoms-dev-server.onrender.com`

---

## 第二步：部署前端 (Vercel) - 2分钟

### 2.1 导入项目到 Vercel
1. 登录 [Vercel](https://vercel.com)
2. 点击 **"New Project"**
3. 选择 **"Import Git Repository"**
4. 选择你的 `atoms-dev` 仓库

### 2.2 配置构建
1. **Framework Preset**: Vite（会自动检测）
2. **Root Directory**: `./`（项目根目录）
3. **Build Command**: `npm run build`（默认）
4. **Output Directory**: `dist`（默认）

### 2.3 添加环境变量
点击 **"Environment Variables"**，添加：

| 变量名 | 值 |
|--------|-----|
| `VITE_BACKEND_URL` | `https://atoms-dev-server.onrender.com`（你的 Render URL） |

### 2.4 部署
点击 **"Deploy"**，等待完成！

---

## 第三步：配置 CORS - 1分钟

### 3.1 回到 Render
1. 进入你的后端服务
2. 点击 **"Environment"**
3. 修改 `CORS_ORIGIN` 为你的 Vercel URL：
   ```
   https://your-app.vercel.app
   ```
4. 保存，自动重新部署

### 3.2 测试
1. 访问你的 Vercel URL
2. 尝试发送"创建一个 todo 应用"
3. 看到右侧预览了吗？🎉

---

## 如果遇到问题？

### ❌ WebSocket 连接失败
- 检查浏览器控制台
- 确认 `VITE_BACKEND_URL` 设置正确
- 确认后端 CORS 配置包含你的 Vercel 域名

### ❌ 预览无法加载
- 检查后端 `/health` 是否返回正常
- 检查沙箱目录权限

### ❌ CORS 错误
- 确认 Render 的 `CORS_ORIGIN` 包含完整的 Vercel URL（含 `https://`）

---

## 🎉 部署成功！

你现在拥有了一个完整的 AI 应用生成平台：

- 🌐 **前端**: https://your-app.vercel.app
- 🔧 **后端**: https://atoms-dev-server.onrender.com
- ✨ **功能**: 通过自然语言描述，快速生成可运行的 Web 应用

---

## 📚 详细文档

- [完整部署指南](./VERCEL_RENDER_INTEGRATION.md) - 包含常见问题和排查步骤
- [Render 部署配置](./docs/RENDER_DEPLOYMENT.md) - 后端详细配置
- [环境配置分析](./docs/ENV_ANALYSIS.md) - 环境检测说明
- [P0 功能方案](./docs/P0需求实现方案.md) - 产品和技术设计

---

## 💡 提示

1. **预览部署**: Vercel 会为每个 PR 自动生成预览 URL，方便测试
2. **自动部署**: 推送到 main 分支会自动部署更新
3. **环境变量**: Vercel 支持为生产、预览、开发环境设置不同的变量
4. **监控**: Render 提供免费日志查看，方便调试

---

## 🔧 常用命令

```bash
# 本地开发
cd client && npm run dev    # 前端
cd server && npm run dev    # 后端

# 构建
cd client && npm run build  # 前端构建

# 测试后端
curl https://your-server.onrender.com/health
```
