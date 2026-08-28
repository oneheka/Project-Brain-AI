export class PromptBuilder {
    buildMarkdownPrompt(payload) {
        const lines = [];
        lines.push('# PROJECTBRAIN CONTEXT');
        lines.push('');
        lines.push('## TASK');
        lines.push(payload.task);
        lines.push('');
        lines.push('## PROJECT OVERVIEW');
        lines.push(payload.projectOverview);
        lines.push('');
        if (payload.relevantFiles.length > 0) {
            lines.push('## RELEVANT FILES');
            for (const file of payload.relevantFiles) {
                lines.push(`- **${file.filePath}**: ${file.summary}`);
            }
            lines.push('');
        }
        if (payload.doNotDuplicate.length > 0) {
            lines.push('## DO NOT DUPLICATE');
            for (const item of payload.doNotDuplicate) {
                lines.push(`- ${item}`);
            }
            lines.push('');
        }
        if (payload.projectConventions.length > 0) {
            lines.push('## PROJECT CONVENTIONS');
            for (const convention of payload.projectConventions) {
                lines.push(`- ${convention}`);
            }
            lines.push('');
        }
        if (payload.taskBoundaryNotice) {
            lines.push('## TASK BOUNDARY');
            lines.push(payload.taskBoundaryNotice);
            lines.push('');
        }
        if (payload.instructionsForAi.length > 0) {
            lines.push('## INSTRUCTIONS FOR AI');
            for (const inst of payload.instructionsForAi) {
                lines.push(`- ${inst}`);
            }
            lines.push('');
        }
        return lines.join('\n');
    }
}
//# sourceMappingURL=index.js.map