import { IntentClassifier } from './IntentClassifier.js';
import { TaskAnalyzer } from './TaskAnalyzer.js';
import type { LLMService } from './llm/LLMService.js';
import type { IntentResponse } from '../types/intent.js';

interface ProjectInfo {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export class IntentHandler {
  private classifier: IntentClassifier;
  private taskAnalyzer: TaskAnalyzer;
  private llmService: LLMService;

  constructor(llmService: LLMService) {
    this.classifier = new IntentClassifier(llmService);
    this.taskAnalyzer = new TaskAnalyzer(llmService);
    this.llmService = llmService;
  }

  async handle(input: string, memory?: string, projects?: ProjectInfo[]): Promise<IntentResponse> {
    const classification = await this.classifier.classifyWithAI(input);

    switch (classification.type) {
      case 'question':
      case 'consultation':
        return await this.handleQuestion(input, classification, memory, projects);

      case 'text_generation':
        return await this.handleTextGeneration(input, classification, memory);

      case 'document_generation':
        return await this.handleDocumentGeneration(input, classification, memory);

      case 'code_production':
      case 'refactor':
      case 'debug':
      case 'modify':
        return await this.handleCodeProduction(input, classification, memory, projects);

      default:
        return await this.handleDefault(input, classification, memory);
    }
  }

  private getMemoryContext(memory?: string): string {
    if (!memory) return '';
    return `\n\n---\n记忆信息（最近对话）：\n${memory}`;
  }

  private getProjectsContext(projects?: ProjectInfo[]): string {
    if (!projects || projects.length === 0) return '';
    const projectList = projects.map(p => `- "${p.name}" (ID: ${p.id})`).join('\n');
    return `\n\n现有项目列表：\n${projectList}`;
  }

  private async handleQuestion(
    input: string,
    classification: any,
    memory?: string,
    projects?: ProjectInfo[]
  ): Promise<IntentResponse> {
    const context = this.getMemoryContext(memory) + this.getProjectsContext(projects);
    const answer = await this.llmService.complete(`请根据上下文回答用户问题。用户说："${input}"${context}\n\n请直接回答用户问题。`);

    return {
      type: 'answer',
      classification,
      content: answer.content,
      requiresConfirmation: false
    };
  }

  private async handleTextGeneration(
    input: string,
    classification: any,
    memory?: string
  ): Promise<IntentResponse> {
    const context = this.getMemoryContext(memory);
    const text = await this.llmService.complete(`Please generate text based on this request and context: ${input}${context}`);

    return {
      type: 'text',
      classification,
      content: text.content,
      requiresConfirmation: false
    };
  }

  private async handleDocumentGeneration(
    input: string,
    classification: any,
    memory?: string
  ): Promise<IntentResponse> {
    const context = this.getMemoryContext(memory);
    const document = await this.llmService.complete(`Please generate documentation based on this request and context: ${input}${context}`);

    return {
      type: 'document',
      classification,
      content: document.content,
      requiresConfirmation: false
    };
  }

  private async handleCodeProduction(
    input: string,
    classification: any,
    memory?: string,
    projects?: ProjectInfo[]
  ): Promise<IntentResponse> {
    const context = this.getMemoryContext(memory) + this.getProjectsContext(projects);
    const taskBreakdown = await this.taskAnalyzer.analyzeRequest(input, context);

    return {
      type: 'task_breakdown',
      classification,
      taskBreakdown,
      requiresConfirmation: true
    };
  }

  private async handleDefault(
    input: string,
    classification: any,
    memory?: string
  ): Promise<IntentResponse> {
    return {
      type: 'clarification',
      classification,
      content: "I'm not sure how to help with this request. Could you please clarify what you need?",
      requiresConfirmation: false
    };
  }

  generateConfirmationMessage(taskBreakdown: any): string {
    return this.taskAnalyzer.generateConfirmationMessage(taskBreakdown);
  }
}
