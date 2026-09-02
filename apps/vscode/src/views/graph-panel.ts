import * as vscode from 'vscode';
import * as path from 'node:path';
import { CoreBridge } from '../core-bridge';
import { getGraphWebviewHtml } from './graph-html';

export class DependencyGraphPanel {
  public static currentPanel: DependencyGraphPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel) {
    this.panel = panel;
    this.update();

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // Handle messages from Webview
    this.panel.webview.onDidReceiveMessage(
      async message => {
        switch (message.command) {
          case 'openFile': {
            const core = CoreBridge.getCore();
            if (core && message.filePath) {
              const fullPath = path.isAbsolute(message.filePath)
                ? message.filePath
                : path.join(core.workspace.rootPath, message.filePath);
              await vscode.commands.executeCommand('projectbrain.openFile', fullPath, 1);
            }
            break;
          }
        }
      },
      null,
      this.disposables
    );

    // Refresh when reindexed
    CoreBridge.onDidReindex(() => {
      this.update();
    });
  }

  public static createOrShow(): void {
    const column = vscode.window.activeTextEditor
      ? vscode.ViewColumn.Beside
      : vscode.ViewColumn.One;

    if (DependencyGraphPanel.currentPanel) {
      DependencyGraphPanel.currentPanel.panel.reveal(column);
      DependencyGraphPanel.currentPanel.update();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'projectbrain.dependencyGraph',
      'ProjectBrain: Dependency Graph',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    DependencyGraphPanel.currentPanel = new DependencyGraphPanel(panel);
  }

  private update(): void {
    const core = CoreBridge.getCore();
    if (!core) return;

    const graphData = core.graph.toData();
    const archModel = core.detectArchitecture();

    this.panel.webview.html = getGraphWebviewHtml(graphData, archModel);
  }

  public dispose(): void {
    DependencyGraphPanel.currentPanel = undefined;
    this.panel.dispose();

    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}
