import type { IntentType, IntentClassification } from '../types/intent.js';

interface ClassifierRule {
  type: IntentType;
  patterns: RegExp[];
  requiresTaskBreakdown: boolean;
  requiresConfirmation: boolean;
}

export class IntentClassifier {
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
      consultation: 'Consultation request'
    };

    const shortInput = input.length > 50 ? input.substring(0, 50) + '...' : input;
    return `${descriptions[type]}: ${shortInput}`;
  }
}
