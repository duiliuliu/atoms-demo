import type { IntentType, IntentClassification } from '../types/intent.js';
import type { LLMService } from './llm/LLMService.js';

interface ClassifierRule {
  type: IntentType;
  patterns: RegExp[];
  requiresTaskBreakdown: boolean;
  requiresConfirmation: boolean;
}

export class IntentClassifier {
  private llmService?: LLMService;
  
  constructor(llmService?: LLMService) {
    this.llmService = llmService;
  }
  
  private rules: ClassifierRule[] = [
    {
      type: 'question',
      patterns: [
        /^(what|how|why|where|when|whether|can|could|would|should|is|are|do|does|did)/i,
        /[?]/,
        /^(please|tell|explain|describe)/i
      ],
      requiresTaskBreakdown: false,
      requiresConfirmation: false
    },
    {
      type: 'code_production',
      patterns: [
        /(create|generate|build|make|write|develop|implement)/i,
        /(react|vue|angular|html|css|javascript|typescript|website|webapp|app)/i,
        /(index\.html|main\.js|style\.css|package\.json)/i
      ],
      requiresTaskBreakdown: true,
      requiresConfirmation: true
    },
    {
      type: 'text_generation',
      patterns: [
        /(write|generate|create|produce)/i,
        /(text|content|description|summary|article)/i,
        /(email|letter|message|note)/i
      ],
      requiresTaskBreakdown: false,
      requiresConfirmation: false
    },
    {
      type: 'document_generation',
      patterns: [
        /(document|documentation|docs|readme|changelog)/i,
        /(api doc|design doc|spec|specification)/i
      ],
      requiresTaskBreakdown: false,
      requiresConfirmation: false
    },
    {
      type: 'refactor',
      patterns: [
        /(refactor|optimize|improve|enhance|upgrade|restructure)/i
      ],
      requiresTaskBreakdown: true,
      requiresConfirmation: true
    },
    {
      type: 'debug',
      patterns: [
        /(fix|debug|solve|resolve|error|bug|problem|issue)/i
      ],
      requiresTaskBreakdown: true,
      requiresConfirmation: true
    },
    {
      type: 'modify',
      patterns: [
        /(修改|更新|添加|删除|调整|改变|完善|优化|增强)/i,
        /(项目[一二三四五六七八九十\d]+|现有的|之前的|上一次的)/i,
        /(header|页头|导航|菜单|按钮|表单|列表)/i,
        /(继续|完成|补充|接着|继续输出|继续做)/i
      ],
      requiresTaskBreakdown: true,
      requiresConfirmation: true
    },
    {
      type: 'consultation',
      patterns: [
        /(recommend|suggest|advise|advice|opinion|best|better)/i,
        /(which|what|compare|comparison)/i
      ],
      requiresTaskBreakdown: false,
      requiresConfirmation: false
    }
  ];

  classify(input: string): IntentClassification {
    const results: Array<{
      type: IntentType;
      matches: number;
      total: number;
    }> = [];

    for (const rule of this.rules) {
      let matches = 0;
      for (const pattern of rule.patterns) {
        if (pattern.test(input)) {
          matches++;
        }
      }
      results.push({
        type: rule.type,
        matches,
        total: rule.patterns.length
      });
    }

    const bestMatch = results.reduce((prev, curr) =>
      curr.matches > prev.matches ? curr : prev
    );

    const rule = this.rules.find(r => r.type === bestMatch.type);
    const confidence = bestMatch.total > 0
      ? bestMatch.matches / bestMatch.total
      : 0.5;

    const keywords = this.extractKeywords(input);

    return {
      type: bestMatch.type,
      confidence,
      requiresTaskBreakdown: rule?.requiresTaskBreakdown || false,
      requiresConfirmation: rule?.requiresConfirmation || false,
      summary: this.generateSummary(input, bestMatch.type),
      keywords
    };
  }

  private extractKeywords(input: string): string[] {
    const keywords: string[] = [];

    const techStacks = [
      'React', 'Vue', 'Angular', 'Next.js', 'Svelte', 'Tailwind',
      'TypeScript', 'JavaScript', 'CSS', 'HTML', 'Node.js',
      'Python', 'Django', 'Flask', 'MySQL', 'PostgreSQL', 'MongoDB'
    ];

    for (const tech of techStacks) {
      if (input.toLowerCase().includes(tech.toLowerCase())) {
        keywords.push(tech);
      }
    }

    return keywords;
  }

  private generateSummary(input: string, type: IntentType): string {
    const descriptions: Record<IntentType, string> = {
      question: 'User question',
      code_production: 'Code generation request',
      text_generation: 'Text generation request',
      document_generation: 'Document generation request',
      refactor: 'Code refactor request',
      debug: 'Debugging request',
      consultation: 'Consultation request',
      modify: 'Modify existing project request'
    };

    const shortInput = input.length > 50 ? input.substring(0, 50) + '...' : input;
    return `${descriptions[type]}: ${shortInput}`;
  }

  async classifyWithAI(input: string): Promise<IntentClassification> {
    // First use rule-based classification
    const ruleResult = this.classify(input);
    
    // If rule-based is confident, return it immediately
    if (ruleResult.confidence >= 0.6) {
      return ruleResult;
    }
    
    // If no LLM service, fall back to rule-based
    if (!this.llmService) {
      return ruleResult;
    }
    
    // Try AI-based classification for ambiguous cases
    try {
      const intentTypes = ['question', 'code_production', 'text_generation', 
                         'document_generation', 'refactor', 'debug', 'consultation', 'modify'];
      
      const prompt = `You are an intent classifier. Analyze the user's input and classify it into one of these types:
${intentTypes.map((t, i) => `${i+1}. ${t}`).join('\n')}

Respond with ONLY the type name, no other text.

User input: ${input}`;

      const formattedPrompt = `${prompt}\n\n${input}`;
      const response = await this.llmService.complete(formattedPrompt);
      
      const aiType = response.content?.trim().toLowerCase() || '';
      
      if (intentTypes.includes(aiType as IntentType)) {
        const rule = this.rules.find(r => r.type === aiType);
        const keywords = this.extractKeywords(input);
        
        return {
          type: aiType as IntentType,
          confidence: 0.8,
          requiresTaskBreakdown: rule?.requiresTaskBreakdown || false,
          requiresConfirmation: rule?.requiresConfirmation || false,
          summary: this.generateSummary(input, aiType as IntentType),
          keywords
        };
      }
    } catch (error) {
      // If AI fails, fall back to rule-based
      console.warn('AI classification failed, falling back to rule-based:', error);
    }
    
    return ruleResult;
  }
}
