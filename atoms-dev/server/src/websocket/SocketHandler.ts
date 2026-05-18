import { Server, Socket } from 'socket.io';
import { AgentService } from '../services/agent/AgentService.js';
import { SandboxManager } from '../services/sandbox/SandboxManager.js';

export class SocketHandler {
  private io: Server;
  private agentService: AgentService;
  private sandboxManager: SandboxManager;
  
  constructor(io: Server) {
    this.io = io;
    this.agentService = new AgentService();
    this.sandboxManager = this.agentService.getSandboxManager();
    
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
      
      // 发送聊天消息
      socket.on('chat:message', async (data: { content: string }) => {
        console.log(`[Socket] Chat message received: ${data.content.substring(0, 50)}...`);
        
        try {
          const { content } = data;
          let sandboxId = socket.data.sandboxId;
          
          // 流式处理请求
          const stream = await this.agentService.processRequest(content, { sandboxId });
          
          let responseBuffer = '';
          
          for await (const chunk of stream) {
            responseBuffer += chunk;
            socket.emit('chat:chunk', { content: chunk });
          }
          
          socket.emit('chat:end', {});
          
        } catch (error: any) {
          console.error('[Socket] Chat error:', error);
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
