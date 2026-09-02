import * as path from 'node:path';
import { ProjectBrainCore } from './index';

async function main() {
  console.log('🧠 [ProjectBrain] Starting self-scan verification test...\n');

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

  const startTime = Date.now();
  const result = await core.scanAndIndex();
  const elapsed = Date.now() - startTime;

  console.log(`✅ Indexing completed in ${elapsed}ms (${result.durationMs}ms internal)\n`);

  const stats = core.index.getStats();
  const graphStats = core.graph.getStats();
  const healthScore = await core.calculateHealthScore();
  const deadCode = core.findDeadCode();

  console.log('📊 Codebase Statistics:');
  console.log(`   • Indexed Files:  ${stats.filesCount}`);
  console.log(`   • Total Symbols:  ${stats.symbolsCount}`);
  console.log(`   • Total Lines:    ${stats.totalLines}`);
  console.log(`   • Codebase Size:  ${(stats.totalSizeBytes / 1024).toFixed(1)} KB\n`);

  console.log('🏷️  Symbols Breakdown by Kind:');
  for (const [kind, count] of Object.entries(stats.symbolsByKind)) {
    console.log(`   • ${kind.padEnd(14)}: ${count}`);
  }
  console.log('');

  console.log('🕸️  Dependency Graph:');
  console.log(`   • Total Nodes:    ${graphStats.nodesCount}`);
  console.log(`   • File Nodes:     ${graphStats.fileNodesCount}`);
  console.log(`   • Symbol Nodes:   ${graphStats.symbolNodesCount}`);
  console.log(`   • Total Edges:    ${graphStats.edgesCount}`);
  console.log(`   • Orphan Nodes:   ${graphStats.orphanNodesCount}\n`);

  console.log('🩺 Project Health Score:');
  console.log(`   • Overall:        ${healthScore.overall} / 100`);
  console.log(`   • Architecture:   ${healthScore.architecture} / 100`);
  console.log(`   • Code Quality:   ${healthScore.codeQuality} / 100`);
  console.log(`   • Security:       ${healthScore.security} / 100`);
  console.log(`   • AI Readiness:   ${healthScore.aiReadiness} / 100\n`);

  if (deadCode.length > 0) {
    console.log(`🔍 Potentially Unused Symbols (${deadCode.length}):`);
    for (const item of deadCode.slice(0, 5)) {
      console.log(`   ⚠ [${item.confidence}] ${item.filePath}: ${item.reason}`);
    }
    if (deadCode.length > 5) {
      console.log(`   ... and ${deadCode.length - 5} more.`);
    }
  } else {
    console.log('✨ No dead code items detected!');
  }

  console.log('\n🚀 Stage 1 verification passed successfully!');
}

main().catch(err => {
  console.error('❌ Self-scan failed with error:', err);
  process.exit(1);
});
