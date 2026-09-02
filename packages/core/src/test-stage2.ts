import * as path from 'node:path';
import { ProjectBrainCore } from './index';

async function main() {
  console.log('🧪 [ProjectBrain Stage 2] Running Verification on ProjectBrain Codebase...\n');

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

  const indexResult = await core.scanAndIndex();
  console.log(`✅ Indexing completed: ${indexResult.filesCount} files, ${indexResult.symbolsCount} symbols, ${indexResult.edgesCount} edges.\n`);

  // 1. Dead Code Engine
  console.log('💀 --- 1. Dead Code Engine ---');
  const deadCodeItems = core.findDeadCode();
  const deadCodeStats = core.deadCodeEngine.getStats(deadCodeItems);
  console.log(`Total Findings: ${deadCodeStats.total}`);
  console.log(`  • Definitely: ${deadCodeStats.byConfidence.definitely}`);
  console.log(`  • Probably:   ${deadCodeStats.byConfidence.probably}`);
  console.log(`  • Possibly:   ${deadCodeStats.byConfidence.possibly}`);
  console.log('By Kind:', deadCodeStats.byKind);

  if (deadCodeItems.length > 0) {
    console.log('\nTop 5 Dead Code Findings:');
    for (const item of deadCodeItems.slice(0, 5)) {
      console.log(`  ⚠️ [${item.confidence.toUpperCase()}] ${item.filePath}`);
      console.log(`     Reason: ${item.reason}`);
    }
  }
  console.log('');

  // 2. Duplicate Detector
  console.log('👥 --- 2. Duplicate Detector ---');
  const duplicates = await core.findDuplicates();
  console.log(`Duplicate Pairs Found: ${duplicates.length}`);
  if (duplicates.length > 0) {
    for (const dup of duplicates.slice(0, 5)) {
      console.log(`  ⚡ [Confidence: ${dup.overallConfidence}] ${dup.evidence}`);
    }
  } else {
    console.log('  ✨ No code duplicates detected.');
  }
  console.log('');

  // 3. Security Scanner
  console.log('🛡️ --- 3. Security Scanner & Env Auditor ---');
  const securityReport = await core.runSecurityScan();
  console.log(`Overall Risk Level: ${securityReport.totalRisk.toUpperCase()}`);
  console.log(`Summary: Critical: ${securityReport.summary.critical}, High: ${securityReport.summary.high}, Medium: ${securityReport.summary.medium}, Low: ${securityReport.summary.low}`);
  console.log(`  • Content Findings:    ${securityReport.findings.length}`);
  console.log(`  • Env Audit Findings:  ${securityReport.envAudit.length}`);
  console.log(`  • Git History Findings: ${securityReport.gitHistoryFindings.length}`);

  if (securityReport.envAudit.length > 0) {
    console.log('\nEnv Audit Details:');
    for (const item of securityReport.envAudit) {
      console.log(`  🔒 [${item.risk.toUpperCase()}] ${item.filePath}: ${item.description}`);
    }
  }

  if (securityReport.findings.length > 0) {
    console.log('\nContent Secrets Details:');
    for (const item of securityReport.findings) {
      console.log(`  🔑 [${item.risk.toUpperCase()}] ${item.filePath}:${item.line}: ${item.description} (Masked: ${item.secretMasked})`);
    }
  }
  console.log('');

  // 4. Overall Health Score
  console.log('🩺 --- 4. Comprehensive Health Score ---');
  const healthScore = await core.calculateHealthScore();
  console.log(`Overall Score:     ${healthScore.overall} / 100`);
  console.log(`  • Code Quality:   ${healthScore.codeQuality} / 100`);
  console.log(`  • Architecture:   ${healthScore.architecture} / 100`);
  console.log(`  • Duplication:    ${healthScore.duplication} / 100`);
  console.log(`  • Security:       ${healthScore.security} / 100`);
  console.log(`  • Type Safety:    ${healthScore.typeSafety} / 100`);
  console.log(`  • Maintainability:${healthScore.maintainability} / 100`);
  console.log(`  • AI Readiness:   ${healthScore.aiReadiness} / 100\n`);

  console.log('🎉 [ProjectBrain Stage 2] Verification Finished Successfully!');
}

main().catch(err => {
  console.error('❌ Stage 2 verification failed:', err);
  process.exit(1);
});
