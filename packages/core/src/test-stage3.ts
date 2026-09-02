import * as path from 'node:path';
import { ProjectBrainCore } from './index';

async function main() {
  console.log('🚀 [ProjectBrain Stage 3] Running Verification on ProjectBrain Codebase...\n');

  const workspaceRoot = path.resolve(process.cwd());
  const core = new ProjectBrainCore({
    rootPath: workspaceRoot,
    config: {
      analysis: {
        include: ['packages/**', 'apps/**', 'template-pack/**'],
        exclude: ['node_modules/**', 'dist/**', '.git/**', '.agents/**']
      },
      ai: {
        mode: 'offline'
      },
      rules: {
        autoGenerate: true
      }
    }
  });

  // Step 1: Scan and Index
  const indexResult = await core.scanAndIndex();
  console.log(`✅ Indexing completed: ${indexResult.filesCount} files, ${indexResult.symbolsCount} symbols, ${indexResult.edgesCount} edges.\n`);

  // Step 2: Architecture Discovery
  console.log('🏗️ --- 1. Architecture Discovery ---');
  const archModel = core.detectArchitecture();
  console.log(`Discovered ${archModel.layers.length} Architecture Layers:`);
  for (const layer of archModel.layers) {
    console.log(`  • [${layer.type.toUpperCase()}] ${layer.name} (${layer.files.length} files)`);
    console.log(`    Entry points: [${layer.entryPoints.slice(0, 2).join(', ')}]`);
  }
  console.log('');

  // Step 3: Project Conventions
  console.log('📐 --- 2. Project Conventions Auto-Detection ---');
  const conventions = core.detectConventions();
  console.log(`Detected ${conventions.length} Codebase Conventions:`);
  for (const conv of conventions) {
    console.log(`  • [${conv.category.toUpperCase()}] ${conv.title} (evidence: ${conv.evidenceCount})`);
    console.log(`    ${conv.description}`);
  }
  console.log('');

  // Step 4: AI Context Prompt Generation
  console.log('🧠 --- 3. Intelligent AI Context Prompt Generator ---');
  const testTask = 'Implement custom rule validation in RuleEngine for TypeScript AST';
  const generatedPrompt = core.generateContextPrompt(testTask);
  console.log(`Generated Prompt Preview for task: "${testTask}" (${generatedPrompt.length} chars):\n`);
  console.log('----------------------------------------');
  console.log(generatedPrompt.slice(0, 950) + '\n... [truncated for preview]');
  console.log('----------------------------------------\n');

  // Step 5: Git Analyzer
  console.log('🌿 --- 4. Git Analyzer ---');
  const gitStatus = core.gitAnalyzer.getStatus();
  const branch = core.gitAnalyzer.getCurrentBranch();
  const commits = core.gitAnalyzer.getRecentCommits(3);
  console.log(`Git Repository: ${core.gitAnalyzer.isGitRepository() ? 'YES' : 'NO'}`);
  console.log(`Current Branch: ${branch}`);
  console.log(`Status Clean:   ${gitStatus.isClean ? 'YES' : 'NO'}`);
  console.log(`Staged Files:   ${gitStatus.stagedFiles.length}`);
  console.log(`Modified Files: ${gitStatus.modifiedFiles.length}`);
  console.log(`Recent Commits:`);
  for (const c of commits) {
    console.log(`  • [${c.hash.slice(0, 7)}] ${c.message} (by ${c.author})`);
  }
  console.log('');

  // Step 6: Task Session Manager
  console.log('📝 --- 5. Task Session Lifecycle & Persistence ---');
  const session = core.startTaskSession('Stage 3 Task Session Verification', {
    relevantModules: ['@projectbrain/ai', '@projectbrain/rules', '@projectbrain/git'],
    relevantFiles: ['packages/ai/src/context-collector.ts', 'packages/rules/src/convention-detector.ts']
  });
  console.log(`Created Session: [${session.id}] "${session.title}" (status: ${session.status})`);

  core.taskSessionManager.addDecision(session.id, 'Use token-budgeted prompt compilation for LLM context');
  core.taskSessionManager.addConstraint(session.id, 'Do not commit unmasked secrets');
  core.taskSessionManager.addRelevantFile(session.id, 'packages/git/src/index.ts');

  const finishedSession = core.finishTaskSession(session.id);
  console.log(`Finished Session: [${finishedSession?.id}] (status: ${finishedSession?.status}, decisions: ${finishedSession?.decisions.length}, constraints: ${finishedSession?.constraints.length})`);
  console.log(`Active Sessions Remaining: ${core.taskSessionManager.getActiveSessions().length}`);
  console.log('');

  console.log('🎉 [ProjectBrain Stage 3] Verification Finished Successfully!');
}

main().catch(err => {
  console.error('❌ Stage 3 verification failed:', err);
  process.exit(1);
});
