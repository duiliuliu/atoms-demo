
import type { TaskBreakdown } from './task.js';

// 用户意图类型
export type IntentType = 
  | 'question'           // 简单提问，直接回答
  | 'code_production'    // 需要生成代码
  | 'text_generation'    // 需要生成文本（非代码）
  | 'document_generation' // 需要生成文档
  | 'refactor'           // 重构现有代码
  | 'debug'              // 调试代码
  | 'consultation';      // 技术咨询

// 意图分类结果
export interface IntentClassification {
  type: IntentType;
  confidence: number;     // 置信度 0-1
  requiresTaskBreakdown: boolean; // 是否需要任务拆分
  requiresConfirmation: boolean;  // 是否需要用户确认
  summary: string;        // 意图摘要
  keywords: string[];     // 提取的关键词
}

// 意图响应
export interface IntentResponse {
  type: 'answer' | 'text' | 'document' | 'task_breakdown' | 'clarification';
  classification: IntentClassification;
  content?: string;
  taskBreakdown?: TaskBreakdown;
  requiresConfirmation: boolean;
}
