export class TemplateIntelligenceEngine {
    templates = new Map();
    registerTemplate(template) {
        this.templates.set(template.id, template);
    }
    evaluate(templateId, features) {
        const template = this.templates.get(templateId);
        if (!template)
            return undefined;
        let score = 0;
        const evidence = {};
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
//# sourceMappingURL=index.js.map