import * as fs from 'fs';
import * as path from 'path';
import { getSandboxBaseDir } from '../config/env.js';

export interface ProjectContext {
  projectId: string;
  projectName: string;
  userId: string;
  goal: string;
  techStack: string[];
  keyFeatures: string[];
  completedFiles: string[];
  conversationSummary: Array<{
    round: number;
    userInput: string;
    aiAction: string;
    timestamp: number;
  }>;
  keyDecisions: Array<{
    decision: string;
    reason: string;
    timestamp: number;
  }>;
  createdAt: number;
  updatedAt: number;
}

export class EnhancedMemoryService {
  private baseDir: string;
  private projectsDir: string;
  
  // 内存缓存
  private projectContextCache: Map<string, ProjectContext> = new Map();
  private pendingMarkdownWrites: Map<string, NodeJS.Timeout> = new Map();
  
  private readonly MARKDOWN_WRITE_DELAY = 1000;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.join(getSandboxBaseDir(), '..', 'atoms-memory');
    this.projectsDir = path.join(this.baseDir, 'enhanced-projects');
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.projectsDir)) {
      fs.mkdirSync(this.projectsDir, { recursive: true });
    }
  }

  async getOrCreateProjectContext(
    projectId: string, 
    userId: string, 
    projectName: string
  ): Promise<ProjectContext> {
    if (this.projectContextCache.has(projectId)) {
      return this.projectContextCache.get(projectId)!;
    }

    const markdownFile = path.join(this.projectsDir, `${projectId}.md`);
    
    if (fs.existsSync(markdownFile)) {
      const context = this.parseMarkdownToContext(
        fs.readFileSync(markdownFile, 'utf-8'),
        projectId,
        userId,
        projectName
      );
      this.projectContextCache.set(projectId, context);
      return context;
    }

    const newContext: ProjectContext = {
      projectId,
      projectName,
      userId,
      goal: '',
      techStack: [],
      keyFeatures: [],
      completedFiles: [],
      conversationSummary: [],
      keyDecisions: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.projectContextCache.set(projectId, newContext);
    this.scheduleMarkdownWrite(projectId);
    return newContext;
  }

  async updateProjectGoal(
    projectId: string, 
    userId: string, 
    projectName: string, 
    goal: string
  ): Promise<void> {
    const context = await this.getOrCreateProjectContext(projectId, userId, projectName);
    context.goal = goal;
    context.updatedAt = Date.now();
    this.scheduleMarkdownWrite(projectId);
  }

  async addTechStack(
    projectId: string, 
    userId: string, 
    projectName: string, 
    tech: string | string[]
  ): Promise<void> {
    const context = await this.getOrCreateProjectContext(projectId, userId, projectName);
    const techs = Array.isArray(tech) ? tech : [tech];
    for (const t of techs) {
      if (!context.techStack.includes(t)) {
        context.techStack.push(t);
      }
    }
    context.updatedAt = Date.now();
    this.scheduleMarkdownWrite(projectId);
  }

  async addKeyFeature(
    projectId: string, 
    userId: string, 
    projectName: string, 
    feature: string
  ): Promise<void> {
    const context = await this.getOrCreateProjectContext(projectId, userId, projectName);
    if (!context.keyFeatures.includes(feature)) {
      context.keyFeatures.push(feature);
    }
    context.updatedAt = Date.now();
    this.scheduleMarkdownWrite(projectId);
  }

  async addCompletedFile(
    projectId: string, 
    userId: string, 
    projectName: string, 
    filePath: string
  ): Promise<void> {
    const context = await this.getOrCreateProjectContext(projectId, userId, projectName);
    if (!context.completedFiles.includes(filePath)) {
      context.completedFiles.push(filePath);
    }
    context.updatedAt = Date.now();
    this.scheduleMarkdownWrite(projectId);
  }

  async addConversationSummary(
    projectId: string, 
    userId: string, 
    projectName: string, 
    userInput: string, 
    aiAction: string
  ): Promise<void> {
    const context = await this.getOrCreateProjectContext(projectId, userId, projectName);
    context.conversationSummary.push({
      round: context.conversationSummary.length + 1,
      userInput,
      aiAction,
      timestamp: Date.now()
    });
    
    if (context.conversationSummary.length > 20) {
      context.conversationSummary = context.conversationSummary.slice(-20);
    }
    
    context.updatedAt = Date.now();
    this.scheduleMarkdownWrite(projectId);
  }

  async addKeyDecision(
    projectId: string, 
    userId: string, 
    projectName: string, 
    decision: string, 
    reason: string
  ): Promise<void> {
    const context = await this.getOrCreateProjectContext(projectId, userId, projectName);
    context.keyDecisions.push({
      decision,
      reason,
      timestamp: Date.now()
    });
    
    if (context.keyDecisions.length > 15) {
      context.keyDecisions = context.keyDecisions.slice(-15);
    }
    
    context.updatedAt = Date.now();
    this.scheduleMarkdownWrite(projectId);
  }

  async buildContextPrompt(
    projectId: string, 
    userId: string, 
    projectName: string
  ): Promise<string> {
    const context = await this.getOrCreateProjectContext(projectId, userId, projectName);
    
    const parts: string[] = [];
    
    parts.push(`# 项目上下文: ${context.projectName}`);
    parts.push(``);
    
    if (context.goal) {
      parts.push(`## 🎯 项目目标`);
      parts.push(context.goal);
      parts.push(``);
    }
    
    if (context.techStack.length > 0) {
      parts.push(`## 🛠️ 技术栈`);
      parts.push(context.techStack.map(t => `- ${t}`).join('\n'));
      parts.push(``);
    }
    
    if (context.keyFeatures.length > 0) {
      parts.push(`## ✨ 核心功能`);
      parts.push(context.keyFeatures.map(f => `- ${f}`).join('\n'));
      parts.push(``);
    }
    
    if (context.completedFiles.length > 0) {
      parts.push(`## 📁 已完成文件`);
      parts.push(context.completedFiles.map(f => `- ${f}`).join('\n'));
      parts.push(``);
    }
    
    if (context.conversationSummary.length > 0) {
      parts.push(`## 💬 最近对话`);
      for (const conv of context.conversationSummary.slice(-10)) {
        parts.push(`### 第${conv.round}轮`);
        parts.push(`**用户**: ${conv.userInput}`);
        parts.push(`**AI**: ${conv.aiAction}`);
        parts.push(``);
      }
    }
    
    if (context.keyDecisions.length > 0) {
      parts.push(`## 📋 关键决策`);
      for (const decision of context.keyDecisions) {
        parts.push(`- **${decision.decision}** (${new Date(decision.timestamp).toLocaleString()})`);
        parts.push(`  原因: ${decision.reason}`);
      }
      parts.push(``);
    }
    
    return parts.join('\n');
  }

  private parseMarkdownToContext(
    content: string, 
    projectId: string, 
    userId: string, 
    projectName: string
  ): ProjectContext {
    const context: ProjectContext = {
      projectId,
      projectName,
      userId,
      goal: '',
      techStack: [],
      keyFeatures: [],
      completedFiles: [],
      conversationSummary: [],
      keyDecisions: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const lines = content.split('\n');
    let currentSection = '';
    let currentRound = 0;
    let currentUserInput = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('## 🎯 项目目标')) {
        currentSection = 'goal';
      } else if (line.startsWith('## 🛠️ 技术栈')) {
        currentSection = 'techStack';
      } else if (line.startsWith('## ✨ 核心功能')) {
        currentSection = 'keyFeatures';
      } else if (line.startsWith('## 📁 已完成文件')) {
        currentSection = 'completedFiles';
      } else if (line.startsWith('## 💬 最近对话')) {
        currentSection = 'conversation';
      } else if (line.startsWith('## 📋 关键决策')) {
        currentSection = 'keyDecisions';
      } else if (line.startsWith('#') || line.startsWith('---')) {
        currentSection = '';
      } else if (line) {
        switch (currentSection) {
          case 'goal':
            if (context.goal) context.goal += '\n';
            context.goal += line;
            break;
          case 'techStack':
            if (line.startsWith('- ')) {
              context.techStack.push(line.substring(2));
            }
            break;
          case 'keyFeatures':
            if (line.startsWith('- ')) {
              context.keyFeatures.push(line.substring(2));
            }
            break;
          case 'completedFiles':
            if (line.startsWith('- ')) {
              context.completedFiles.push(line.substring(2));
            }
            break;
          case 'conversation':
            if (line.startsWith('### 第')) {
              const match = line.match(/第(\d+)轮/);
              if (match) currentRound = parseInt(match[1]);
            } else if (line.startsWith('**用户**: ')) {
              currentUserInput = line.substring('**用户**: '.length);
            } else if (line.startsWith('**AI**: ')) {
              const aiAction = line.substring('**AI**: '.length);
              context.conversationSummary.push({
                round: currentRound,
                userInput: currentUserInput,
                aiAction,
                timestamp: Date.now() - context.conversationSummary.length * 100000
              });
            }
            break;
          case 'keyDecisions':
            if (line.startsWith('- **')) {
              const decision = line.match(/-\*\*(.+?)\*\*/)?.[1] || '';
              const timeStr = line.match(/\((.+?)\)/)?.[1];
              const timestamp = timeStr ? new Date(timeStr).getTime() : Date.now();
              if (i + 1 < lines.length && lines[i + 1].trim().startsWith('原因: ')) {
                const reason = lines[i + 1].trim().substring('原因: '.length);
                context.keyDecisions.push({ decision, reason, timestamp });
                i++;
              }
            }
            break;
        }
      }
    }
    
    return context;
  }

  private contextToMarkdown(context: ProjectContext): string {
    const parts: string[] = [];
    
    parts.push(`# 项目: ${context.projectName}`);
    parts.push(``);
    parts.push(`- **项目ID**: ${context.projectId}`);
    parts.push(`- **用户ID**: ${context.userId}`);
    parts.push(`- **创建时间**: ${new Date(context.createdAt).toLocaleString()}`);
    parts.push(`- **更新时间**: ${new Date(context.updatedAt).toLocaleString()}`);
    parts.push(``);
    parts.push(`---`);
    parts.push(``);
    
    if (context.goal) {
      parts.push(`## 🎯 项目目标`);
      parts.push(context.goal);
      parts.push(``);
    }
    
    if (context.techStack.length > 0) {
      parts.push(`## 🛠️ 技术栈`);
      for (const tech of context.techStack) {
        parts.push(`- ${tech}`);
      }
      parts.push(``);
    }
    
    if (context.keyFeatures.length > 0) {
      parts.push(`## ✨ 核心功能`);
      for (const feature of context.keyFeatures) {
        parts.push(`- ${feature}`);
      }
      parts.push(``);
    }
    
    if (context.completedFiles.length > 0) {
      parts.push(`## 📁 已完成文件`);
      for (const file of context.completedFiles) {
        parts.push(`- ${file}`);
      }
      parts.push(``);
    }
    
    if (context.conversationSummary.length > 0) {
      parts.push(`## 💬 最近对话`);
      for (const conv of context.conversationSummary) {
        parts.push(`### 第${conv.round}轮`);
        parts.push(`**用户**: ${conv.userInput}`);
        parts.push(`**AI**: ${conv.aiAction}`);
        parts.push(``);
      }
    }
    
    if (context.keyDecisions.length > 0) {
      parts.push(`## 📋 关键决策`);
      for (const decision of context.keyDecisions) {
        parts.push(`- **${decision.decision}** (${new Date(decision.timestamp).toLocaleString()})`);
        parts.push(`  原因: ${decision.reason}`);
      }
      parts.push(``);
    }
    
    return parts.join('\n');
  }

  private scheduleMarkdownWrite(projectId: string): void {
    if (this.pendingMarkdownWrites.has(projectId)) {
      clearTimeout(this.pendingMarkdownWrites.get(projectId));
    }
    
    const timeout = setTimeout(() => {
      this.writeMarkdownToFile(projectId);
      this.pendingMarkdownWrites.delete(projectId);
    }, this.MARKDOWN_WRITE_DELAY);
    
    this.pendingMarkdownWrites.set(projectId, timeout);
  }

  private writeMarkdownToFile(projectId: string): void {
    const context = this.projectContextCache.get(projectId);
    if (!context) return;
    
    const markdownFile = path.join(this.projectsDir, `${projectId}.md`);
    fs.writeFileSync(markdownFile, this.contextToMarkdown(context), 'utf-8');
  }

  async flushAll(): Promise<void> {
    for (const [projectId, timeout] of this.pendingMarkdownWrites.entries()) {
      clearTimeout(timeout);
      this.writeMarkdownToFile(projectId);
    }
    this.pendingMarkdownWrites.clear();
  }
}
