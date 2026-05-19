import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 获取当前模块的目录（ES 模块兼容性）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Sandbox {
  id: string;
  port: number;
  status: 'starting' | 'ready' | 'stopped';
  files: Map<string, string>;
  rootDir: string;
  createdAt: Date;
}

export class SandboxManager {
  private sandboxes: Map<string, Sandbox> = new Map();
  private portCounter = 3000;
  private baseDir: string;
  
  constructor(baseDir?: string) {
    // 使用服务根目录下的 atoms-sandbox 文件夹
    const serverRoot = path.resolve(__dirname, '../../..');
    this.baseDir = baseDir || path.join(serverRoot, 'atoms-sandbox');
    
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }
  
  async create(): Promise<string> {
    const id = uuidv4();
    const port = this.portCounter++;
    
    const rootDir = path.join(this.baseDir, id);
    fs.mkdirSync(rootDir, { recursive: true });
    
    const sandbox: Sandbox = {
      id,
      port,
      status: 'starting',
      files: new Map(),
      rootDir,
      createdAt: new Date(),
    };
    
    this.sandboxes.set(id, sandbox);
    
    // 创建基础 HTML 文件
    const defaultHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My App</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: #333;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    h1 { color: #667eea; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 App Ready!</h1>
    <p>Your app is running successfully.</p>
  </div>
</body>
</html>`;
    
    await this.writeFile(id, 'index.html', defaultHtml);
    
    sandbox.status = 'ready';
    
    return id;
  }
  
  async writeFile(sandboxId: string, filePath: string, content: string): Promise<void> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      throw new Error('Sandbox not found');
    }
    
    const fullPath = path.join(sandbox.rootDir, filePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content, 'utf-8');
    sandbox.files.set(filePath, content);
  }
  
  async executeCommand(
    sandboxId: string,
    command: string
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      throw new Error('Sandbox not found');
    }
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: sandbox.rootDir,
        timeout: 30000,
      });
      
      return {
        stdout: stdout || '',
        stderr: stderr || '',
        exitCode: 0,
      };
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
      };
    }
  }
  
  getPreviewUrl(sandboxId: string): string {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      return '';
    }
    
    // 返回相对路径，由前端代理
    return `/preview/${sandboxId}/index.html`;
  }
  
  getSandboxDir(sandboxId: string): string | null {
    const sandbox = this.sandboxes.get(sandboxId);
    return sandbox?.rootDir || null;
  }
  
  async destroy(sandboxId: string): Promise<void> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      return;
    }
    
    // 删除目录
    if (fs.existsSync(sandbox.rootDir)) {
      fs.rmSync(sandbox.rootDir, { recursive: true, force: true });
    }
    
    this.sandboxes.delete(sandboxId);
  }
  
  getSandbox(sandboxId: string): Sandbox | undefined {
    return this.sandboxes.get(sandboxId);
  }
  
  listSandboxes(): Sandbox[] {
    return Array.from(this.sandboxes.values());
  }
}
