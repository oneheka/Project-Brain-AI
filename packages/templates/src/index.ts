export interface TemplateFeatureWeights {
  [featureName: string]: number;
}

export interface HeuristicTemplate {
  id: string;
  category: 'quality' | 'architecture' | 'conventions' | 'security' | 'context' | 'frameworks';
  description: string;
  weights: TemplateFeatureWeights;
  threshold: number; // e.g. 0.75
}

export interface MatchResult {
  templateId: string;
  confidence: number;
  isMatched: boolean;
  evidence: Record<string, number>;
}

export class TemplateIntelligenceEngine {
  private templates = new Map<string, HeuristicTemplate>();

  registerTemplate(template: HeuristicTemplate): void {
    this.templates.set(template.id, template);
  }

  evaluate(templateId: string, features: Record<string, number>): MatchResult | undefined {
    const template = this.templates.get(templateId);
    if (!template) return undefined;

    let score = 0;
    const evidence: Record<string, number> = {};

    for (const [key, weight] of Object.entries(template.weights)) {
      const val = features[key] ?? 0;
      evidence[key] = val;
      score += val * weight;
    }

    return {
      templateId: template.id,
      confidence: Math.min(1.0, Math.max(0.0, score)),
      isMatched: score >= template.threshold,
      evidence
    };
  }
}
