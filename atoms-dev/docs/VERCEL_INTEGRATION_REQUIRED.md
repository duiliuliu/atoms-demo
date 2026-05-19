# Vercel + Render 集成 - 必需修改清单

## 📋 修改清单

为了让前端能够正确连接后端，需要进行以下修改：

### ✅ 已完成的修改

1. **创建环境变量示例**
   - 文件: `client/.env.example`
   - 说明: 提供环境变量模板

2. **创建本地环境变量**
   - 文件: `client/.env.local`
   - 说明: 本地开发使用

3. **修改 Socket.IO 配置**
   - 文件: `client/src/stores/index.ts`
   - 说明: 支持通过 `VITE_BACKEND_URL` 配置后端地址
   - 添加了 `getBackendUrl()` 函数
   - 添加了调试日志

4. **更新 .gitignore**
   - 文件: `client/.gitignore`
   - 说明: 保留 `.env.example`

---

## 🔧 你需要做的修改

### 1. 部署后端 (Render)

访问 [Render](https://render.com)，按照以下步骤：

```bash
# 1. 连接 GitHub 仓库
# 2. 使用 render.yaml 自动配置
# 3. 设置环境变量
```

**必填环境变量**：
- `DEEPSEEK_API_KEY` = `sk-xxx`
- `ZHIPU_API_KEY` = `xxx`（可选）
- `CORS_ORIGIN` = `https://your-app.vercel.app`（**等 Vercel 部署后再填**）

**自动配置**：
- `MODE` = `production`（已在 render.yaml 中）
- `NODE_ENV` = `production`（已在 render.yaml 中）
- `RENDER` = `true`（已在 render.yaml 中）

### 2. 部署前端 (Vercel)

访问 [Vercel](https://vercel.com)，按照以下步骤：

```bash
# 1. 导入 GitHub 仓库
# 2. 配置构建选项
# 3. 设置环境变量
```

**必填环境变量**：
- `VITE_BACKEND_URL` = `https://your-server.onrender.com`

### 3. 更新后端 CORS

回到 Render，更新 `CORS_ORIGIN`：
```
CORS_ORIGIN = https://your-app.vercel.app
```

---

## 📝 快速参考

### 环境变量对应关系

| 部署平台 | 变量名 | 值示例 | 说明 |
|---------|--------|--------|------|
| **Vercel** | `VITE_BACKEND_URL` | `https://atoms-server.onrender.com` | 前端连接后端的地址 |
| **Render** | `CORS_ORIGIN` | `https://atoms-app.vercel.app` | 后端允许的前端地址 |
| **Render** | `DEEPSEEK_API_KEY` | `sk-xxx` | DeepSeek API Key |
| **Render** | `ZHIPU_API_KEY` | `xxx` | 智谱 AI Key（可选） |

### 部署命令

```bash
# 推送代码
git add .
git commit -m "Configure for Vercel + Render deployment"
git push origin main

# Render 会自动部署后端
# Vercel 会自动部署前端
```

---

## 🎯 验证步骤

部署完成后，按照以下顺序验证：

### 1. 测试后端
```bash
curl https://your-server.onrender.com/health
# 应返回: {"status":"ok","environment":"production","platform":"render"}
```

### 2. 访问前端
```
https://your-app.vercel.app
```

### 3. 检查浏览器控制台
应该看到：
```
[Socket] Connecting to: https://your-server.onrender.com
[Socket] Connected
```

### 4. 测试功能
发送消息："创建一个简单的 todo 应用"

应该看到：
- ✅ AI 响应
- ✅ 预览区显示页面
- ✅ 代码编辑器显示文件
- ✅ 终端显示日志

---

## 🐛 常见问题

### ❌ Socket 连接失败
**检查**：
1. `VITE_BACKEND_URL` 是否设置正确
2. 后端是否正常运行
3. CORS 配置是否包含 Vercel 域名

### ❌ CORS 错误
**检查**：
1. Render 的 `CORS_ORIGIN` 是否包含完整 URL
2. 是否是 `https://` 开头（不是 `http://`）
3. 是否有尾随斜杠（不应该有）

### ❌ 预览 404
**检查**：
1. 后端沙箱目录权限
2. 文件是否创建成功
3. 查看 Render 日志

---

## 📚 完整文档

- [快速开始指南](./QUICK_START.md) ⭐ 推荐先看这个
- [详细部署指南](./VERCEL_RENDER_INTEGRATION.md) - 包含所有配置
- [部署检查清单](./DEPLOYMENT_CHECKLIST.md) - 每一步的详细检查
- [项目文档总览](./README.md) - 所有文档索引

---

## 💡 小贴士

1. **分步部署**：先部署后端，确认正常后再部署前端
2. **查看日志**：Render 提供免费日志，方便调试
3. **预览部署**：Vercel 会为每个 PR 生成预览，方便测试
4. **环境变量**：开发和生产环境可以设置不同的后端地址

---

## ✅ 下一步

1. 按照本文档进行部署
2. 参考 [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) 逐项检查
3. 如遇问题，查阅 [VERCEL_RENDER_INTEGRATION.md](./VERCEL_RENDER_INTEGRATION.md) 的常见问题部分

**祝你部署成功！🎉**
