import * as fs from 'fs';
import * as path from 'path';
import { getSandboxBaseDir } from '../config/env.js';
import type { LLMService } from './llm/LLMService.js';
import type { UserMemory, ProjectMemory, MemoryPromptOptions } from '../types/memory.js';

export class MemoryManager {
  private baseDir: string;
  private usersDir: string;
  private projectsDir: string;
  
  private projectCache: Map<string, ProjectMemory> = new Map();
  private userCache: Map<string, UserMemory> = new Map();
  private pendingWrites: Map<string, NodeJS.Timeout> = new Map();
  
  private llmService: LLMService | null = null;
  
  private readonly COMPRESSION_THRESHOLD = 8;
  private readonly MAX_RECENT_MEMORIES = 8;
  private readonly MAX_COMPRESSED_MEMORIES = 10;
  private readonly MAX_CONVERSATION_HISTORY = 50;
  private readonly PERSIST_DELAY = 1000; // 1秒延迟异步写入

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

  async buildContext(
    userId: string, 
    projectId?: string, 
    options?: MemoryPromptOptions
  ): Promise<string> {
    const contexts: string[] = [];

    if (options?.includeUserMemory !== false) {
      const userContext = await this.buildUserContext(userId);
      if (userContext) {
        contexts.push(userContext);
      }
    }

    if (projectId && options?.includeProjectMemory !== false) {
      const projectContext = await this.buildProjectContext(projectId, options?.maxConversations);
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
    const memory = await this.getUserMemory(userId);
    if (!memory) {
      return '';
    }
    
    const parts: string[] = [];
    
    if (memory.compressedMemory) {
      parts.push(memory.compressedMemory);
    }
    
    if (memory.recentMemories && memory.recentMemories.length > 0) {
      parts.push(`最近记忆:\n${memory.recentMemories.map(m => 
        `- [${new Date(m.timestamp).toLocaleString()}] ${m.content}`
      ).join('\n')}`);
    }
    
    return parts.join('\n\n');
  }
  
  private async getCompressedProjectMemory(projectId: string): Promise<string> {
    const memory = await this.getProjectMemory(projectId);
    if (!memory) {
      return '';
    }
    
    const parts: string[] = [];
    
    parts.push(`项目名称: ${memory.name}`);
    parts.push(`项目目标: ${memory.goal || '未设置'}`);
    
    if (memory.techStack && memory.techStack.length > 0) {
      parts.push(`技术栈: ${memory.techStack.join(', ')}`);
    }
    
    if (memory.compressedMemories && memory.compressedMemories.length > 0) {
      parts.push(`历史压缩记忆:\n${memory.compressedMemories.map(m => 
        `- [轮次${m.rounds}] ${m.content}`
      ).join('\n\n---\n\n')}`);
    }
    
    if (memory.recentMemories && memory.recentMemories.length > 0) {
      parts.push(`最近会话记忆:\n${memory.recentMemories.map(m => 
        `- [第${m.round}轮] ${m.content}`
      ).join('\n')}`);
    }
    
    if (memory.conversationHistory && memory.conversationHistory.length > 0) {
      const recentMessages = memory.conversationHistory.slice(-10);
      parts.push(`最近对话:\n${recentMessages.map(msg => 
        `${msg.role === 'user' ? '用户' : 'AI'}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`
      ).join('\n')}`);
    }
    
    return parts.join('\n\n');
  }

  private async buildUserContext(userId: string): Promise<string> {
    const memory = await this.getUserMemory(userId);
    if (!memory) {
      return '';
    }

    const topTechs = (memory.techStack || [])
      .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
      .slice(0, 5);

    return `## User Preferences
### Tech Stack: ${topTechs.map(t => t.tech).join(', ')}

会话总数: ${memory.conversationCount}
${memory.context || ''}`;
  }

  private async buildProjectContext(
    projectId: string, 
    maxConversations: number = 10
  ): Promise<string> {
    const memory = await this.getProjectMemory(projectId);
    if (!memory) {
      return '';
    }

    let conversationHistoryText = '';
    if (memory.conversationHistory && memory.conversationHistory.length > 0) {
      conversationHistoryText = `## Conversation History
${memory.conversationHistory.slice(-maxConversations).map((msg) => {
  if (msg.role === 'user') {
    return `User: ${msg.content}`;
  } else {
    return `Assistant: ${msg.content}`;
  }
}).join('\n')}`;
    }

    return `## Project Context
### Project Name: ${memory.name || 'Unnamed'}
### Project Goal: ${memory.goal || '未设置'}
### Tech Stack: ${(memory.techStack || []).join(', ')}
### Completed Features: ${(memory.completedFeatures || []).join(', ')}

${conversationHistoryText}
${memory.context || ''}`;
  }
  
  private async getUserMemory(userId: string): Promise<UserMemory | null> {
    if (this.userCache.has(userId)) {
      return this.userCache.get(userId) as UserMemory;
    }

    const memoryFile = path.join(this.usersDir, `${userId}.json`);
    if (!fs.existsSync(memoryFile)) {
      return null;
    }

    try {
      const content = fs.readFileSync(memoryFile, 'utf-8');
      const memory = JSON.parse(content) as UserMemory;
      this.userCache.set(userId, memory);
      return memory;
    } catch {
      return null;
    }
  }
  
  private async getProjectMemory(projectId: string): Promise<ProjectMemory | null> {
    if (this.projectCache.has(projectId)) {
      return this.projectCache.get(projectId) || null;
    }

    const memoryFile = path.join(this.projectsDir, `${projectId}.json`);
    if (!fs.existsSync(memoryFile)) {
      return null;
    }

    try {
      const content = fs.readFileSync(memoryFile, 'utf-8');
      const memory = JSON.parse(content) as ProjectMemory;
      this.projectCache.set(projectId, memory);
      return memory;
    } catch {
      return null;
    }
  }

  private saveProjectMemory(projectId: string, memory: ProjectMemory): void {
    this.projectCache.set(projectId, memory);
    
    if (this.pendingWrites.has(projectId)) {
      clearTimeout(this.pendingWrites.get(projectId));
    }
    
    const timeout = setTimeout(() => {
      const memoryFile = path.join(this.projectsDir, `${projectId}.json`);
      fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2), 'utf-8');
      this.pendingWrites.delete(projectId);
    }, this.PERSIST_DELAY);
    
    this.pendingWrites.set(projectId, timeout);
  }
  
  private saveUserMemory(userId: string, memory: UserMemory): void {
    this.userCache.set(userId, memory);
    
    if (this.pendingWrites.has(`user_${userId}`)) {
      clearTimeout(this.pendingWrites.get(`user_${userId}`));
    }
    
    const timeout = setTimeout(() => {
      const memoryFile = path.join(this.usersDir, `${userId}.json`);
      fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2), 'utf-8');
      this.pendingWrites.delete(`user_${userId}`);
    }, this.PERSIST_DELAY);
    
    this.pendingWrites.set(`user_${userId}`, timeout);
  }
  
  private async getOrCreateUserMemory(userId: string): Promise<UserMemory> {
    if (this.userCache.has(userId)) {
      return this.userCache.get(userId)!;
    }
    
    const memoryFile = path.join(this.usersDir, `${userId}.json`);
    if (fs.existsSync(memoryFile)) {
      try {
        const content = fs.readFileSync(memoryFile, 'utf-8');
        const memory = JSON.parse(content) as UserMemory;
        this.userCache.set(userId, memory);
        return memory;
      } catch {
        // fall through to create new
      }
    }
    
    const memory: UserMemory = {
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

  async addConversation(
    projectId: string, 
    conversation: {
      userRequest: string;
      aiUnderstanding: string;
      tasks: string[];
      result: string;
    }
  ): Promise<void> {
    let memory = await this.getProjectMemory(projectId) || this.createEmptyProjectMemory(projectId, 'unknown', conversation.userRequest);
    
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

    if (memory.conversationHistory.length > this.MAX_CONVERSATION_HISTORY) {
      memory.conversationHistory = memory.conversationHistory.slice(-this.MAX_CONVERSATION_HISTORY);
    }

    memory.updatedAt = Date.now();
    this.saveProjectMemory(projectId, memory);
  }
  
  async addUserMessage(projectId: string, userId: string, content: string): Promise<void> {
    let memory = await this.getProjectMemory(projectId) || this.createEmptyProjectMemory(projectId, userId, '未命名项目');
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
    let memory = await this.getProjectMemory(projectId) || this.createEmptyProjectMemory(projectId, 'unknown', '未命名项目');
    memory.conversationHistory.push({
      role: 'assistant',
      content,
      timestamp: Date.now()
    });
    if (memory.conversationHistory.length > this.MAX_CONVERSATION_HISTORY) {
      memory.conversationHistory = memory.conversationHistory.slice(-this.MAX_CONVERSATION_HISTORY);
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
    let memory = await this.getProjectMemory(projectId) || this.createEmptyProjectMemory(projectId, userId, '未命名项目');
    
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
    
    if (memory.conversationHistory.length > this.MAX_CONVERSATION_HISTORY) {
      memory.conversationHistory = memory.conversationHistory.slice(-this.MAX_CONVERSATION_HISTORY);
    }
    
    const shortMemory = await this.generateShortMemory(userMessage, aiResponse);
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
  
  private createEmptyProjectMemory(
    projectId: string, 
    userId: string, 
    name: string
  ): ProjectMemory {
    return {
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
  
  private async compressProjectMemory(projectId: string, memory: ProjectMemory): Promise<void> {
    if (!this.llmService || !memory.recentMemories || memory.recentMemories.length === 0) {
      return;
    }
    
    const recentMemoriesText = memory.recentMemories.map((m) => 
      `${new Date(m.timestamp).toLocaleString()}: ${m.content}`
    ).join('\n');
    
    const prompt = `请将以下${memory.recentMemories.length}条记忆压缩成一条连贯的总结（不超过200字）：\n${recentMemoriesText}`;
    
    try {
      const result = await this.llmService.complete(prompt);
      const compressedMemory = result.content.trim();
      
      memory.compressedMemories.push({
        content: compressedMemory,
        timestamp: Date.now(),
        rounds: `${memory.conversationCount - this.COMPRESSION_THRESHOLD + 1} - ${memory.conversationCount}`
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
  
  private async compressUserMemory(userId: string, memory: UserMemory): Promise<void> {
    if (!this.llmService || !memory.recentMemories || memory.recentMemories.length === 0) {
      return;
    }
    
    const recentMemoriesText = memory.recentMemories.map((m) => 
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
    const memory: ProjectMemory = {
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

  async updateProjectGoal(projectId: string, goal: string): Promise<void> {
    let memory = await this.getProjectMemory(projectId) || this.createEmptyProjectMemory(projectId, 'unknown', '未命名项目');
    memory.goal = goal;
    memory.updatedAt = Date.now();
    this.saveProjectMemory(projectId, memory);
  }

  async addTechStack(projectId: string, tech: string | string[]): Promise<void> {
    let memory = await this.getProjectMemory(projectId) || this.createEmptyProjectMemory(projectId, 'unknown', '未命名项目');
    const techs = Array.isArray(tech) ? tech : [tech];
    for (const t of techs) {
      if (!memory.techStack.includes(t)) {
        memory.techStack.push(t);
      }
    }
    memory.updatedAt = Date.now();
    this.saveProjectMemory(projectId, memory);
  }

  async addCompletedFeature(projectId: string, feature: string): Promise<void> {
    let memory = await this.getProjectMemory(projectId) || this.createEmptyProjectMemory(projectId, 'unknown', '未命名项目');
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

  async hasProjectMemory(projectId: string): Promise<boolean> {
    const memoryFile = path.join(this.projectsDir, `${projectId}.json`);
    return fs.existsSync(memoryFile) || this.projectCache.has(projectId);
  }

  async getMemoryFilePath(projectId: string): Promise<string | null> {
    const memoryFile = path.join(this.projectsDir, `${projectId}.json`);
    return fs.existsSync(memoryFile) ? memoryFile : null;
  }

  async loadMemoryFromFile(filePath: string): Promise<ProjectMemory | null> {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      const memory = JSON.parse(content) as ProjectMemory;
      this.projectCache.set(memory.projectId, memory);
      return memory;
    } catch {
      return null;
    }
  }
}
