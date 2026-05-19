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
  setFiles: (files: FileInfo[]) => void;
  setActiveFile: (path: string) => void;
  updateFile: (path: string, content: string) => void;
  setPreviewUrl: (url: string) => void;
  setSandboxId: (id: string) => void;
  setProjectId: (id: string | null) => void;
  setProjects: (projects: ProjectListItem[]) => void;
}

interface TaskStore {
  currentBreakdown: TaskBreakdown | null;
  showTaskPanel: boolean;
  setTaskBreakdown: (breakdown: TaskBreakdown | null) => void;
  setShowTaskPanel: (show: boolean) => void;
  confirmTasks: () => void;
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
export const useTaskStore = create<TaskStore>((set) => ({
  currentBreakdown: null,
  showTaskPanel: false,

  setTaskBreakdown: (breakdown) =>
    set({ currentBreakdown: breakdown, showTaskPanel: !!breakdown }),

  setShowTaskPanel: (show) => set({ showTaskPanel: show }),

  confirmTasks: () => {
    const socket = getSocket();
    if (socket) {
      socket.emit('task:confirm');
      set({ showTaskPanel: false });
    }
  },
}));

// Project Store
export const useProjectStore = create<ProjectStore>((set, get) => ({
  files: [],
  activeFile: null,
  previewUrl: '',
  sandboxId: null,
  projectId: null,
  projects: [],

  setFiles: (files) => set({ files }),

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
  
  socket.on('agent:status', (data: { message: string; type: string }) => {
    useStatusStore.getState().setStatus({
      message: data.message,
      type: data.type as AgentStatus['type'],
    });
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
    useTaskStore.getState().setTaskBreakdown(data.taskBreakdown);
  });

  socket.on('project:list', (data: { projects: ProjectListItem[] }) => {
    useProjectStore.getState().setProjects(data.projects);
  });

  socket.on('project:created', (data: { project: any }) => {
    useProjectStore.getState().setProjectId(data.project.id);
    useProjectStore.getState().setSandboxId(data.project.sandboxId);
  });

  socket.on('project:loaded', (data: { project: any }) => {
    useProjectStore.getState().setProjectId(data.project.id);
    useProjectStore.getState().setSandboxId(data.project.sandboxId);
    useProjectStore.getState().setFiles(data.project.files || []);
    useChatStore.getState().clearMessages();
    useChatStore.setState({ messages: data.project.messages || [] });
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
