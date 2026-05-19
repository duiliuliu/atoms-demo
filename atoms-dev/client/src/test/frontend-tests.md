# 前端测试方案

由于前端是React + Vite项目，我们可以使用以下测试策略：

## 测试场景清单

### 场景1: 首次访问 - 空状态
**测试目标**: 验证无对话时的欢迎界面正常显示
**预期**:
- 显示欢迎标题 "欢迎使用 Atoms.dev"
- 显示提示文本 "描述你想要创建的应用，AI 将自动为你生成代码并实时预览"
- 显示示例提示
- 输入框可用
- 右侧空状态显示

### 场景2: 发送消息 - 意图分析和任务确认
**测试目标**: 验证代码生成请求的意图分析流程
**Mock Socket 事件**:
```
收到: chat:message → 
发送: task:breakdown (任务拆分) + chat:chunk (确认消息)
```
**预期**:
- 用户消息出现在聊天区域
- 显示加载动画
- 显示任务确认卡片
  - 显示理解的目标
  - 显示技术栈
  - 显示核心功能
  - 显示任务列表
  - 显示确认/取消按钮

### 场景3: 确认任务 - 执行和代码生成
**测试目标**: 验证任务确认后的代码生成流程
**Mock Socket 事件**:
```
收到: task:confirm → 
发送: agent:status → 
发送: sandbox:created → 
发送: chat:chunk (流式输出) → 
发送: agent:file_created → 
发送: preview:auto (自动预览) → 
发送: chat:end
```
**预期**:
- 确认按钮点击后变为执行状态
- 显示 Agent 执行状态
- 沙箱创建成功后显示预览
- 文件列表更新
- 预览面板自动激活

### 场景4: 问题回答 - 直接回答无任务
**测试目标**: 验证简单问题直接回答
**Mock Socket 事件**:
```
收到: chat:message (问题) →
发送: chat:chunk (回答) →
发送: chat:end
```
**预期**:
- AI直接回答问题
- 不显示任务确认卡片
- 不激活预览

### 场景5: 预览功能 - 手动和自动预览
**测试目标**: 验证预览切换
**预期**:
- 点击"预览"标签激活预览
- 自动预览事件触发时激活预览
- 预览区域显示沙箱内容

### 场景6: 项目管理 - 列表和切换
**测试目标**: 验证项目持久化
**预期**:
- 显示用户项目列表
- 点击项目加载项目
- 聊天记录恢复

## Mock Socket 服务

```typescript
// 模拟 Socket.IO 服务
class MockSocket {
  private eventHandlers: Map<string, Function[]> = new Map();
  
  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }
  
  emit(event: string, data?: any) {
    console.log(`[MockSocket] emit: ${event}`, data);
    
    // 根据事件模拟响应
    if (event === 'chat:message') {
      this.handleChatMessage(data);
    } else if (event === 'task:confirm') {
      this.handleTaskConfirm();
    }
  }
  
  private handleChatMessage(data: { content: string }) {
    setTimeout(() => {
      if (data.content.includes('创建') || data.content.includes('网页')) {
        // 任务拆分场景
        this.triggerEvent('task:breakdown', {
          taskBreakdown: {
            userIntent: {
              originalRequest: data.content,
              understoodGoal: '创建一个待办事项应用',
              scope: 'small',
              complexity: 'simple',
              techStack: ['HTML', 'CSS', 'JavaScript'],
              keyFeatures: ['添加任务', '标记完成'],
              potentialIssues: []
            },
            tasks: [
              { id: '1', type: 'create_file', description: '创建 index.html', files: ['index.html'] }
            ]
          },
          classification: {
            type: 'code_production',
            confidence: 0.95,
            keywords: ['HTML', 'CSS']
          }
        });
        
        this.triggerEvent('chat:chunk', { 
          content: '我已经分析了您的需求，请确认...' 
        });
      } else {
        // 直接回答
        this.triggerEvent('chat:chunk', { 
          content: '这是一个模拟回答。' 
        });
        this.triggerEvent('chat:end');
      }
    }, 500);
  }
  
  private handleTaskConfirm() {
    setTimeout(() => {
      this.triggerEvent('agent:status', { message: '正在理解...', type: 'info' });
    }, 100);
    
    setTimeout(() => {
      this.triggerEvent('sandbox:created', { 
        sandboxId: 'test-sandbox-123',
        previewUrl: 'http://localhost:3001/preview/test-sandbox-123'
      });
    }, 500);
    
    setTimeout(() => {
      this.triggerEvent('chat:chunk', { content: '<html>...' });
    }, 600);
    
    setTimeout(() => {
      this.triggerEvent('agent:file_created', { path: 'index.html' });
    }, 800);
    
    setTimeout(() => {
      this.triggerEvent('preview:auto', { 
        sandboxId: 'test-sandbox-123',
        previewUrl: 'http://localhost:3001/preview/test-sandbox-123',
        entryFile: 'index.html'
      });
    }, 1000);
    
    setTimeout(() => {
      this.triggerEvent('chat:end');
    }, 1200);
  }
  
  private triggerEvent(event: string, data?: any) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }
}
```

## 测试执行

使用 Vitest 或 Playwright 进行 E2E 测试：

```bash
# 在 client 目录
npm install -D vitest @testing-library/react @testing-library/jest-dom
```
