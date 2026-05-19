import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getSandboxBaseDir } from '../config/env.js';
import type { StoredProject, ProjectListItem } from '../types/project.js';

export class ProjectManager {
  private baseDir: string;
  private readonly MAX_PROJECTS = 5;

  constructor() {
    this.baseDir = path.join(getSandboxBaseDir(), '..', 'atoms-projects');
    this.ensureBaseDir();
  }

  private ensureBaseDir(): void {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private getUserMetaDir(userId: string): string {
    const userMetaDir = path.join(this.baseDir, userId, 'meta');
    if (!fs.existsSync(userMetaDir)) {
      fs.mkdirSync(userMetaDir, { recursive: true });
    }
    return userMetaDir;
  }

  async listProjects(userId: string): Promise<ProjectListItem[]> {
    const userMetaDir = this.getUserMetaDir(userId);

    if (!fs.existsSync(userMetaDir)) {
      return [];
    }

    const files = fs.readdirSync(userMetaDir);
    const projects: StoredProject[] = files
      .filter((f: string) => f.endsWith('.json'))
      .map((file: string) => {
        const content = fs.readFileSync(path.join(userMetaDir, file), 'utf-8');
        return JSON.parse(content) as StoredProject;
      })
      .sort((a: StoredProject, b: StoredProject) => b.updatedAt - a.updatedAt);

    return projects.map(p => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));
  }

  async createProject(
    userId: string,
    name: string,
    description?: string
  ): Promise<StoredProject> {
    await this.cleanupOldProjects(userId);

    const userMetaDir = this.getUserMetaDir(userId);
    const projectId = uuidv4();

    const project: StoredProject = {
      id: projectId,
      name,
      description,
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [],
      techStack: []
    };

    const metaFile = path.join(userMetaDir, `${projectId}.json`);
    fs.writeFileSync(metaFile, JSON.stringify(project, null, 2), 'utf-8');

    return project;
  }

  async getProject(projectId: string, userId: string): Promise<StoredProject | null> {
    const userMetaDir = this.getUserMetaDir(userId);
    const metaFile = path.join(userMetaDir, `${projectId}.json`);

    if (!fs.existsSync(metaFile)) {
      return null;
    }

    const content = fs.readFileSync(metaFile, 'utf-8');
    return JSON.parse(content) as StoredProject;
  }

  async saveProject(
    projectId: string,
    userId: string,
    updates: Partial<StoredProject>
  ): Promise<void> {
    const userMetaDir = this.getUserMetaDir(userId);
    const metaFile = path.join(userMetaDir, `${projectId}.json`);

    if (!fs.existsSync(metaFile)) {
      return;
    }

    const content = fs.readFileSync(metaFile, 'utf-8');
    const project = JSON.parse(content) as StoredProject;

    const updatedProject = {
      ...project,
      ...updates,
      id: project.id,
      userId: project.userId,
      createdAt: project.createdAt,
      updatedAt: Date.now()
    };

    fs.writeFileSync(metaFile, JSON.stringify(updatedProject, null, 2), 'utf-8');
  }

  async touchProject(projectId: string, userId: string): Promise<void> {
    const project = await this.getProject(projectId, userId);
    if (project) {
      await this.saveProject(projectId, userId, {});
    }
  }

  async deleteProject(projectId: string, userId: string): Promise<void> {
    const userMetaDir = this.getUserMetaDir(userId);
    const metaFile = path.join(userMetaDir, `${projectId}.json`);

    if (fs.existsSync(metaFile)) {
      fs.unlinkSync(metaFile);
    }
  }

  private async cleanupOldProjects(userId: string): Promise<void> {
    const projects = await this.listProjects(userId);

    if (projects.length >= this.MAX_PROJECTS) {
      const projectsToDelete = projects.slice(this.MAX_PROJECTS - 1);
      for (const project of projectsToDelete) {
        await this.deleteProject(project.id, userId);
      }
    }
  }
}
