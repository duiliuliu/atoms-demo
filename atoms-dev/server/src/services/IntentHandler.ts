import { IntentClassifier } from './IntentClassifier.js';
import { TaskAnalyzer } from './TaskAnalyzer.js';
import type { LLMService } from './llm/LLMService.js';
import type { IntentResponse } from '../types/intent.js';

export class IntentHandler {
  private classifier: IntentClassifier;
  private taskAnalyzer: TaskAnalyzer;
  private llmService: LLMService;

  constructor(llmService: LLMService) {
    this.classifier = new IntentClassifier();
    this.taskAnalyzer = new TaskAnalyzer(llmService);
    this.llmService = llmService;
  }

  async handle(input: string): Promise<IntentResponse> {
    const classification = this.classifier.classify(input);

    switch (classification.type) {
      case 'question':
      case 'consultation':
        return await this.handleQuestion(input, classification);

      case 'text_generation':
        return await this.handleTextGeneration(input, classification);

      case 'document_generation':
        return await this.handleDocumentGeneration(input, classification);

      case 'code_production':
      case 'refactor':
      case 'debug':
        return await this.handleCodeProduction(input, classification);

      default:
        return await this.handleDefault(input, classification);
    }
  }

  private async handleQuestion(
    input: string,
    classification: any
  ): Promise<IntentResponse> {
    const answer = await this.llmService.complete(`Please answer this question: ${input}`);

    return {
      type: 'answer',
      classification,
      content: answer.content,
      requiresConfirmation: false
    };
  }

  private async handleTextGeneration(
    input: string,
    classification: any
  ): Promise<IntentResponse> {
    const text = await this.llmService.complete(`Please generate text based on this request: ${input}`);

    return {
      type: 'text',
      classification,
      content: text.content,
      requiresConfirmation: false
    };
  }

  private async handleDocumentGeneration(
    input: string,
    classification: any
  ): Promise<IntentResponse> {
    const document = await this.llmService.complete(`Please generate documentation based on this request: ${input}`);

    return {
      type: 'document',
      classification,
      content: document.content,
      requiresConfirmation: false
    };
  }

  private async handleCodeProduction(
    input: string,
    classification: any
  ): Promise<IntentResponse> {
    const taskBreakdown = await this.taskAnalyzer.analyzeRequest(input);

    return {
      type: 'task_breakdown',
      classification,
      taskBreakdown,
      requiresConfirmation: true
    };
  }

  private async handleDefault(
    input: string,
    classification: any
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
