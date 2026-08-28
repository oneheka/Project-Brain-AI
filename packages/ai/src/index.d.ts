import type { PromptContextPayload } from '@projectbrain/shared';
export interface AiModelCapabilities {
    name: string;
    hasCodeReasoning: boolean;
    contextWindow: number;
    supportsStructuredOutput: boolean;
}
export interface PromptBuilderOptions {
    task: string;
    maxTokens?: number;
}
export declare class PromptBuilder {
    buildMarkdownPrompt(payload: PromptContextPayload): string;
}
//# sourceMappingURL=index.d.ts.map