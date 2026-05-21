import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { AgentService } from '../services/agent/AgentService.js';
import { SandboxManager } from '../services/sandbox/SandboxManager.js';
import { ProjectManager } from '../services/ProjectManager.js';
import { IntentHandler } from '../services/IntentHandler.js';
import { MemoryManager } from '../services/MemoryManager.js';
import { LLMService } from '../services/llm/LLMService.js';
import { TaskQueueManager } from '../services/TaskQueueManager.js';
import type { BuildTask } from '../types/task-queue.js';
import type { StoredProject } from '../types/project.js';

export class SocketHandler {
  private io: Server;
  private agentService: AgentService;
  private sandboxManager: SandboxManager;
  private projectManager: ProjectManager;
  private intentHandler: IntentHandler;
  private memoryManager: MemoryManager;
  private llmService: LLMService;
  private taskQueueManager: TaskQueueManager;

  constructor(io: Server) {
    this.io = io;
    this.agentService = new AgentService();
    this.sandboxManager = this.agentService.getSandboxManager();
    this.projectManager = new ProjectManager();
    this.llmService = this.agentService.getLLMService();
    this.intentHandler = new IntentHandler(this.llmService);
    this.memoryManager = new MemoryManager();
    this.memoryManager.setLLMService(this.llmService);
    this.taskQueueManager = new TaskQueueManager();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[Socket] Client connected: ${socket.id}`);

      socket.on('llm:provider', (data: { provider: 'deepseek' | 'zhipu' }) => {
        this.agentService.setLLMProvider(data.provider);
        console.log(`[Socket] LLM provider changed to: ${data.provider}`);
        socket.emit('llm:provider', { provider: data.provider });
      });

      socket.on('project:list', async ({ userId }: { userId: string }) => {
        const projects = await this.projectManager.listProjects(userId);
        socket.emit('project:list', { projects });
      });

      socket.on('project:create', async ({ userId, name }: { userId: string; name: string }) => {
        try {
          const project = await this.projectManager.createProject(userId, name);
          await this.memoryManager.createProjectMemory(project.id, userId, name);
          socket.data.projectId = project.id;
          socket.data.userId = userId;
          socket.data.sandboxId = undefined; // 关键！创建新项目时清空沙箱 ID
          socket.emit('project:created', { project });
        } catch (error: any) {
          socket.emit('project:error', { message: error.message });
        }
      });

      socket.on('project:get', async ({ projectId, userId }: { projectId: string; userId: string }) => {
        const project = await this.projectManager.getProject(projectId, userId);
        if (project) {
          socket.data.projectId = project.id;
          socket.data.userId = userId;
          await this.projectManager.touchProject(projectId, userId);
          
          // 预加载项目记忆到缓存
          const hasMemory = await this.memoryManager.hasProjectMemory(projectId);
          if (hasMemory) {
            const memoryPath = await this.memoryManager.getMemoryFilePath(projectId);
            if (memoryPath) {
              await this.memoryManager.loadMemoryFromFile(memoryPath);
              console.log(`[Socket] Preloaded memory for project: ${projectId}`);
            }
          }
          
          let sandboxId = (project as StoredProject).sandboxId;
          
          if (sandboxId) {
            const existingSandbox = this.sandboxManager.getSandbox(sandboxId);
            if (existingSandbox) {
              socket.data.sandboxId = sandboxId;
              console.log(`[Socket] Restored existing sandbox for project: ${projectId}`);
            } else if ((project as StoredProject).files) {
              const newSandboxId = await this.sandboxManager.create();
              sandboxId = newSandboxId;
              
              for (const file of (project as StoredProject).files!) {
                await this.sandboxManager.writeFile(sandboxId, file.path, file.content);
              }
              
              socket.data.sandboxId = sandboxId;
              
              await this.projectManager.saveProject(projectId, userId, { sandboxId });
              
              console.log(`[Socket] Recreated sandbox with ${(project as StoredProject).files?.length} files`);
            }
          }
          
          socket.emit('project:loaded', { project });
          
          if ((project as StoredProject).messages) {
            socket.emit('chat:restore', { messages: (project as StoredProject).messages });
          }
          
          if ((project as StoredProject).files) {
            const files = (project as StoredProject).files?.map(f => ({
              path: f.path,
              name: f.path.split('/').pop() || f.path,
              content: f.content,
              language: this.getLanguage(f.path),
              size: f.content.length,
            }));
            socket.emit('files:list', { files });
          }
          
          if (socket.data.sandboxId) {
            const previewUrl = this.sandboxManager.getPreviewUrl(socket.data.sandboxId);
            socket.emit('preview:url', { url: previewUrl, sandboxId: socket.data.sandboxId });
          }
        } else {
          socket.emit('project:error', { message: '项目不存在' });
        }
      });

      socket.on('project:rename', async ({ projectId, userId, name }: { projectId: string; userId: string; name: string }) => {
        await this.projectManager.saveProject(projectId, userId, { name });
        socket.emit('project:renamed', { projectId, name });
      });

      socket.on('project:delete', async ({ projectId, userId }: { projectId: string; userId: string }) => {
        await this.projectManager.deleteProject(projectId, userId);
        socket.emit('project:deleted', { projectId });
      });

      socket.on('chat:message', async (data: { content: string; userId: string; projectId?: string }) => {
        console.log(`[Socket] Chat message received: ${data.content.substring(0, 50)}...`);

        try {
          const { content, userId } = data;
          let sandboxId = socket.data.sandboxId;
          let projectId = data.projectId || socket.data.projectId;

          if (!projectId) {
            console.log(`[Socket] Auto-creating project for user: ${userId}`);
            const project = await this.projectManager.createProject(userId, '新项目');
            projectId = project.id;
            socket.data.projectId = projectId;
            socket.data.userId = userId;
            await this.memoryManager.createProjectMemory(projectId, userId, '新项目');
            console.log(`[Socket] Project created: ${projectId}`);
          }

          const userMessageId = uuidv4();
          const userMessage = {
            id: userMessageId,
            role: 'user' as const,
            content,
            timestamp: Date.now()
          };

          await this.projectManager.saveProject(projectId, userId, {
            messages: [userMessage]
          });

          const compressedMemory = await this.memoryManager.getCompressedMemory(userId, projectId);
          const projectList = await this.projectManager.listProjects(userId);
          const projectsForContext = projectList.map(p => ({
            id: p.id,
            name: p.name,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt
          }));

          const intentResult = await this.intentHandler.handle(content, compressedMemory, projectsForContext);

          if (intentResult.type === 'task_breakdown' && intentResult.taskBreakdown) {
            socket.data.taskBreakdown = intentResult.taskBreakdown;
            socket.emit('task:breakdown', {
              taskBreakdown: intentResult.taskBreakdown,
              classification: intentResult.classification,
            });
          } else {
            if (intentResult.content) {
              socket.emit('chat:chunk', { content: intentResult.content });
              
              await this.memoryManager.addMessageWithCompression(projectId, userId, content, intentResult.content);
              
              const assistantMessageId = crypto.randomUUID();
              const assistantMessage = {
                id: assistantMessageId,
                role: 'assistant' as const,
                content: intentResult.content,
                timestamp: Date.now()
              };
              
              await this.projectManager.saveProject(projectId, userId, {
                messages: [assistantMessage]
              });
            }
            socket.emit('chat:end', {});
          }
        } catch (error: any) {
          console.error('[Socket] Chat error:', error);
          socket.emit('chat:error', { message: error.message });
        }
      });

      socket.on('task:confirm', async () => {
        const taskBreakdown = socket.data.taskBreakdown;
        if (!taskBreakdown) {
          socket.emit('chat:error', { message: '没有待执行的任务' });
          return;
        }

        try {
          const userId = socket.data.userId;
          let targetProjectId = socket.data.projectId;
          let sandboxId = socket.data.sandboxId;

          const keyFeatures = taskBreakdown.userIntent.keyFeatures || [];
          const modifyMatch = keyFeatures.find((f: string) => f.includes('修改项目'));
          let targetProjectName: string | null = null;
          
          if (targetProjectId && !modifyMatch) {
            const targetProject = await this.projectManager.getProject(targetProjectId, userId);
            if (targetProject && (targetProject as any).sandboxId) {
              const projectSandboxId = (targetProject as any).sandboxId;
              const existingSandbox = this.sandboxManager.getSandbox(projectSandboxId);
              if (existingSandbox) {
                sandboxId = projectSandboxId;
                socket.data.sandboxId = sandboxId;
              } else {
                sandboxId = undefined;
                socket.data.sandboxId = undefined;
              }
            } else if (!modifyMatch) {
              sandboxId = undefined;
              socket.data.sandboxId = undefined;
            }
          }
          
          if (modifyMatch) {
            const match = modifyMatch.match(/「(.+?)」/);
            if (match) {
              targetProjectName = match[1];
            }
          }

          if (targetProjectName && userId) {
            const projects = await this.projectManager.listProjects(userId);
            const targetProject = projects.find(p => p.name === targetProjectName);
            
            if (targetProject) {
              targetProjectId = targetProject.id;
              socket.data.projectId = targetProjectId;
              
              const fullTargetProject = await this.projectManager.getProject(targetProjectId, userId);
              if (fullTargetProject && (fullTargetProject as any).sandboxId) {
                const projectSandboxId = (fullTargetProject as any).sandboxId;
                const existingSandbox = this.sandboxManager.getSandbox(projectSandboxId);
                if (existingSandbox) {
                  sandboxId = projectSandboxId;
                  socket.data.sandboxId = sandboxId;
                } else if ((fullTargetProject as any).files) {
                  const newSandboxId = await this.sandboxManager.create();
                  sandboxId = newSandboxId;
                  socket.data.sandboxId = sandboxId;
                  
                  for (const file of (fullTargetProject as any).files) {
                    await this.sandboxManager.writeFile(sandboxId, file.path, file.content);
                  }
                  
                  await this.projectManager.saveProject(targetProjectId, userId, { sandboxId });
                }
              } else {
                sandboxId = undefined;
                socket.data.sandboxId = undefined;
              }
            }
          }

          let files: Map<string, string> | undefined;
          if (sandboxId) {
            const sandbox = this.sandboxManager.getSandbox(sandboxId);
            if (sandbox) {
              files = sandbox.files;
            }
          }

          const userRequest = taskBreakdown.userIntent.originalRequest;
          
          const buildTasks: BuildTask[] = taskBreakdown.tasks.map((t: any) => ({
            id: t.id,
            type: t.type,
            target: t.files && t.files[0] ? t.files[0] : 'unknown',
            content: t.content,
            estimatedTokens: t.estimatedTokens,
            status: 'pending' as const,
            dependencies: t.dependencies || [],
          }));

          const queue = this.taskQueueManager.createQueue(targetProjectId!, userId, buildTasks, 2);
          this.taskQueueManager.startQueue(targetProjectId!);
          
          const compressedMemory = await this.memoryManager.getCompressedMemory(userId, targetProjectId);

          const currentBatch = this.taskQueueManager.getCurrentBatch(targetProjectId!);
          
          socket.emit('task:batch_start', {
            batchId: `${targetProjectId}-batch-0`,
            tasks: currentBatch.map(t => ({
              id: t.id,
              description: t.type === 'create_file' ? `创建 ${t.target}` : t.type === 'update_file' ? `更新 ${t.target}` : t.target,
              status: 'pending',
            })),
            currentBatch: 0,
            totalBatches: queue.totalBatches,
          });

          await this.executeTasksBatch(targetProjectId!, userId, currentBatch, sandboxId, socket, compressedMemory);
          
          socket.data.taskBreakdown = null;
        } catch (error: any) {
          console.error('[Socket] Task execution error:', error);
          socket.emit('chat:error', { message: error.message });
        }
      });

      socket.on('task:cancel', () => {
        socket.data.taskBreakdown = null;
        console.log('[Socket] Task cancelled');
      });
      
      socket.on('preview:get_url', () => {
        const sandboxId = socket.data.sandboxId;
        if (sandboxId) {
          const previewUrl = this.sandboxManager.getPreviewUrl(sandboxId);
          socket.emit('preview:url', { url: previewUrl, sandboxId });
        }
      });
      
      socket.on('files:list', async () => {
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

              if (socket.data.projectId && socket.data.userId) {
                const filesToStore = Array.from(sandbox.files.entries()).map(([path, content]) => ({ path, content }));
                await this.projectManager.saveProject(socket.data.projectId, socket.data.userId, {
                  files: filesToStore,
                  sandboxId
                });
              }
            }
          }
        });
      
      socket.on('file:update', async (data: { path: string; content: string }) => {
        const sandboxId = socket.data.sandboxId;
        if (sandboxId) {
          await this.sandboxManager.writeFile(sandboxId, data.path, data.content);
          socket.emit('file:updated', { path: data.path });
        }
      });
      
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
      
      this.setupAgentEvents(socket);
      
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
      
      if (socket.data.projectId && socket.data.userId) {
        this.projectManager.saveProject(socket.data.projectId, socket.data.userId, {
          sandboxId: data.sandboxId
        });
      }
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
    
    this.agentService.on('auto_preview', (data: { sandboxId: string; previewUrl: string; entryFile: string }) => {
      socket.emit('preview:auto', data);
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

  private async executeTasksBatch(
    projectId: string, 
    userId: string, 
    tasks: BuildTask[], 
    sandboxId: string | undefined,
    socket: any,
    initialMemory?: string
  ) {
    const userRequest = socket.data.taskBreakdown?.userIntent?.originalRequest || '';
    
    let fullResponse = '';
    let files: Map<string, string> | undefined;
    
    if (sandboxId) {
      const sandbox = this.sandboxManager.getSandbox(sandboxId);
      if (sandbox) {
        files = sandbox.files;
      }
    }

    for (const task of tasks) {
      this.taskQueueManager.updateTaskStatus(projectId, task.id, 'in_progress');
      socket.emit('task:progress', {
        taskId: task.id,
        status: 'in_progress',
      });
    }

    const compressedMemory = initialMemory || await this.memoryManager.getCompressedMemory(userId, projectId);

    const stream = await this.agentService.processRequest(
      userRequest,
      { 
        sandboxId, 
        files,
        projectId,
        userId,
        memory: compressedMemory,
        batchTasks: tasks,
      }
    );

    for await (const chunk of stream) {
      socket.emit('chat:chunk', { content: chunk });
      fullResponse += chunk;
    }

    for (const task of tasks) {
      this.taskQueueManager.updateTaskStatus(projectId, task.id, 'completed', '完成');
      socket.emit('task:progress', {
        taskId: task.id,
        status: 'completed',
        output: '任务执行完成',
      });
    }

    await this.memoryManager.addMessageWithCompression(projectId, userId, userRequest, fullResponse);

    const nextQueue = this.taskQueueManager.moveToNextBatch(projectId);
    
    if (nextQueue && nextQueue.status !== 'completed') {
      const nextBatch = this.taskQueueManager.getCurrentBatch(projectId);
      
      socket.emit('task:batch_complete', {
        batchId: `${projectId}-batch-${nextQueue.currentBatch - 1}`,
        tasks: tasks.map(t => ({
          id: t.id,
          description: t.type === 'create_file' ? `创建 ${t.target}` : t.type === 'update_file' ? `更新 ${t.target}` : t.target,
          status: 'completed',
          output: '完成',
        })),
        currentBatch: nextQueue.currentBatch,
        totalBatches: nextQueue.totalBatches,
        isComplete: false,
      });
      
      setTimeout(() => {
        socket.emit('task:batch_start', {
          batchId: `${projectId}-batch-${nextQueue.currentBatch}`,
          tasks: nextBatch.map(t => ({
            id: t.id,
            description: t.type === 'create_file' ? `创建 ${t.target}` : t.type === 'update_file' ? `更新 ${t.target}` : t.target,
            status: 'pending',
          })),
          currentBatch: nextQueue.currentBatch,
          totalBatches: nextQueue.totalBatches,
        });
        
        this.executeTasksBatch(projectId, userId, nextBatch, sandboxId, socket);
      }, 500);
    } else {
      socket.emit('task:batch_complete', {
        batchId: `${projectId}-batch-final`,
        tasks: tasks.map(t => ({
          id: t.id,
          description: t.type === 'create_file' ? `创建 ${t.target}` : t.type === 'update_file' ? `更新 ${t.target}` : t.target,
          status: 'completed',
          output: '完成',
        })),
        currentBatch: nextQueue?.currentBatch || 0,
        totalBatches: nextQueue?.totalBatches || 1,
        isComplete: true,
      });
      
      socket.emit('chat:end', {});
    }
  }
}
