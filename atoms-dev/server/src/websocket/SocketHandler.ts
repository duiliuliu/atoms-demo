import { Server, Socket } from 'socket.io';
import { AgentService } from '../services/agent/AgentService.js';
import { SandboxManager } from '../services/sandbox/SandboxManager.js';
import { ProjectManager } from '../services/ProjectManager.js';
import { IntentHandler } from '../services/IntentHandler.js';
import { MemoryManager } from '../services/MemoryManager.js';
import { LLMService } from '../services/llm/LLMService.js';

export class SocketHandler {
  private io: Server;
  private agentService: AgentService;
  private sandboxManager: SandboxManager;
  private projectManager: ProjectManager;
  private intentHandler: IntentHandler;
  private memoryManager: MemoryManager;
  private llmService: LLMService;

  constructor(io: Server) {
    this.io = io;
    this.agentService = new AgentService();
    this.sandboxManager = this.agentService.getSandboxManager();
    this.projectManager = new ProjectManager();
    this.llmService = this.agentService.getLLMService();
    this.intentHandler = new IntentHandler(this.llmService);
    this.memoryManager = new MemoryManager();

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[Socket] Client connected: ${socket.id}`);

      // 切换 AI 模型
      socket.on('llm:provider', (data: { provider: 'deepseek' | 'zhipu' }) => {
        this.agentService.setLLMProvider(data.provider);
        console.log(`[Socket] LLM provider changed to: ${data.provider}`);
        socket.emit('llm:provider', { provider: data.provider });
      });

      // 项目列表
      socket.on('project:list', async ({ userId }: { userId: string }) => {
        const projects = await this.projectManager.listProjects(userId);
        socket.emit('project:list', { projects });
      });

      // 创建项目
      socket.on('project:create', async ({ userId, name }: { userId: string; name: string }) => {
        try {
          const project = await this.projectManager.createProject(userId, name);
          await this.memoryManager.createProjectMemory(project.id, userId, name);
          socket.data.projectId = project.id;
          socket.data.userId = userId;
          socket.emit('project:created', { project });
        } catch (error: any) {
          socket.emit('project:error', { message: error.message });
        }
      });

      // 获取项目
      socket.on('project:get', async ({ projectId, userId }: { projectId: string; userId: string }) => {
        const project = await this.projectManager.getProject(projectId, userId);
        if (project) {
          socket.data.projectId = project.id;
          socket.data.userId = userId;
          await this.projectManager.touchProject(projectId, userId);
          socket.emit('project:loaded', { project });
        } else {
          socket.emit('project:error', { message: '项目不存在' });
        }
      });

      // 重命名项目
      socket.on('project:rename', async ({ projectId, userId, name }: { projectId: string; userId: string; name: string }) => {
        await this.projectManager.saveProject(projectId, userId, { name });
        socket.emit('project:renamed', { projectId, name });
      });

      // 删除项目
      socket.on('project:delete', async ({ projectId, userId }: { projectId: string; userId: string }) => {
        await this.projectManager.deleteProject(projectId, userId);
        socket.emit('project:deleted', { projectId });
      });

      // 发送聊天消息
      socket.on('chat:message', async (data: { content: string; userId: string }) => {
        console.log(`[Socket] Chat message received: ${data.content.substring(0, 50)}...`);

        try {
          const { content, userId } = data;
          let sandboxId = socket.data.sandboxId;
          let projectId = socket.data.projectId;

          // 意图分类
          const intentResult = await this.intentHandler.handle(content);

          if (intentResult.type === 'task_breakdown' && intentResult.taskBreakdown) {
            // 需要任务拆分和确认
            socket.data.taskBreakdown = intentResult.taskBreakdown;
            socket.emit('task:breakdown', {
              taskBreakdown: intentResult.taskBreakdown,
              classification: intentResult.classification,
            });

            // 发送确认消息
            const confirmationMsg = this.intentHandler.generateConfirmationMessage(intentResult.taskBreakdown);
            socket.emit('chat:chunk', { content: confirmationMsg });
          } else {
            // 直接回答
            if (intentResult.content) {
              socket.emit('chat:chunk', { content: intentResult.content });
            }
            socket.emit('chat:end', {});
          }
        } catch (error: any) {
          console.error('[Socket] Chat error:', error);
          socket.emit('chat:error', { message: error.message });
        }
      });

      // 确认任务
      socket.on('task:confirm', async () => {
        const taskBreakdown = socket.data.taskBreakdown;
        if (!taskBreakdown) {
          socket.emit('chat:error', { message: '没有待执行的任务' });
          return;
        }

        try {
          let sandboxId = socket.data.sandboxId;
          const userId = socket.data.userId;
          const projectId = socket.data.projectId;

          // 获取当前文件
          let files: Map<string, string> | undefined;
          if (sandboxId) {
            const sandbox = this.sandboxManager.getSandbox(sandboxId);
            if (sandbox) {
              files = sandbox.files;
            }
          }

          // 执行请求
          const stream = await this.agentService.processRequest(
            taskBreakdown.userIntent.originalRequest,
            { sandboxId, files }
          );

          for await (const chunk of stream) {
            socket.emit('chat:chunk', { content: chunk });
          }

          socket.emit('chat:end', {});

          // 更新记忆
          if (projectId) {
            await this.memoryManager.addConversation(projectId, {
              userRequest: taskBreakdown.userIntent.originalRequest,
              aiUnderstanding: taskBreakdown.userIntent.understoodGoal,
              tasks: taskBreakdown.tasks.map((t: any) => t.description),
              result: '成功',
            });
          }
        } catch (error: any) {
          console.error('[Socket] Task execution error:', error);
          socket.emit('chat:error', { message: error.message });
        }
      });
      
      // 获取预览 URL
      socket.on('preview:get_url', () => {
        const sandboxId = socket.data.sandboxId;
        if (sandboxId) {
          const previewUrl = this.sandboxManager.getPreviewUrl(sandboxId);
          socket.emit('preview:url', { url: previewUrl, sandboxId });
        }
      });
      
      // 获取文件列表
      socket.on('files:list', () => {
        const sandboxId = socket.data.sandboxId;
        if (sandboxId) {
          const sandbox = this.sandboxManager.getSandbox(sandboxId);
          if (sandbox) {
            const files = Array.from(sandbox.files.entries()).map(([path, content]) => ({
              path,
              name: path.split('/').pop() || path,
              content,
              language: this.getLanguage(path),
              size: content.length,
            }));
            socket.emit('files:list', { files });
          }
        }
      });
      
      // 更新文件
      socket.on('file:update', async (data: { path: string; content: string }) => {
        const sandboxId = socket.data.sandboxId;
        if (sandboxId) {
          await this.sandboxManager.writeFile(sandboxId, data.path, data.content);
          socket.emit('file:updated', { path: data.path });
        }
      });
      
      // 执行命令
      socket.on('terminal:execute', async (data: { command: string }) => {
        const sandboxId = socket.data.sandboxId;
        if (sandboxId) {
          socket.emit('terminal:output', { 
            type: 'command',
            content: `$ ${data.command}\n` 
          });
          
          try {
            const result = await this.sandboxManager.executeCommand(sandboxId, data.command);
            socket.emit('terminal:output', { 
              type: 'result',
              stdout: result.stdout,
              stderr: result.stderr,
              exitCode: result.exitCode,
            });
          } catch (error: any) {
            socket.emit('terminal:output', { 
              type: 'error',
              content: error.message,
            });
          }
        }
      });
      
      // Agent 事件
      this.setupAgentEvents(socket);
      
      // 断开连接
      socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
      });
    });
  }
  
  private setupAgentEvents(socket: Socket): void {
    this.agentService.on('status', (data: { message: string; type: string }) => {
      socket.emit('agent:status', data);
    });
    
    this.agentService.on('sandbox_created', (data: { sandboxId: string; previewUrl: string }) => {
      socket.data.sandboxId = data.sandboxId;
      socket.emit('sandbox:created', data);
    });
    
    this.agentService.on('file_created', (data: { path: string; sandboxId: string }) => {
      socket.emit('agent:file_created', data);
    });
    
    this.agentService.on('command', (data: { command: string; sandboxId: string }) => {
      socket.emit('agent:command', data);
    });
    
    this.agentService.on('command_result', (data: { command: string; result: any; sandboxId: string }) => {
      socket.emit('agent:command_result', data);
    });
    
    this.agentService.on('complete', (data: { sandboxId: string }) => {
      socket.emit('agent:complete', data);
    });
    
    this.agentService.on('error', (data: { message: string }) => {
      socket.emit('agent:error', data);
    });
  }
  
  private getLanguage(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      html: 'html',
      htm: 'html',
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      css: 'css',
      json: 'json',
      md: 'markdown',
    };
    return langMap[ext || ''] || 'plaintext';
  }
}
