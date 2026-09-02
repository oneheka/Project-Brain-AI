import * as vscode from 'vscode';
import { CoreBridge } from './core-bridge';
import { HealthTreeProvider } from './providers/health-tree-provider';
import { ArchitectureTreeProvider } from './providers/architecture-tree-provider';
import { QualityTreeProvider } from './providers/quality-tree-provider';
import { SecurityTreeProvider } from './providers/security-tree-provider';
import { TasksTreeProvider } from './providers/tasks-tree-provider';
import { ProjectBrainStatusBar } from './status-bar';
import { registerAllCommands } from './commands';

export function activate(context: vscode.ExtensionContext) {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const rootPath = workspaceFolders && workspaceFolders.length > 0
      ? workspaceFolders[0].uri.fsPath
      : process.cwd();

    console.log('[ProjectBrain] Activating in workspace:', rootPath);

    // 1. Initialize Core Bridge
    CoreBridge.initialize(rootPath);

    // 2. Register TreeView Providers
    const healthProvider = new HealthTreeProvider();
    const archProvider = new ArchitectureTreeProvider();
    const qualityProvider = new QualityTreeProvider();
    const securityProvider = new SecurityTreeProvider();
    const tasksProvider = new TasksTreeProvider();

    context.subscriptions.push(
      vscode.window.registerTreeDataProvider('projectbrain.overview', healthProvider),
      vscode.window.registerTreeDataProvider('projectbrain.codebase', archProvider),
      vscode.window.registerTreeDataProvider('projectbrain.quality', qualityProvider),
      vscode.window.registerTreeDataProvider('projectbrain.security', securityProvider),
      vscode.window.registerTreeDataProvider('projectbrain.ai', tasksProvider)
    );

    // 3. Initialize Status Bar
    const statusBar = new ProjectBrainStatusBar(context);

    // 4. Register All Commands
    registerAllCommands(context, statusBar);

    // 5. Trigger Initial Background Indexing (Non-blocking)
    CoreBridge.ensureIndexed()
      .then(() => {
        console.log('[ProjectBrain] Initial indexing completed successfully.');
      })
      .catch(err => {
        console.warn('[ProjectBrain] Initial indexing warning:', err);
      });

    console.log('[ProjectBrain] Extension activated successfully.');
  } catch (err) {
    console.error('[ProjectBrain] Error activating extension:', err);
  }
}

export function deactivate() {
  CoreBridge.dispose();
}
