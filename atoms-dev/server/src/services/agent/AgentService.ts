import { EventEmitter } from 'events';
import { LLMService } from '../llm/LLMService.js';
import { SandboxManager } from '../sandbox/SandboxManager.js';
import { MemoryManager } from '../MemoryManager.js';
import type { BuildTask } from '../../types/task-queue.js';

interface AgentConfig {
  model?: string;
  temperature?: number;
}

interface CodeBlock {
  path: string;
  language: string;
  content: string;
}

export class AgentService extends EventEmitter {
  private llm: LLMService;
  private sandbox: SandboxManager;
  private memoryManager: MemoryManager;
  
  constructor(config: AgentConfig = {}) {
    super();
    this.llm = new LLMService();
    this.sandbox = new SandboxManager();
    this.memoryManager = new MemoryManager();
  }
  
  async processRequest(
    userInput: string,
    context: {
      files?: Map<string, string>;
      sandboxId?: string;
      projectId?: string;
      userId?: string;
      memory?: string;
      batchTasks?: BuildTask[];
    }
  ): Promise<AsyncIterable<string>> {
    const self = this;
    
    return {
      async *[Symbol.asyncIterator]() {
        try {
          self.emit('status', { message: '正在理解您的需求...', type: 'info' });
          
          const prompt = await self.buildPrompt(userInput, context);
          const stream = await self.llm.stream(prompt);
          
          let buffer = '';
          let sandboxId = context.sandboxId;
          let hasCreatedHtml = false;
          
          for await (const chunk of stream) {
            buffer += chunk;
            yield chunk;
            
            // 检查是否有代码块需要提取
            const codeBlocks = self.extractCodeBlocks(buffer);
            if (codeBlocks.length > 0) {
              for (const block of codeBlocks) {
                self.emit('status', { message: `创建文件: ${block.path}`, type: 'info' });
                
                // 创建或使用沙箱
                if (!sandboxId) {
                  sandboxId = await self.sandbox.create();
                  const previewUrl = self.sandbox.getPreviewUrl(sandboxId) || '';
                  self.emit('sandbox_created', { sandboxId, previewUrl });
                }
                
                // 写入文件
                await self.sandbox.writeFile(sandboxId, block.path, block.content);
                self.emit('file_created', { path: block.path, sandboxId });
                
                // 如果是HTML文件且还没有触发过预览，则自动触发预览
                if (block.path.endsWith('.html') && !hasCreatedHtml) {
                  hasCreatedHtml = true;
                  // 延迟一点触发预览，确保文件已经写入完成
                  setTimeout(() => {
                    if (sandboxId) {
                      const previewUrl = self.sandbox.getPreviewUrl(sandboxId) || '';
                      self.emit('auto_preview', { 
                        sandboxId, 
                        previewUrl,
                        entryFile: block.path 
                      });
                    }
                  }, 500);
                }
              }
              
              // 清空已处理的代码块
              buffer = self.removeProcessedBlocks(buffer);
            }
            
            // 检查命令
            const commands = self.extractCommands(buffer);
            if (commands.length > 0 && sandboxId) {
              for (const cmd of commands) {
                self.emit('command', { command: cmd, sandboxId });
                
                const result = await self.sandbox.executeCommand(sandboxId, cmd);
                self.emit('command_result', { command: cmd, result, sandboxId });
              }
              
              buffer = self.removeProcessedCommands(buffer);
            }
          }
          
          self.emit('complete', { sandboxId });
        } catch (error: any) {
          self.emit('error', { message: error.message });
          yield `\n\n❌ 发生错误: ${error.message}`;
        }
      }
    };
  }
  
  private async buildPrompt(userInput: string, context: any): Promise<string> {
    const fileList = context.files
      ? Array.from(context.files.keys()).join(', ')
      : '空项目';
    
    let memoryStr = '';
    if (context.memory) {
      memoryStr = `\n\n## 记忆信息\n${context.memory}`;
    }
    
    return `你是 Atoms.dev 的 AI 助手，擅长根据用户需求生成代码。

当前项目已有文件: ${fileList || '无'}

${memoryStr}

用户需求: ${userInput}

请根据用户需求和记忆信息生成完整的代码。对于简单的 HTML/CSS/JS 项目，请生成单个 HTML 文件。
对于更复杂的项目，请生成合适的文件结构。

重要规则：
1. 对于简单的网页应用，直接生成一个完整的 HTML 文件，包含所有 HTML、CSS 和 JavaScript
2. 代码必须是可以直接运行的，不要使用外部 CDN 依赖
3. 使用内联样式或 <style> 标签
4. 使用内联脚本或 <script> 标签
5. 如果需要框架，优先使用原生 JavaScript 或简化的实现
6. 请参考记忆信息中的历史对话，保持对话连贯性

请直接输出代码，不需要解释。如果要创建文件，使用以下格式：
\`\`\`file
文件名.html
\`\`\`
\`\`\`html
<!DOCTYPE html>
<html>
<!-- 你的代码 -->
</html>
\`\`\`

现在开始生成代码：`;
  }
  
  private extractCodeBlocks(content: string): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    const fileRegex = /```file\s*\n([^\n]+)\n/;
    const codeRegex = /```html\s*([\s\S]*?)```/g;
    
    let match;
    while ((match = codeRegex.exec(content)) !== null) {
      // 尝试从上下文获取文件名
      const beforeMatch = content.substring(0, match.index);
      const fileNameMatch = beforeMatch.match(/```file\s*\n([^\n]+)\n([\s\S]*)$/);
      
      let path = 'index.html';
      if (fileNameMatch && fileNameMatch[1]) {
        path = fileNameMatch[1].trim();
        // 移除已处理的标记
      } else {
        // 尝试从之前的文本中查找文件名
        const prevLines = beforeMatch.split('\n');
        for (let i = prevLines.length - 1; i >= 0; i--) {
          const line = prevLines[i].trim();
          if (line.endsWith('.html') || line.endsWith('.js') || line.endsWith('.css')) {
            path = line;
            break;
          }
        }
      }
      
      blocks.push({
        path,
        language: 'html',
        content: match[1].trim(),
      });
    }
    
    return blocks;
  }
  
  private removeProcessedBlocks(content: string): string {
    // 移除已处理的代码块标记，保留未完成的部分
    return content;
  }
  
  private extractCommands(content: string): string[] {
    const commands: string[] = [];
    const regex = /```bash\s*([\s\S]*?)```/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const cmd = match[1].trim();
      if (cmd && !commands.includes(cmd)) {
        commands.push(cmd);
      }
    }
    
    return commands;
  }
  
  private removeProcessedCommands(content: string): string {
    return content;
  }
  
  getSandboxManager(): SandboxManager {
    return this.sandbox;
  }

  getLLMService(): LLMService {
    return this.llm;
  }

  setLLMProvider(provider: 'deepseek' | 'zhipu'): void {
    this.llm.setProvider(provider);
  }
}
