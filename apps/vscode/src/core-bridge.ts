import * as vscode from 'vscode';
import { ProjectBrainCore, type ProjectHealthScore } from '@projectbrain/core';

export class CoreBridge {
  private static coreInstance?: ProjectBrainCore;
  private static isIndexingInProgress = false;
  private static cachedHealthScore?: ProjectHealthScore;

  private static readonly _onDidReindex = new vscode.EventEmitter<void>();
  public static readonly onDidReindex = CoreBridge._onDidReindex.event;

  public static initialize(rootPath: string): ProjectBrainCore {
    this.coreInstance = new ProjectBrainCore({
      rootPath,
      config: {
        analysis: {
          include: ['src/**', 'packages/**', 'apps/**', 'lib/**', 'components/**', 'pages/**', 'routes/**'],
          exclude: ['node_modules/**', 'dist/**', 'out/**', 'build/**', '.git/**', '.agents/**', '.projectbrain/**']
        },
        ai: {
          mode: 'offline'
        },
        rules: {
          autoGenerate: true
        }
      }
    });

    return this.coreInstance;
  }

  public static getCore(): ProjectBrainCore | undefined {
    return this.coreInstance;
  }

  public static isInitialized(): boolean {
    return !!this.coreInstance;
  }

  public static getCachedHealthScore(): ProjectHealthScore | undefined {
    return this.cachedHealthScore;
  }

  public static async ensureIndexed(): Promise<ProjectHealthScore | undefined> {
    if (!this.coreInstance) return undefined;
    if (this.cachedHealthScore) return this.cachedHealthScore;
    return await this.reindex();
  }

  public static async reindex(): Promise<ProjectHealthScore | undefined> {
    if (!this.coreInstance || this.isIndexingInProgress) {
      return this.cachedHealthScore;
    }

    this.isIndexingInProgress = true;
    try {
      await this.coreInstance.scanAndIndex();
      this.cachedHealthScore = await this.coreInstance.calculateHealthScore();
      this._onDidReindex.fire();
      return this.cachedHealthScore;
    } finally {
      this.isIndexingInProgress = false;
    }
  }

  public static dispose(): void {
    this._onDidReindex.dispose();
    this.coreInstance = undefined;
    this.cachedHealthScore = undefined;
  }
}
