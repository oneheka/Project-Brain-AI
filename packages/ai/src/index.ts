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

export class PromptBuilder {
  buildMarkdownPrompt(payload: PromptContextPayload): string {
    const lines: string[] = [];

    lines.push('# 🧠 PROJECTBRAIN CONTEXT PAYLOAD');
    lines.push('> Automatically assembled from codebase AST, dependency graph, architecture layers, and security guardrails.');
    lines.push('');

    // 1. Task Section
    lines.push('## 🎯 TASK GOAL');
    lines.push(payload.task);
    lines.push('');

    // 2. Project & Architecture Overview
    lines.push('## 🏗️ ARCHITECTURE & PROJECT OVERVIEW');
    lines.push(payload.projectOverview);
    if (payload.architectureOverview) {
      lines.push('');
      lines.push(payload.architectureOverview);
    }
    lines.push('');

    // 3. Relevant Files
    if (payload.relevantFiles.length > 0) {
      lines.push('## 📁 RELEVANT FILES & STRUCTURE');
      for (const file of payload.relevantFiles) {
        lines.push(`- **\`${file.filePath}\`**: ${file.summary}`);
      }
      lines.push('');
    }

    // 4. Relevant Symbols & Signatures
    if (payload.relevantSymbols && payload.relevantSymbols.length > 0) {
      lines.push('## 🧬 RELEVANT SYMBOLS & INTERFACES');
      for (const sym of payload.relevantSymbols) {
        lines.push(`- \`${sym}\``);
      }
      lines.push('');
    }

    // 5. Existing Implementations (Do Not Duplicate)
    if (payload.doNotDuplicate && payload.doNotDuplicate.length > 0) {
      lines.push('## ⚠️ EXISTING IMPLEMENTATIONS — DO NOT DUPLICATE');
      for (const item of payload.doNotDuplicate) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }

    // 6. Project Conventions & Coding Rules
    if (payload.projectConventions && payload.projectConventions.length > 0) {
      lines.push('## 📐 PROJECT CONVENTIONS & CODING RULES');
      for (const convention of payload.projectConventions) {
        lines.push(`- ${convention}`);
      }
      lines.push('');
    }

    // 7. Known Problems & Guardrails
    if (payload.knownProblems && payload.knownProblems.length > 0) {
      lines.push('## 🛡️ KNOWN PROBLEMS & GUARDRAILS');
      for (const prob of payload.knownProblems) {
        lines.push(`- ${prob}`);
      }
      lines.push('');
    }

    // 8. Task Boundary Notice
    if (payload.taskBoundaryNotice) {
      lines.push('## 🚧 TASK BOUNDARY');
      lines.push(payload.taskBoundaryNotice);
      lines.push('');
    }

    // 9. Instructions For AI
    if (payload.instructionsForAi && payload.instructionsForAi.length > 0) {
      lines.push('## 📋 INSTRUCTIONS FOR AI EXECUTION');
      for (const inst of payload.instructionsForAi) {
        lines.push(`1. ${inst}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}

export * from './architecture-detector';
export * from './context-collector';
export * from './task-session-manager';
