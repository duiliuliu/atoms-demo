import type { LLMService } from './llm/LLMService.js';
import type { TaskBreakdown } from '../types/task.js';

export class TaskAnalyzer {
  private llmService: LLMService;

  constructor(llmService: LLMService) {
    this.llmService = llmService;
  }

  async analyzeRequest(userInput: string, context?: string): Promise<TaskBreakdown> {
    try {
      const taskBreakdown = await this.createDefaultBreakdown(userInput, context);
      return taskBreakdown;
    } catch (error) {
      console.error('TaskAnalyzer error:', error);
      return this.createDefaultBreakdown(userInput, context);
    }
  }

  generateConfirmationMessage(taskBreakdown: TaskBreakdown): string {
    const tasksList = taskBreakdown.tasks.map((task, index) => {
      return `${index + 1}. [${task.type}] ${task.description}`;
    }).join('\n');

    const keyFeatures = taskBreakdown.userIntent.keyFeatures.map(f => `- ${f}`).join('\n');

    const potentialIssues = taskBreakdown.userIntent.potentialIssues?.length
      ? `\n\n⚠️ Note:\n${taskBreakdown.userIntent.potentialIssues.map(p => `- ${p}`).join('\n')}`
      : '';

    return `I've analyzed your request:

**Goal**: ${taskBreakdown.userIntent.understoodGoal}

**Tech Stack**: ${taskBreakdown.userIntent.techStack.join(', ')}

**Features**:
${keyFeatures}${potentialIssues}

**Tasks**:
${tasksList}

---

Please reply "confirm" to proceed, or let me know if you need to make any changes.`;
  }

  private createDefaultBreakdown(userInput: string, context?: string): TaskBreakdown {
    const isModifyRequest = /项目[一二三四五六七八九十\d]+|现有的|之前的|添加|更新|修改|完善|优化/.test(userInput);
    
    const taskType = isModifyRequest ? 'update_file' : 'create_file';
    const taskDescription = isModifyRequest 
      ? 'Update existing project files to add/modify features'
      : 'Create index.html with basic structure';
    
    return {
      id: crypto.randomUUID(),
      userIntent: {
        originalRequest: userInput,
        understoodGoal: userInput,
        scope: 'small',
        complexity: 'simple',
        techStack: ['HTML', 'CSS', 'JavaScript'],
        keyFeatures: [isModifyRequest ? 'Modify existing project' : 'Basic website structure'],
        potentialIssues: []
      },
      tasks: [
        {
          id: '1',
          type: taskType,
          description: taskDescription,
          files: ['index.html'],
          estimatedTokens: 500,
          dependencies: [],
          status: 'pending'
        }
      ],
      totalEstimatedTokens: 500,
      createdAt: Date.now(),
      status: 'pending'
    };
  }
}
