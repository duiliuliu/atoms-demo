import type { LLMService } from './llm/LLMService.js';
import type { TaskBreakdown } from '../types/task.js';

export class TaskAnalyzer {
  private llmService: LLMService;

  constructor(llmService: LLMService) {
    this.llmService = llmService;
  }

  async analyzeRequest(userInput: string, context?: string): Promise<TaskBreakdown> {
    try {
      if (this.llmService) {
        const aiResult = await this.analyzeWithAI(userInput, context);
        if (aiResult) return aiResult;
      }
      const taskBreakdown = await this.createDefaultBreakdown(userInput, context);
      return taskBreakdown;
    } catch (error) {
      console.error('TaskAnalyzer error:', error);
      return this.createDefaultBreakdown(userInput, context);
    }
  }

  private async analyzeWithAI(userInput: string, context?: string): Promise<TaskBreakdown | null> {
    if (!this.llmService) return null;

    // 检测是否是继续请求
    const isContinueRequest = /(继续|完成|补充|接着|继续输出|继续做)/i.test(userInput);

    const prompt = `分析用户的代码请求，理解用户意图。

用户请求：${userInput}

${context || ''}

${isContinueRequest ? '注意：这是一个"继续"请求，请根据记忆中的上下文继续之前的工作，不要创建新的空白文件。' : ''}

请分析并返回JSON格式的任务拆分：
{
  "isModify": true/false,  // 是否是修改/继续现有项目
  "targetProject": "项目名称或null",  // 如果是修改/继续，指明是哪个项目
  "action": "create/update/continue",  // 创建/更新/继续
  "taskType": "create_file/update_file",  // 任务类型
  "description": "任务描述",
  "files": ["文件路径"]
}

请只返回JSON，不要其他内容。`;

    try {
      const result = await this.llmService.complete(prompt);
      const content = result.content || '';
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return this.createBreakdownFromAnalysis(userInput, analysis);
      }
    } catch (error) {
      console.warn('AI分析失败，使用默认分析:', error);
    }
    
    return null;
  }

  private createBreakdownFromAnalysis(userInput: string, analysis: any): TaskBreakdown {
    const isModify = analysis.isModify || false;
    
    return {
      id: crypto.randomUUID(),
      userIntent: {
        originalRequest: userInput,
        understoodGoal: analysis.description || userInput,
        scope: 'small',
        complexity: 'simple',
        techStack: ['HTML', 'CSS', 'JavaScript'],
        keyFeatures: [
          analysis.targetProject 
            ? `修改项目「${analysis.targetProject}」`
            : '创建新项目'
        ],
        potentialIssues: []
      },
      tasks: [
        {
          id: '1',
          type: analysis.taskType || (isModify ? 'update_file' : 'create_file'),
          description: analysis.description || (isModify 
            ? 'Update existing project files' 
            : 'Create new project with index.html'),
          files: analysis.files || ['index.html'],
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
    const isContinueRequest = /(继续|完成|补充|接着|继续输出|继续做)/i.test(userInput);
    const isModifyRequest = isContinueRequest || /项目[一二三四五六七八九十\d]+|现有的|之前的|添加|更新|修改|完善|优化/.test(userInput);
    
    const taskType = isModifyRequest ? 'update_file' : 'create_file';
    let taskDescription = isModifyRequest 
      ? 'Update existing project files to add/modify features'
      : 'Create index.html with basic structure';
    
    let keyFeatures = [isModifyRequest ? 'Modify existing project' : 'Basic website structure'];
    
    // 如果是继续请求，尝试从上下文中获取更多信息
    if (isContinueRequest && context) {
      taskDescription = 'Continue working on existing project based on previous context';
      keyFeatures = ['Continue previous work', 'Use existing project files'];
    }
    
    return {
      id: crypto.randomUUID(),
      userIntent: {
        originalRequest: userInput,
        understoodGoal: userInput,
        scope: 'small',
        complexity: 'simple',
        techStack: ['HTML', 'CSS', 'JavaScript'],
        keyFeatures,
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
