import * as fs from 'fs';
import * as path from 'path';
import { getSandboxBaseDir } from '../config/env.js';

export class MemoryManager {
  private baseDir: string;
  private usersDir: string;
  private projectsDir: string;
  
  // In-memory caches for better performance
  private projectCache: Map<string, any> = new Map();
  private userCache: Map<string, any> = new Map();
  private pendingWrites: Map<string, NodeJS.Timeout> = new Map();

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.join(getSandboxBaseDir(), '..', 'atoms-memory');
    this.usersDir = path.join(this.baseDir, 'users');
    this.projectsDir = path.join(this.baseDir, 'projects');

    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    [this.usersDir, this.projectsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async buildContext(userId: string, projectId?: string): Promise<string> {
    const contexts: string[] = [];

    const userContext = await this.buildUserContext(userId);
    if (userContext) {
      contexts.push(userContext);
    }

    if (projectId) {
      const projectContext = await this.buildProjectContext(projectId);
      if (projectContext) {
        contexts.push(projectContext);
      }
    }

    return contexts.join('\n\n---\n\n');
  }

  private async buildUserContext(userId: string): Promise<string> {
    const memoryFile = path.join(this.usersDir, `${userId}.json`);

    if (!fs.existsSync(memoryFile)) {
      return '';
    }

    try {
      const content = fs.readFileSync(memoryFile, 'utf-8');
      const memory = JSON.parse(content);

      const topTechs = (memory.techStack || [])
        .sort((a: any, b: any) => (b.frequency || 0) - (a.frequency || 0))
        .slice(0, 5);

      return `## User Preferences
### Tech Stack: ${topTechs.map((t: any) => t.tech).join(', ')}

${memory.context || ''}`;
    } catch {
      return '';
    }
  }

  private async buildProjectContext(projectId: string): Promise<string> {
    const memory = await this.getProjectMemory(projectId);
    if (!memory) {
      return '';
    }

    // Add conversation history to context
    let conversationHistoryText = '';
    if (memory.conversationHistory && memory.conversationHistory.length > 0) {
      conversationHistoryText = `## Conversation History
${memory.conversationHistory.slice(-10).map((msg: any) => {
  if (msg.role === 'user') {
    return `User: ${msg.userRequest || msg.content}`;
  } else if (msg.role === 'assistant') {
    return `Assistant: ${msg.result || msg.content}`;
  } else {
    return `${msg.userRequest || msg.content}`;
  }
}).join('\n')}
`;
    }

    return `## Project Context
### Project Name: ${memory.name || 'Unnamed'}
### Tech Stack: ${(memory.techStack || []).join(', ')}
### Completed Features: ${(memory.completedFeatures || []).join(', ')}

${conversationHistoryText}
${memory.context || ''}`;
  }
  
  // New methods for memory cache management
  private async getProjectMemory(projectId: string): Promise<any> {
    // Check cache first
    if (this.projectCache.has(projectId)) {
      return this.projectCache.get(projectId);
    }

    const memoryFile = path.join(this.projectsDir, `${projectId}.json`);
    if (!fs.existsSync(memoryFile)) {
      return null;
    }

    try {
      const content = fs.readFileSync(memoryFile, 'utf-8');
      const memory = JSON.parse(content);
      this.projectCache.set(projectId, memory);
      return memory;
    } catch {
      return null;
    }
  }

  private saveProjectMemory(projectId: string, memory: any): void {
    // Update cache immediately
    this.projectCache.set(projectId, memory);
    
    // Schedule delayed write to disk
    if (this.pendingWrites.has(projectId)) {
      clearTimeout(this.pendingWrites.get(projectId));
    }
    
    const timeout = setTimeout(() => {
      const memoryFile = path.join(this.projectsDir, `${projectId}.json`);
      fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2), 'utf-8');
      this.pendingWrites.delete(projectId);
    }, 2000);
    
    this.pendingWrites.set(projectId, timeout);
  }

  async addConversation(projectId: string, conversation: {
    userRequest: string;
    aiUnderstanding: string;
    tasks: string[];
    result: string;
  }): Promise<void> {
    let memory: any = await this.getProjectMemory(projectId) || {};
    
    // Also add proper role-based messages
    memory.conversationHistory = memory.conversationHistory || [];
    memory.conversationHistory.push({
      role: 'user',
      content: conversation.userRequest,
      timestamp: Date.now()
    });
    memory.conversationHistory.push({
      role: 'assistant',
      content: conversation.result,
      ...conversation,
      timestamp: Date.now() + 1
    });

    if (memory.conversationHistory.length > 50) {
      memory.conversationHistory = memory.conversationHistory.slice(-50);
    }

    memory.updatedAt = Date.now();
    this.saveProjectMemory(projectId, memory);
  }
  
  // Add simpler methods for just adding messages
  async addUserMessage(projectId: string, userId: string, content: string): Promise<void> {
    let memory: any = await this.getProjectMemory(projectId) || {};
    if (!memory.projectId) {
      memory.projectId = projectId;
      memory.userId = userId;
      memory.createdAt = Date.now();
    }
    memory.conversationHistory = memory.conversationHistory || [];
    memory.conversationHistory.push({
      role: 'user',
      content,
      timestamp: Date.now()
    });
    memory.updatedAt = Date.now();
    this.saveProjectMemory(projectId, memory);
  }

  async addAssistantMessage(projectId: string, content: string): Promise<void> {
    let memory: any = await this.getProjectMemory(projectId) || {};
    memory.conversationHistory = memory.conversationHistory || [];
    memory.conversationHistory.push({
      role: 'assistant',
      content,
      timestamp: Date.now()
    });
    if (memory.conversationHistory.length > 50) {
      memory.conversationHistory = memory.conversationHistory.slice(-50);
    }
    memory.updatedAt = Date.now();
    this.saveProjectMemory(projectId, memory);
  }

  async createProjectMemory(projectId: string, userId: string, name: string): Promise<void> {
    const memory = {
      projectId,
      userId,
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      goal: '',
      techStack: [],
      completedFeatures: [],
      inProgressFeatures: [],
      plannedFeatures: [],
      conversationHistory: [],
      context: ''
    };
    this.saveProjectMemory(projectId, memory);
    // Also write immediately for safety
    const memoryFile = path.join(this.projectsDir, `${projectId}.json`);
    fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2), 'utf-8');
  }

  async addCompletedFeature(projectId: string, feature: string): Promise<void> {
    let memory: any = await this.getProjectMemory(projectId) || {};
    memory.completedFeatures = memory.completedFeatures || [];
    if (!memory.completedFeatures.includes(feature)) {
      memory.completedFeatures.push(feature);
    }
    memory.updatedAt = Date.now();
    this.saveProjectMemory(projectId, memory);
  }
  
  // Flush all pending writes to disk immediately
  async flushAll(): Promise<void> {
    for (const [projectId, timeout] of this.pendingWrites.entries()) {
      clearTimeout(timeout);
      const memory = this.projectCache.get(projectId);
      if (memory) {
        const memoryFile = path.join(this.projectsDir, `${projectId}.json`);
        fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2), 'utf-8');
      }
    }
    this.pendingWrites.clear();
  }
}
