# 环境检测方案分析与优化

## 一、原有方案的问题

### 问题 1：检测条件不够明确
```typescript
// 原有方案
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
};
```

**问题**：
- 耦合了 `NODE_ENV` 和平台检测，不知道最终是哪个条件触发的
- 依赖 Render 的特定变量，不利于后续部署到其他平台
- 如果 Render 未来改变变量名称，代码会失效

### 问题 2：启动命令没有显式区分
```json
// 原有 package.json
{
  "dev": "tsx watch src/index.ts",
  "start": "node dist/index.js"
}
```

**问题**：
- 启动命令没有明确的 mode 标识，容易混淆
- 生产环境和开发环境没有明确的分界线

---

## 二、优化后的方案

### 1. 优先级策略

```
MODE > NODE_ENV > 平台检测 > 默认 'development'
```

### 2. 核心函数

```typescript
export type EnvironmentMode = 'development' | 'staging' | 'production';

export const getMode = (): EnvironmentMode => {
  const mode = process.env.MODE || process.env.NODE_ENV;

  if (mode === 'production') return 'production';
  if (mode === 'staging') return 'staging';
  if (mode === 'development') return 'development';

  // 如果没有显式设置，通过平台检测
  if (isRender() || isVercel()) {
    return 'production';
  }

  // 默认开发模式
  return 'development';
};
```

### 3. 显式启动参数

```json
{
  "dev": "MODE=development tsx watch src/index.ts",
  "start": "MODE=production node dist/index.js",
  "start:dev": "MODE=development node dist/index.js",
  "start:staging": "MODE=staging node dist/index.js"
}
```

---

## 三、方案优势

### ✅ 优势 1：优先级清晰
- **显式设置优先**：`MODE=production` 强制为生产模式
- **向后兼容**：仍然支持 `NODE_ENV`
- **智能默认**：平台检测兜底

### ✅ 优势 2：可扩展性
- 新增 Staging 环境支持
- 新增 Vercel 平台检测
- 容易添加更多平台和环境

### ✅ 优势 3：调试友好
- 启动时自动打印配置信息
- 明确标识当前运行模式和平台

---

## 四、测试结果

### ✅ 开发模式
```
MODE: development
getMode(): development
isProduction(): false
Sandbox Dir: /workspace/atoms-dev/atoms-sandbox
```

### ✅ 生产模式
```
MODE: production
getMode(): production
isProduction(): true
Sandbox Dir: /tmp/atoms-sandbox
```

### ✅ Staging 模式
```
MODE: staging
getMode(): staging
Sandbox Dir: /workspace/atoms-dev/atoms-sandbox
```

### ✅ NODE_ENV 兼容
```
NODE_ENV: production
getMode(): production (fallback)
```

### ✅ Render 平台检测
```
RENDER: true
getMode(): production (platform detection)
Platform: Render
```

---

## 五、使用建议

### 本地开发
```bash
npm run dev
# 或
MODE=development npm run dev
```

### 本地模拟生产
```bash
npm run build
npm start
# 或手动指定
MODE=production npm start
```

### Render 部署
- 使用 `render.yaml` 中的配置，自动设置 `MODE=production`
- 平台检测和显式设置双重保障

### 未来扩展
新增平台时，只需要添加：
```typescript
export const isYourPlatform = (): boolean => {
  return process.env.YOUR_PLATFORM === 'true';
};
```

---

## 六、总结

| 方面 | 原有方案 | 优化方案 |
|------|---------|---------|
| 检测优先级 | 不明确 | MODE > NODE_ENV > 平台 > 默认 |
| 显式启动参数 | ❌ 无 | ✅ `MODE=xxx` |
| 可扩展性 | 差 | 支持 Staging、其他平台 |
| 调试体验 | 差 | 启动时打印信息 |
| 可靠性 | 依赖平台变量 | 显式设置优先 |

**结论**：优化后的方案更可靠、更清晰、更易扩展！✅
