export interface UserMemory {
  userId: string;
  createdAt: number;
  updatedAt: number;
  techStack: { tech: string; frequency: number }[];
  recentMemories: {
    content: string;
    projectId: string;
    timestamp: number;
  }[];
  compressedMemory: string;
  conversationCount: number;
  context?: string;
}

export interface ProjectMemory {
  projectId: string;
  userId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  goal: string;
  techStack: string[];
  completedFeatures: string[];
  inProgressFeatures: string[];
  plannedFeatures: string[];
  conversationHistory: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    userRequest?: string;
    aiUnderstanding?: string;
    tasks?: string[];
    result?: string;
  }[];
  context: string;
  recentMemories: {
    content: string;
    timestamp: number;
    round: number;
  }[];
  compressedMemories: {
    content: string;
    timestamp: number;
    rounds: string;
  }[];
  conversationCount: number;
}

export interface MemoryPromptOptions {
  includeUserMemory?: boolean;
  includeProjectMemory?: boolean;
  maxConversations?: number;
}
