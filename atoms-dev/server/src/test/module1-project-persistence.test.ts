// Test Module 1 - Project Persistence
import * as path from 'path';
import { ProjectManager } from '../services/ProjectManager.js';
import { TestRunner, cleanTestDir, assert, assertEqual, assertNotNull } from './utils/testRunner.js';

const TEST_DIR = path.join(process.cwd(), 'test-sandbox-persistence');
const TEST_USER = 'test-user-001';

export async function createPersistenceTests(runner: TestRunner) {
  runner.addModule({
    name: '模块1 - 项目持久化',
    tests: [
      {
        name: '创建新项目',
        fn: testCreateProject
      },
      {
        name: '列出用户项目',
        fn: testListProjects
      },
      {
        name: '获取单个项目',
        fn: testGetProject
      },
      {
        name: '重命名项目',
        fn: testRenameProject
      },
      {
        name: '删除项目',
        fn: testDeleteProject
      },
      {
        name: '5项目限制 - 创建第6个时删除最旧的',
        fn: testProjectLimit
      },
      {
        name: '项目列表按访问时间排序',
        fn: testProjectOrdering
      }
    ]
  });
}

async function testCreateProject() {
  cleanTestDir(TEST_DIR);
  const manager = new ProjectManager(TEST_DIR);
  
  const project = await manager.createProject(TEST_USER, 'Test Project 1');
  
  assertNotNull(project.id, '项目ID不应为空');
  assertEqual(project.name, 'Test Project 1');
  assertEqual(project.userId, TEST_USER);
}

async function testListProjects() {
  cleanTestDir(TEST_DIR);
  const manager = new ProjectManager(TEST_DIR);
  
  await manager.createProject(TEST_USER, 'Project A');
  await manager.createProject(TEST_USER, 'Project B');
  
  const projects = manager.listProjects(TEST_USER);
  
  assertEqual(projects.length, 2);
  assert(projects.some(p => p.name === 'Project A'));
  assert(projects.some(p => p.name === 'Project B'));
}

async function testGetProject() {
  cleanTestDir(TEST_DIR);
  const manager = new ProjectManager(TEST_DIR);
  
  const created = await manager.createProject(TEST_USER, 'My Project');
  const retrieved = manager.getProject(created.id, TEST_USER);
  
  assertNotNull(retrieved);
  assertEqual(retrieved!.name, 'My Project');
}

async function testRenameProject() {
  cleanTestDir(TEST_DIR);
  const manager = new ProjectManager(TEST_DIR);
  
  const project = await manager.createProject(TEST_USER, 'Old Name');
  await manager.saveProject(project.id, TEST_USER, { name: 'New Name' });
  
  const updated = manager.getProject(project.id, TEST_USER);
  assertEqual(updated!.name, 'New Name');
}

async function testDeleteProject() {
  cleanTestDir(TEST_DIR);
  const manager = new ProjectManager(TEST_DIR);
  
  const project = await manager.createProject(TEST_USER, 'To Delete');
  await manager.deleteProject(project.id, TEST_USER);
  
  const shouldBeNull = manager.getProject(project.id, TEST_USER);
  assert(shouldBeNull === null);
}

async function testProjectLimit() {
  cleanTestDir(TEST_DIR);
  const manager = new ProjectManager(TEST_DIR);
  
  const projects = [];
  for (let i = 1; i <= 6; i++) {
    const p = await manager.createProject(TEST_USER, `Project ${i}`);
    projects.push(p);
  }
  
  const listed = manager.listProjects(TEST_USER);
  assert(listed.length <= 5, `项目数量应不超过5个，实际是${listed.length}`);
}

async function testProjectOrdering() {
  cleanTestDir(TEST_DIR);
  const manager = new ProjectManager(TEST_DIR);
  
  // Create projects in sequence
  const p1 = await manager.createProject(TEST_USER, 'Oldest');
  await new Promise(r => setTimeout(r, 10)); // Small delay to ensure different timestamps
  const p2 = await manager.createProject(TEST_USER, 'Middle');
  await new Promise(r => setTimeout(r, 10));
  const p3 = await manager.createProject(TEST_USER, 'Newest');
  
  // Access the middle one to update its lastVisitedAt
  await manager.touchProject(p2.id, TEST_USER);
  
  const projects = await manager.listProjects(TEST_USER);
  assertEqual(projects[0].name, 'Middle', '最近访问的项目应在最前面');
}
