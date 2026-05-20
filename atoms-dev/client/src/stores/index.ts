import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { Message, FileInfo, TerminalLine, AgentStatus, LLMProvider, TabType } from '@/types';
import { getUserId, setLastProjectId } from '@/utils/userId';

interface ChatStore {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (content: string) => void;
  clearMessages: () => void;
}

interface Task {
  id: string;
  type: string;
  description: string;
  files: string[];
  estimatedTokens: number;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface UserIntent {
  originalRequest: string;
  understoodGoal: string;
  scope: 'small' | 'medium' | 'large';
  complexity: 'simple' | 'moderate' | 'complex';
  techStack: string[];
  keyFeatures: string[];
  potentialIssues?: string[];
}

interface TaskBreakdown {
  id: string;
  userIntent: UserIntent;
  tasks: Task[];
  totalEstimatedTokens: number;
  createdAt: number;
  status: 'pending' | 'confirmed' | 'modified' | 'executing' | 'completed';
}

interface IntentClassification {
  type: string;
  confidence: number;
  requiresTaskBreakdown: boolean;
  requiresConfirmation: boolean;
  summary: string;
  keywords: string[];
}

interface ProjectListItem {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  lastVisitedAt: number;
}

interface ProjectStore {
  files: FileInfo[];
  activeFile: FileInfo | null;
  previewUrl: string;
  sandboxId: string | null;
  projectId: string | null;
  projects: ProjectListItem[];
  previewEntryPath: string;
  setFiles: (files: FileInfo[]) => void;
  setActiveFile: (path: string) => void;
  updateFile: (path: string, content: string) => void;
  setPreviewUrl: (url: string) => void;
  setSandboxId: (id: string) => void;
  setProjectId: (id: string | null) => void;
  setProjects: (projects: ProjectListItem[]) => void;
  setPreviewEntryPath: (path: string) => void;
}

interface ExecutingTask {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  output?: string;
  createdAt: number;
}

interface TaskStore {
  currentBreakdown: TaskBreakdown | null;
  showTaskPanel: boolean;
  executingTasks: ExecutingTask[];
  setTaskBreakdown: (breakdown: TaskBreakdown | null) => void;
  setShowTaskPanel: (show: boolean) => void;
  confirmTasks: () => void;
  cancelTasks: () => void;
  startTaskExecution: (tasks: Task[]) => void;
  updateTaskStatus: (taskId: string, status: ExecutingTask['status'], output?: string) => void;
  clearExecutingTasks: () => void;
}

interface UIStore {
  activeTab: TabType;
  leftPanelSize: number;
  setActiveTab: (tab: TabType) => void;
  setLeftPanelSize: (size: number) => void;
  showProviderMenu: boolean;
  currentProvider: LLMProvider;
  setShowProviderMenu: (show: boolean) => void;
  setCurrentProvider: (provider: LLMProvider) => void;
}

interface TerminalStore {
  lines: TerminalLine[];
  addLine: (line: Omit<TerminalLine, 'id' | 'timestamp'>) => void;
  clearLines: () => void;
}

interface StatusStore {
  currentStatus: AgentStatus | null;
  statuses: AgentStatus[];
  setStatus: (status: AgentStatus) => void;
  clearStatus: () => void;
}

// Chat Store
export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isLoading: false,

  sendMessage: (content: string) => {
    const socket = getSocket();
    if (!socket) return;

    const userId = getUserId();
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
    }));

    socket.emit('chat:message', { content, userId });
  },

  clearMessages: () => set({ messages: [] }),
}));

// Task Store
export const useTaskStore = create<TaskStore>((set, get) => ({
  currentBreakdown: null,
  showTaskPanel: false,
  executingTasks: [],

  setTaskBreakdown: (breakdown) =>
    set({ currentBreakdown: breakdown, showTaskPanel: !!breakdown }),

  setShowTaskPanel: (show) => set({ showTaskPanel: show }),

  confirmTasks: () => {
    const socket = getSocket();
    const current = get().currentBreakdown;
    if (socket) {
      socket.emit('task:confirm');
      useChatStore.setState({ isLoading: true });
      
      if (current) {
        const tasks = current.tasks.map(task => ({
          id: task.id,
          description: task.description,
          status: 'pending' as const,
          createdAt: Date.now(),
        }));
        set({ 
          currentBreakdown: null, 
          showTaskPanel: false,
          executingTasks: tasks 
        });
      } else {
        set({ currentBreakdown: null, showTaskPanel: false });
      }
    }
  },

  cancelTasks: () => {
    const socket = getSocket();
    if (socket) {
      socket.emit('task:cancel');
    }
    set({ currentBreakdown: null, showTaskPanel: false, executingTasks: [] });
  },

  startTaskExecution: (tasks) => {
    const executingTasks = tasks.map(task => ({
      id: task.id,
      description: task.description,
      status: 'pending' as const,
      createdAt: Date.now(),
    }));
    set({ executingTasks });
  },

  updateTaskStatus: (taskId, status, output) => {
    set(state => ({
      executingTasks: state.executingTasks.map(task =>
        task.id === taskId ? { ...task, status, output: output || task.output } : task
      )
    }));
  },

  clearExecutingTasks: () => set({ executingTasks: [] }),
}));

// Project Store
export const useProjectStore = create<ProjectStore>((set, get) => ({
  files: [],
  activeFile: null,
  previewUrl: '',
  sandboxId: null,
  projectId: null,
  projects: [],
  previewEntryPath: '',

  setFiles: (files) => {
    // 设置文件时，如果没有预览入口，自动选择第一个HTML文件
    const htmlFiles = files.filter(f => 
      f.name.toLowerCase().endsWith('.html') || f.name.toLowerCase().endsWith('.htm')
    );
    const currentPath = get().previewEntryPath;
    const newPreviewPath = !currentPath && htmlFiles.length > 0 
      ? htmlFiles[0].path 
      : currentPath;
    set({ files, previewEntryPath: newPreviewPath });
  },

  setActiveFile: (path) => {
    const file = get().files.find((f) => f.path === path);
    set({ activeFile: file || null });
  },

  updateFile: (path, content) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.path === path ? { ...f, content } : f
      ),
      activeFile:
        state.activeFile?.path === path
          ? { ...state.activeFile, content }
          : state.activeFile,
    }));
  },

  setPreviewUrl: (url) => set({ previewUrl: url }),

  setSandboxId: (id) => set({ sandboxId: id }),

  setProjectId: (id) => {
    if (id) {
      setLastProjectId(id);
    }
    set({ projectId: id });
  },

  setProjects: (projects) => set({ projects }),

  setPreviewEntryPath: (path) => set({ previewEntryPath: path }),
}));

// UI Store
export const useUIStore = create<UIStore>((set) => ({
  activeTab: 'preview',
  leftPanelSize: 40,
  showProviderMenu: false,
  currentProvider: 'deepseek',
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  setLeftPanelSize: (size) => set({ leftPanelSize: size }),
  
  setShowProviderMenu: (show) => set({ showProviderMenu: show }),
  
  setCurrentProvider: (provider) => set({ currentProvider: provider }),
}));

// Terminal Store
export const useTerminalStore = create<TerminalStore>((set) => ({
  lines: [],
  
  addLine: (line) =>
    set((state) => ({
      lines: [
        ...state.lines,
        {
          ...line,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        },
      ],
    })),
  
  clearLines: () => set({ lines: [] }),
}));

// Status Store
export const useStatusStore = create<StatusStore>((set) => ({
  currentStatus: null,
  statuses: [],
  
  setStatus: (status) =>
    set((state) => ({
      currentStatus: status,
      statuses: [...state.statuses, status],
    })),
  
  clearStatus: () => set({ currentStatus: null }),
}));

// Socket instance
let socket: Socket | null = null;

// 获取后端 URL
export function getBackendUrl(): string {
  // 优先使用环境变量
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  // 开发环境使用当前域名（配合代理）
  if (import.meta.env.DEV) {
    return window.location.origin;
  }
  // 生产环境也使用当前域名（如果通过代理）
  return window.location.origin;
}

export function getSocket(): Socket | null {
  return socket;
}

export function initSocket(): Socket {
  if (socket) return socket;
  
  const backendUrl = getBackendUrl();
  console.log('[Socket] Connecting to:', backendUrl);
  
  socket = io(backendUrl, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  
  socket.on('connect', () => {
    console.log('[Socket] Connected');
    
    // 连接成功后请求项目列表
    const userId = getUserId();
    if (userId) {
      socket.emit('project:list', { userId });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected');
  });
  
  socket.on('chat:chunk', (data: { content: string }) => {
    const chatStore = useChatStore.getState();
    const messages = chatStore.messages;
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage && lastMessage.role === 'ai') {
      useChatStore.setState({
        messages: messages.map((m) =>
          m.id === lastMessage.id
            ? { ...m, content: m.content + data.content }
            : m
        ),
      });
    } else {
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'ai',
        content: data.content,
        timestamp: Date.now(),
      };
      useChatStore.setState((state) => ({
        messages: [...state.messages, aiMessage],
      }));
    }
  });
  
  socket.on('chat:end', () => {
    useChatStore.setState({ isLoading: false });
    
    const projectStore = useProjectStore.getState();
    if (projectStore.sandboxId) {
      socket?.emit('files:list');
      socket?.emit('preview:get_url');
    }
  });
  
  socket.on('chat:error', (data: { message: string }) => {
    useChatStore.setState({ isLoading: false });
    useStatusStore.getState().setStatus({
      message: `错误: ${data.message}`,
      type: 'error',
    });
  });
  
  socket.on('chat:restore', (data: { messages: Array<{ id: string; role: string; content: string; timestamp: number }> }) => {
    useChatStore.setState({ messages: data.messages.map(m => ({
      id: m.id,
      role: m.role === 'user' ? 'user' : 'ai',
      content: m.content,
      timestamp: m.timestamp
    })) });
  });
  
  socket.on('agent:status', (data: { message: string; type: string }) => {
    useStatusStore.getState().setStatus({
      message: data.message,
      type: data.type as AgentStatus['type'],
    });
    
    // 模拟任务状态更新
    const taskStore = useTaskStore.getState();
    const tasks = taskStore.executingTasks;
    
    if (tasks.length > 0) {
      // 找到第一个 pending 或 in_progress 的任务
      let taskUpdated = false;
      for (let i = 0; i < tasks.length && !taskUpdated; i++) {
        const task = tasks[i];
        
        if (task.status === 'pending') {
          // 将第一个 pending 任务标记为 in_progress
          taskStore.updateTaskStatus(task.id, 'in_progress', '开始执行...');
          taskUpdated = true;
        } else if (task.status === 'in_progress') {
          // 根据状态消息判断是否完成
          if (data.message.includes('创建') || data.message.includes('完成')) {
            taskStore.updateTaskStatus(task.id, 'completed', 
              `${task.description}\n执行结果：\n${data.message}`);
            taskUpdated = true;
          }
        }
      }
    }
  });
  
  socket.on('sandbox:created', (data: { sandboxId: string; previewUrl: string }) => {
    useProjectStore.getState().setSandboxId(data.sandboxId);
    useProjectStore.getState().setPreviewUrl(data.previewUrl);
    useUIStore.getState().setActiveTab('preview');
  });
  
  socket.on('agent:file_created', (data: { path: string }) => {
    useStatusStore.getState().setStatus({
      message: `创建文件: ${data.path}`,
      type: 'info',
    });
    socket?.emit('files:list');
  });
  
  socket.on('files:list', (data: { files: FileInfo[] }) => {
    useProjectStore.getState().setFiles(data.files);
    if (data.files.length > 0 && !useProjectStore.getState().activeFile) {
      useProjectStore.getState().setActiveFile(data.files[0].path);
    }
  });
  
  socket.on('preview:url', (data: { url: string }) => {
    useProjectStore.getState().setPreviewUrl(data.url);
  });
  
  socket.on('preview:auto', (data: { sandboxId: string; previewUrl: string; entryFile: string }) => {
    useProjectStore.getState().setPreviewUrl(data.previewUrl);
    useUIStore.getState().setActiveTab('preview');
  });
  
  socket.on('agent:command', (data: { command: string }) => {
    useTerminalStore.getState().addLine({
      type: 'command',
      content: `$ ${data.command}`,
    });
  });
  
  socket.on('agent:command_result', (data: { result: { stdout: string; stderr: string; exitCode: number } }) => {
    if (data.result.stdout) {
      useTerminalStore.getState().addLine({
        type: 'stdout',
        content: data.result.stdout,
      });
    }
    if (data.result.stderr) {
      useTerminalStore.getState().addLine({
        type: 'stderr',
        content: data.result.stderr,
      });
    }
  });
  
  socket.on('llm:provider', (data: { provider: string }) => {
    useUIStore.getState().setCurrentProvider(data.provider as LLMProvider);
  });

  socket.on('task:breakdown', (data: { taskBreakdown: TaskBreakdown; classification: IntentClassification }) => {
    useChatStore.setState({ isLoading: false });
    useTaskStore.getState().setTaskBreakdown(data.taskBreakdown);
  });

  // 当聊天结束时，将所有任务标记为完成
  socket.on('chat:end', () => {
    useChatStore.setState({ isLoading: false });
    
    const taskStore = useTaskStore.getState();
    const tasks = taskStore.executingTasks;
    tasks.forEach(task => {
      if (task.status !== 'completed') {
        taskStore.updateTaskStatus(task.id, 'completed', task.output || '任务执行完成');
      }
    });
    
    const projectStore = useProjectStore.getState();
    if (projectStore.sandboxId) {
      socket?.emit('files:list');
      socket?.emit('preview:get_url');
    }
  });

  socket.on('project:list', (data: { projects: ProjectListItem[] }) => {
    useProjectStore.getState().setProjects(data.projects);
  });

  socket.on('project:created', (data: { project: any }) => {
    useProjectStore.getState().setProjectId(data.project.id);
    useProjectStore.getState().setSandboxId(data.project.sandboxId);
    
    // 刷新项目列表
    const userId = getUserId();
    if (userId) {
      socket.emit('project:list', { userId });
    }
  });

  socket.on('project:loaded', (data: { project: any }) => {
    useProjectStore.getState().setProjectId(data.project.id);
    useProjectStore.getState().setSandboxId(data.project.sandboxId);
    
    // 设置文件列表
    if (data.project.files && data.project.files.length > 0) {
      useProjectStore.getState().setFiles(data.project.files);
    }
    
    // 清除并重置聊天记录
    useChatStore.getState().clearMessages();
    if (data.project.messages && data.project.messages.length > 0) {
      useChatStore.setState({ messages: data.project.messages });
    }
    
    // 如果有沙箱 ID，请求文件列表和预览 URL
    if (data.project.sandboxId) {
      socket.emit('files:list');
      socket.emit('preview:get_url');
      useUIStore.getState().setActiveTab('preview');
    }
  });

  socket.on('project:deleted', (data: { projectId: string }) => {
    // 刷新项目列表
    const userId = getUserId();
    if (userId) {
      socket.emit('project:list', { userId });
    }
  });

  socket.on('project:error', (data: { message: string }) => {
    useStatusStore.getState().setStatus({
      message: data.message,
      type: 'error',
    });
  });

  return socket;
}

export function switchLLMProvider(provider: LLMProvider): void {
  const socket = getSocket();
  if (socket) {
    socket.emit('llm:provider', { provider });
    useUIStore.getState().setCurrentProvider(provider);
  }
}
