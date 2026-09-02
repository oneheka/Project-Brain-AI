import type { ArchitectureModel, ArchitectureLayer, ArchitectureLayerType } from '@projectbrain/shared';
import type { CodebaseIndex } from '@projectbrain/indexer';

export class ArchitectureDetector {
  detect(index: CodebaseIndex): ArchitectureModel {
    const files = index.getAllFiles();
    const layerMap = new Map<ArchitectureLayerType, { files: string[]; entryPoints: string[]; evidence: string[] }>();

    const ensureLayer = (type: ArchitectureLayerType) => {
      if (!layerMap.has(type)) {
        layerMap.set(type, { files: [], entryPoints: [], evidence: [] });
      }
      return layerMap.get(type)!;
    };

    for (const file of files) {
      const relPath = file.relativeFilePath;
      const isEntry = /index\.(ts|js|tsx|jsx)$/i.test(relPath) || /extension\.(ts|js)$/i.test(relPath) || /main\.(ts|js)$/i.test(relPath);

      // 1. Frontend / UI
      if (/(?:apps\/vscode|components\/|pages\/|views\/|ui\/|\.tsx|\.jsx)/i.test(relPath)) {
        const layer = ensureLayer('frontend');
        layer.files.push(relPath);
        if (isEntry) layer.entryPoints.push(relPath);
        if (layer.evidence.length === 0) layer.evidence.push('UI/Extension components & views');
      }

      // 2. Core & Backend logic
      if (/(?:packages\/core|packages\/analyzer|packages\/indexer|packages\/graph|services\/|controllers\/)/i.test(relPath)) {
        const layer = ensureLayer('backend');
        layer.files.push(relPath);
        if (isEntry) layer.entryPoints.push(relPath);
        if (layer.evidence.length === 0) layer.evidence.push('Core business logic, indexing and analysis engines');
      }

      // 3. Security
      if (/(?:packages\/security|auth|crypto|jwt|tokens)/i.test(relPath)) {
        const layer = ensureLayer('auth');
        layer.files.push(relPath);
        if (isEntry) layer.entryPoints.push(relPath);
        if (layer.evidence.length === 0) layer.evidence.push('Security auditing, credential scanning, token validators');
      }

      // 4. Shared / Domain contracts
      if (/(?:packages\/shared|types\/|models\/|interfaces\/)/i.test(relPath)) {
        const layer = ensureLayer('shared');
        layer.files.push(relPath);
        if (isEntry) layer.entryPoints.push(relPath);
        if (layer.evidence.length === 0) layer.evidence.push('Common domain models, interfaces, and DTO types');
      }
    }

    const layers: ArchitectureLayer[] = [];
    for (const [type, data] of layerMap.entries()) {
      if (data.files.length > 0) {
        layers.push({
          type,
          name: this.formatLayerName(type),
          confidence: 0.9,
          files: data.files,
          entryPoints: data.entryPoints,
          evidence: data.evidence
        });
      }
    }

    return {
      layers,
      flows: [
        {
          name: 'Analysis Workflow',
          steps: [
            { layer: 'frontend', symbolId: 'vscode.commands.registerCommand', description: 'User triggers analysis in IDE' },
            { layer: 'backend', symbolId: 'ProjectBrainCore.scanAndIndex', description: 'Core orchestrates scanning, indexing and graph building' },
            { layer: 'backend', symbolId: 'DeadCodeEngine.findDeadCode', description: 'Executes quality and dead code analysis' },
            { layer: 'auth', symbolId: 'SecretScanner.fullScan', description: 'Runs security and secret vulnerability audit' }
          ]
        }
      ]
    };
  }

  generateOverview(model: ArchitectureModel): string {
    const lines: string[] = [];

    lines.push('The codebase follows a modular multi-tier architecture with the following discovered layers:');
    for (const layer of model.layers) {
      lines.push(`- **${layer.name}** (${layer.type}): ${layer.files.length} files. Entry points: [${layer.entryPoints.slice(0, 3).join(', ')}]`);
      if (layer.evidence.length > 0) {
        lines.push(`  *Purpose:* ${layer.evidence.join('; ')}`);
      }
    }

    return lines.join('\n');
  }

  private formatLayerName(type: ArchitectureLayerType): string {
    switch (type) {
      case 'frontend': return 'Presentation & IDE Extension Layer';
      case 'backend': return 'Core Analysis & Domain Engine Layer';
      case 'api': return 'API & Protocol Routing Layer';
      case 'auth': return 'Security & Authentication Layer';
      case 'database': return 'Persistence & Database Layer';
      case 'shared': return 'Shared Models & Contracts Layer';
      default: return `${type.toUpperCase()} Layer`;
    }
  }
}
