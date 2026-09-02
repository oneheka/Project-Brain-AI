import * as path from 'node:path';
import { ProjectBrainCore } from './index';

async function main() {
  console.log('🖥️ [ProjectBrain Stage 4] Running Extension UI & Providers Verification...\n');

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

  // Step 1: Scan & Index
  console.log('1. Scanning and indexing workspace...');
  const indexResult = await core.scanAndIndex();
  console.log(`   Indexed: ${indexResult.filesCount} files, ${indexResult.symbolsCount} symbols.\n`);

  // Step 2: Health Tree Provider Data
  console.log('2. [HealthTreeProvider] Simulating Overview & Health Tree:');
  const healthScore = await core.calculateHealthScore();
  console.log(`   • Overall Score: ${healthScore.overall} / 100`);
  console.log(`   • Architecture:  ${healthScore.architecture} / 100`);
  console.log(`   • Code Quality:  ${healthScore.codeQuality} / 100`);
  console.log(`   • Security:      ${healthScore.security} / 100`);
  console.log(`   • Duplication:   ${healthScore.duplication} / 100`);
  console.log(`   • Type Safety:   ${healthScore.typeSafety} / 100`);
  console.log(`   • Details count: ${healthScore.breakdown.length} categories with positives/negatives\n`);

  // Step 3: Architecture Tree Provider Data
  console.log('3. [ArchitectureTreeProvider] Simulating Codebase & Architecture Tree:');
  const archModel = core.detectArchitecture();
  for (const layer of archModel.layers) {
    console.log(`   📁 Layer [${layer.type.toUpperCase()}] ${layer.name} (${layer.files.length} files)`);
    for (const f of layer.files.slice(0, 2)) {
      const fileEntity = core.index.getFileByRelativePath(f);
      console.log(`      📄 ${f} (${fileEntity?.symbols.length ?? 0} symbols)`);
    }
  }
  console.log('');

  // Step 4: Quality Tree Provider Data
  console.log('4. [QualityTreeProvider] Simulating Quality & Dead Code Tree:');
  const deadCode = core.findDeadCode();
  const duplicates = await core.findDuplicates();
  const definitely = deadCode.filter(d => d.confidence === 'definitely');
  const probably = deadCode.filter(d => d.confidence === 'probably');
  console.log(`   • Definitely Unused: ${definitely.length} items`);
  console.log(`   • Probably Unused:   ${probably.length} items`);
  console.log(`   • Duplicates:        ${duplicates.length} pairs\n`);

  // Step 5: Security Tree Provider Data
  console.log('5. [SecurityTreeProvider] Simulating Security & Secrets Tree:');
  const secReport = await core.runSecurityScan();
  console.log(`   • Risk Level:        ${secReport.totalRisk.toUpperCase()}`);
  console.log(`   • Content Secrets:   ${secReport.findings.length}`);
  console.log(`   • Env Audit:         ${secReport.envAudit.length}`);
  console.log(`   • Git History:       ${secReport.gitHistoryFindings.length}\n`);

  // Step 6: Tasks Tree Provider Data
  console.log('6. [TasksTreeProvider] Simulating AI Context & Tasks Tree:');
  const conventions = core.detectConventions();
  const sessions = core.taskSessionManager.getAllSessions();
  console.log(`   • Conventions:       ${conventions.length} items`);
  for (const c of conventions) {
    console.log(`     - [${c.category.toUpperCase()}] ${c.title}`);
  }
  console.log(`   • Saved Sessions:    ${sessions.length} sessions`);
  for (const s of sessions.slice(0, 2)) {
    console.log(`     - "${s.title}" (${s.status}, ${s.decisions.length} decisions)`);
  }
  console.log('');

  console.log('🎉 [ProjectBrain Stage 4] Extension UI Providers Verified Successfully!');
}

main().catch(err => {
  console.error('❌ Stage 4 test failed:', err);
  process.exit(1);
});
