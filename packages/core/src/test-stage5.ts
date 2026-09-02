import * as path from 'node:path';
import { ProjectBrainCore } from './index';

async function main() {
  console.log('📦 [ProjectBrain Stage 5] Running Graph & Packaging Verification...\n');

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
  console.log('1. Indexing codebase for Dependency Graph...');
  const indexResult = await core.scanAndIndex();
  console.log(`   Indexed: ${indexResult.filesCount} files, ${indexResult.symbolsCount} symbols, ${indexResult.edgesCount} edges.\n`);

  // Step 2: Graph Data Extraction
  console.log('2. [Dependency Graph Webview Data]:');
  const graphData = core.graph.toData();
  const archModel = core.detectArchitecture();

  console.log(`   • Graph Nodes:  ${graphData.nodes.length}`);
  console.log(`   • Graph Edges:  ${graphData.edges.length}`);
  console.log(`   • Arch Layers:  ${archModel.layers.length}`);

  const fileNodes = graphData.nodes.filter(n => n.kind === 'file' || n.id.startsWith('file:'));
  console.log(`   • File Nodes:   ${fileNodes.length}`);
  console.log(`   • Symbol Nodes: ${graphData.nodes.length - fileNodes.length}\n`);

  // Step 3: Top Connected Modules
  console.log('3. [Top Connected Modules]:');
  const connectivity = fileNodes.map(n => {
    const inCount = core.graph.getIncomingEdges(n.id).length;
    const outCount = core.graph.getOutgoingEdges(n.id).length;
    return { id: n.id, inCount, outCount, total: inCount + outCount };
  }).sort((a, b) => b.total - a.total);

  for (const item of connectivity.slice(0, 5)) {
    console.log(`   🔗 ${item.id} (in: ${item.inCount}, out: ${item.outCount}, total: ${item.total})`);
  }
  console.log('');

  console.log('🎉 [ProjectBrain Stage 5] Graph Data Verified Successfully!');
}

main().catch(err => {
  console.error('❌ Stage 5 verification failed:', err);
  process.exit(1);
});
