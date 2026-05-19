import * as fs from 'fs';
import * as path from 'path';
import { getSandboxBaseDir } from '../config/env.js';

export class MemoryManager {
  private baseDir: string;
  private usersDir: string;
  private projectsDir: string;

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
    const memoryFile = path.join(this.projectsDir, `${projectId}.json`);

    if (!fs.existsSync(memoryFile)) {
      return '';
    }

    try {
      const content = fs.readFileSync(memoryFile, 'utf-8');
      const memory = JSON.parse(content);

      return `## Project Context
### Project Name: ${memory.name || 'Unnamed'}
### Tech Stack: ${(memory.techStack || []).join(', ')}
### Completed Features: ${(memory.completedFeatures || []).join(', ')}

${memory.context || ''}`;
    } catch {
      return '';
    }
  }

  async addConversation(projectId: string, conversation: {
    userRequest: string;
    aiUnderstanding: string;
    tasks: string[];
    result: string;
  }): Promise<void> {
    const memoryFile = path.join(this.projectsDir, `${projectId}.json`);
    let memory: any = {};

    if (fs.existsSync(memoryFile)) {
      try {
        const content = fs.readFileSync(memoryFile, 'utf-8');
        memory = JSON.parse(content);
      } catch {
        memory = {};
      }
    }

    memory.conversationHistory = memory.conversationHistory || [];
    memory.conversationHistory.push({
      ...conversation,
      timestamp: Date.now()
    });

    if (memory.conversationHistory.length > 20) {
      memory.conversationHistory = memory.conversationHistory.slice(-20);
    }

    memory.updatedAt = Date.now();
    fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2), 'utf-8');
  }

  async createProjectMemory(projectId: string, userId: string, name: string): Promise<void> {
    const memoryFile = path.join(this.projectsDir, `${projectId}.json`);
    fs.writeFileSync(memoryFile, JSON.stringify({
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
    }, null, 2), 'utf-8');
  }

  async addCompletedFeature(projectId: string, feature: string): Promise<void> {
    const memoryFile = path.join(this.projectsDir, `${projectId}.json`);
    let memory: any = {};

    if (fs.existsSync(memoryFile)) {
      try {
        const content = fs.readFileSync(memoryFile, 'utf-8');
        memory = JSON.parse(content);
      } catch {
        memory = {};
      }
    }

    memory.completedFeatures = memory.completedFeatures || [];
    if (!memory.completedFeatures.includes(feature)) {
      memory.completedFeatures.push(feature);
    }

    memory.updatedAt = Date.now();
    fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2), 'utf-8');
  }
}
