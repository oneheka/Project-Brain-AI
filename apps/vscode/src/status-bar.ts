import * as vscode from 'vscode';
import { CoreBridge } from './core-bridge';
import type { ProjectHealthScore } from '@projectbrain/core';

export class ProjectBrainStatusBar {
  private statusBarItem: vscode.StatusBarItem;

  constructor(context: vscode.ExtensionContext) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'projectbrain.analyze';
    this.statusBarItem.text = '$(circuit-board) PB: Ready';
    this.statusBarItem.tooltip = 'Click to run full ProjectBrain analysis';
    this.statusBarItem.show();

    context.subscriptions.push(this.statusBarItem);

    CoreBridge.onDidReindex(() => {
      const score = CoreBridge.getCachedHealthScore();
      this.updateScore(score);
    });
  }

  public updateScore(score?: ProjectHealthScore): void {
    if (!score) {
      this.statusBarItem.text = '$(circuit-board) PB: Ready';
      this.statusBarItem.tooltip = 'Click to analyze codebase';
      this.statusBarItem.backgroundColor = undefined;
      return;
    }

    this.statusBarItem.text = `$(circuit-board) PB: ${score.overall}/100`;
    this.statusBarItem.tooltip = new vscode.MarkdownString(
      `### ProjectBrain Health: ${score.overall} / 100\n\n` +
      `- **Architecture**: ${score.architecture}/100\n` +
      `- **Code Quality**: ${score.codeQuality}/100\n` +
      `- **Security**: ${score.security}/100\n` +
      `- **Type Safety**: ${score.typeSafety}/100\n` +
      `- **Maintainability**: ${score.maintainability}/100\n` +
      `- **AI Readiness**: ${score.aiReadiness}/100\n\n` +
      `*Click to re-run analysis*`
    );

    if (score.overall < 50) {
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    } else if (score.overall < 75) {
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else {
      this.statusBarItem.backgroundColor = undefined;
    }
  }

  public showBusy(message = 'Analyzing...'): void {
    this.statusBarItem.text = `$(sync~spin) PB: ${message}`;
    this.statusBarItem.tooltip = 'Analysis in progress...';
  }
}
