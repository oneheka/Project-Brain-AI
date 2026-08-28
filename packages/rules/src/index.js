export class RuleEngine {
    rules = [];
    registerRule(rule) {
        this.rules.push(rule);
    }
    async runRules(file) {
        const diagnostics = [];
        for (const rule of this.rules) {
            const results = await rule.validate(file);
            diagnostics.push(...results);
        }
        return diagnostics;
    }
}
//# sourceMappingURL=index.js.map