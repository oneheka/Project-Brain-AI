export interface TemplateFeatureWeights {
    [featureName: string]: number;
}
export interface HeuristicTemplate {
    id: string;
    category: 'quality' | 'architecture' | 'conventions' | 'security' | 'context' | 'frameworks';
    description: string;
    weights: TemplateFeatureWeights;
    threshold: number;
}
export interface MatchResult {
    templateId: string;
    confidence: number;
    isMatched: boolean;
    evidence: Record<string, number>;
}
export declare class TemplateIntelligenceEngine {
    private templates;
    registerTemplate(template: HeuristicTemplate): void;
    evaluate(templateId: string, features: Record<string, number>): MatchResult | undefined;
}
//# sourceMappingURL=index.d.ts.map