import * as fs from 'fs';
import * as path from 'path';
import { getSandboxBaseDir } from '../config/env.js';
import type { LLMService } from './llm/LLMService.js';

export class MemoryManager {
  private baseDir: string;
  private usersDir: string;
  private projectsDir: string;
  
  private projectCache: Map<string, any> = new Map();
  private userCache: Map<string, any> = new Map();
  private pendingWrites: Map<string, NodeJS.Timeout> = new Map();
  
  private llmService: LLMService | null = null;
  
  private readonly COMPRESSION_THRESHOLD = 8;
  private readonly MAX_RECENT_MEMORIES = 8;
  private readonly MAX_COMPRESSED_MEMORIES = 10;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.join(getSandboxBaseDir(), '..', 'atoms-memory');
    this.usersDir = path.join(this.baseDir, 'users');
    this.projectsDir = path.join(this.baseDir, 'projects');

    this.ensureDirectories();
  }
  
  setLLMService(llmService: LLMService): void {
    this.llmService = llmService;
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
  
  async getCompressedMemory(userId: string, projectId?: string): Promise<string> {
    const memories: string[] = [];
    
    const userMemory = await this.getCompressedUserMemory(userId);
    if (userMemory) {
      memories.push(`## 用户记忆\n${userMemory}`);
    }
    
    if (projectId) {
      const projectMemory = await this.getCompressedProjectMemory(projectId);
      if (projectMemory) {
        memories.push(`## 项目记忆\n${projectMemory}`);
      }
    }
    
    return memories.join('\n\n');
  }

  private async getCompressedUserMemory(userId: string): Promise<string> {
    const memoryFile = path.join(this.usersDir, `${userId}.json`);

    if (!fs.existsSync(memoryFile)) {
      return '';
    }

    try {
      const content = fs.readFileSync(memoryFile, 'utf-8');
      const memory = JSON.parse(content);
      
      const parts: string[] = [];
      
      if (memory.compressedMemory) {
        parts.push(memory.compressedMemory);
      }
      
      if (memory.recentMemories && memory.recentMemories.length > 0) {
        parts.push(`最近记忆:\n${memory.recentMemories.join('\n')}`);
      }
      
      return parts.join('\n\n');
    } catch {
      return '';
    }
  }
  
  private async getCompressedProjectMemory(projectId: string): Promise<string> {
    const memory = await this.getProjectMemory(projectId);
    if (!memory) {
      return '';
    }
    
    const parts: string[] = [];
    
    if (memory.compressedMemories && memory.compressedMemories.length > 0) {
      parts.push(`历史压缩记忆:\n${memory.compressedMemories.join('\n\n---\n\n')}`);
    }
    
    if (memory.recentMemories && memory.recentMemories.length > 0) {
      parts.push(`最近会话记忆:\n${memory.recentMemories.join('\n')}`);
    }
    
    return parts.join('\n\n');
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
  
  private async getProjectMemory(projectId: string): Promise<any> {
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
    this.projectCache.set(projectId, memory);
    
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
  
  private saveUserMemory(userId: string, memory: any): void {
    this.userCache.set(userId, memory);
    
    if (this.pendingWrites.has(`user_${userId}`)) {
      clearTimeout(this.pendingWrites.get(`user_${userId}`));
    }
    
    const timeout = setTimeout(() => {
      const memoryFile = path.join(this.usersDir, `${userId}.json`);
      fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2), 'utf-8');
      this.pendingWrites.delete(`user_${userId}`);
    }, 2000);
    
    this.pendingWrites.set(`user_${userId}`, timeout);
  }
  
  private async getOrCreateUserMemory(userId: string): Promise<any> {
    if (this.userCache.has(userId)) {
      return this.userCache.get(userId);
    }
    
    const memoryFile = path.join(this.usersDir, `${userId}.json`);
    if (fs.existsSync(memoryFile)) {
      try {
        const content = fs.readFileSync(memoryFile, 'utf-8');
        const memory = JSON.parse(content);
        this.userCache.set(userId, memory);
        return memory;
      } catch {
        // fall through to create new
      }
    }
    
    const memory = {
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      techStack: [],
      recentMemories: [],
      compressedMemory: '',
      conversationCount: 0
    };
    
    this.userCache.set(userId, memory);
    return memory;
  }

  async addConversation(projectId: string, conversation: {
    userRequest: string;
    aiUnderstanding: string;
    tasks: string[];
    result: string;
  }): Promise<void> {
    let memory: any = await this.getProjectMemory(projectId) || {};
    
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
  
  async addUserMessage(projectId: string, userId: string, content: string): Promise<void> {
    let memory: any = await this.getProjectMemory(projectId) || {};
    if (!memory.projectId) {
      memory.projectId = projectId;
      memory.userId = userId;
      memory.createdAt = Date.now();
      memory.recentMemories = [];
      memory.compressedMemories = [];
      memory.conversationCount = 0;
    }
    memory.conversationHistory = memory.conversationHistory || [];
    memory.conversationHistory.push({
      role: 'user',
      content,
      timestamp: Date.now()
    });
    memory.conversationCount = (memory.conversationCount || 0) + 1;
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
  
  async addMessageWithCompression(
    projectId: string, 
    userId: string, 
    userMessage: string, 
    aiResponse: string
  ): Promise<void> {
    let memory: any = await this.getProjectMemory(projectId) || {};
    
    if (!memory.projectId) {
      memory.projectId = projectId;
      memory.userId = userId;
      memory.createdAt = Date.now();
      memory.recentMemories = [];
      memory.compressedMemories = [];
      memory.conversationCount = 0;
      memory.conversationHistory = [];
    }
    
    memory.conversationHistory.push({
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    });
    memory.conversationHistory.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: Date.now() + 1
    });
    
    if (memory.conversationHistory.length > 50) {
      memory.conversationHistory = memory.conversationHistory.slice(-50);
    }
    
    const shortMemory = await this.generateShortMemory(userMessage, aiResponse);
    memory.recentMemories = memory.recentMemories || [];
    memory.recentMemories.push({
      content: shortMemory,
      timestamp: Date.now(),
      round: memory.conversationCount
    });
    
    if (memory.recentMemories.length > this.MAX_RECENT_MEMORIES) {
      memory.recentMemories.shift();
    }
    
    memory.conversationCount = (memory.conversationCount || 0) + 1;
    
    if (memory.conversationCount % this.COMPRESSION_THRESHOLD === 0) {
      await this.compressProjectMemory(projectId, memory);
    }
    
    memory.updatedAt = Date.now();
    this.saveProjectMemory(projectId, memory);
    
    await this.updateUserMemory(userId, projectId, shortMemory);
  }
  
  private async generateShortMemory(userMessage: string, aiResponse: string): Promise<string> {
    if (!this.llmService) {
      return `${userMessage.substring(0, 50)} -> ${aiResponse.substring(0, 100)}`;
    }
    
    try {
      const prompt = `请将以下对话压缩成精简的记忆摘要（不超过50字）：\n用户：${userMessage}\nAI：${aiResponse}`;
      const result = await this.llmService.complete(prompt);
      return result.content.trim() || `${userMessage.substring(0, 50)} -> ${aiResponse.substring(0, 100)}`;
    } catch {
      return `${userMessage.substring(0, 50)} -> ${aiResponse.substring(0, 100)}`;
    }
  }
  
  private async compressProjectMemory(projectId: string, memory: any): Promise<void> {
    if (!this.llmService || !memory.recentMemories || memory.recentMemories.length === 0) {
      return;
    }
    
    const recentMemoriesText = memory.recentMemories.map((m: any) => 
      `${new Date(m.timestamp).toLocaleString()}: ${m.content}`
    ).join('\n');
    
    const prompt = `请将以下${memory.recentMemories.length}条记忆压缩成一条连贯的总结（不超过200字）：\n${recentMemoriesText}`;
    
    try {
      const result = await this.llmService.complete(prompt);
      const compressedMemory = result.content.trim();
      
      memory.compressedMemories = memory.compressedMemories || [];
      memory.compressedMemories.push({
        content: compressedMemory,
        timestamp: Date.now(),
        rounds: memory.conversationCount - this.COMPRESSION_THRESHOLD + 1 + ' - ' + memory.conversationCount
      });
      
      if (memory.compressedMemories.length > this.MAX_COMPRESSED_MEMORIES) {
        memory.compressedMemories.shift();
      }
      
      memory.recentMemories = [];
      
      this.saveProjectMemory(projectId, memory);
    } catch (error) {
      console.error('Memory compression failed:', error);
    }
  }
  
  private async updateUserMemory(userId: string, projectId: string, shortMemory: string): Promise<void> {
    let userMemory = await this.getOrCreateUserMemory(userId);
    
    userMemory.recentMemories = userMemory.recentMemories || [];
    userMemory.recentMemories.push({
      content: shortMemory,
      projectId,
      timestamp: Date.now()
    });
    
    if (userMemory.recentMemories.length > 20) {
      userMemory.recentMemories = userMemory.recentMemories.slice(-20);
    }
    
    userMemory.conversationCount = (userMemory.conversationCount || 0) + 1;
    
    if (userMemory.conversationCount % (this.COMPRESSION_THRESHOLD * 2) === 0) {
      await this.compressUserMemory(userId, userMemory);
    }
    
    userMemory.updatedAt = Date.now();
    this.saveUserMemory(userId, userMemory);
  }
  
  private async compressUserMemory(userId: string, memory: any): Promise<void> {
    if (!this.llmService || !memory.recentMemories || memory.recentMemories.length === 0) {
      return;
    }
    
    const recentMemoriesText = memory.recentMemories.map((m: any) => 
      `${new Date(m.timestamp).toLocaleString()} [项目${m.projectId?.substring(0, 8)}]: ${m.content}`
    ).join('\n');
    
    const prompt = `请总结以下用户的所有项目对话记忆（不超过300字），提取用户偏好、技术栈倾向和主要需求：\n${recentMemoriesText}`;
    
    try {
      const result = await this.llmService.complete(prompt);
      memory.compressedMemory = result.content.trim();
      memory.recentMemories = [];
      
      this.saveUserMemory(userId, memory);
    } catch (error) {
      console.error('User memory compression failed:', error);
    }
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
      context: '',
      recentMemories: [],
      compressedMemories: [],
      conversationCount: 0
    };
    this.saveProjectMemory(projectId, memory);
    
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
  
  async flushAll(): Promise<void> {
    for (const [key, timeout] of this.pendingWrites.entries()) {
      clearTimeout(timeout);
      if (key.startsWith('user_')) {
        const userId = key.substring(5);
        const memory = this.userCache.get(userId);
        if (memory) {
          const memoryFile = path.join(this.usersDir, `${userId}.json`);
          fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2), 'utf-8');
        }
      } else {
        const memory = this.projectCache.get(key);
        if (memory) {
          const memoryFile = path.join(this.projectsDir, `${key}.json`);
          fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2), 'utf-8');
        }
      }
    }
    this.pendingWrites.clear();
  }
}