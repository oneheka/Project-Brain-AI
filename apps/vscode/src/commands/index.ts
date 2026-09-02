import * as vscode from 'vscode';
import { CoreBridge } from '../core-bridge';
import type { ProjectBrainStatusBar } from '../status-bar';

export function registerAllCommands(
  context: vscode.ExtensionContext,
  statusBar: ProjectBrainStatusBar
): void {
  // 1. Analyze Project
  const analyzeCmd = vscode.commands.registerCommand('projectbrain.analyze', async () => {
    statusBar.showBusy('Scanning...');
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'ProjectBrain: Analyzing codebase...',
        cancellable: false
      },
      async progress => {
        progress.report({ increment: 20, message: 'Parsing AST and indexing files...' });
        const score = await CoreBridge.reindex();
        progress.report({ increment: 80, message: 'Computing architecture & health...' });

        if (score) {
          vscode.window.showInformationMessage(
            `ProjectBrain: Analysis complete! Overall Health: ${score.overall}/100`
          );
        }
      }
    );
  });

  // 2. Find Dead Code QuickPick
  const deadCodeCmd = vscode.commands.registerCommand('projectbrain.findDeadCode', async () => {
    const core = CoreBridge.getCore();
    if (!core) return;

    await CoreBridge.ensureIndexed();
    const deadCode = core.findDeadCode();

    if (deadCode.length === 0) {
      vscode.window.showInformationMessage('ProjectBrain: No dead code detected. Codebase is clean! ✨');
      return;
    }

    const items = deadCode.map(d => ({
      label: `[${d.confidence.toUpperCase()}] ${d.filePath}:${d.span?.startLine ?? 1}`,
      description: d.reason,
      detail: `Kind: ${d.kind} (${Math.round(d.confidenceScore * 100)}% confidence)`,
      finding: d
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: `Found ${deadCode.length} unused symbols. Select to jump to code:`
    });

    if (selected) {
      const line = selected.finding.span?.startLine ?? 1;
      const fullPath = `${core.workspace.rootPath}/${selected.finding.filePath}`;
      await vscode.commands.executeCommand('projectbrain.openFile', fullPath, line);
    }
  });

  // 3. Generate AI Prompt
  const generatePromptCmd = vscode.commands.registerCommand('projectbrain.generatePrompt', async () => {
    const core = CoreBridge.getCore();
    if (!core) return;

    await CoreBridge.ensureIndexed();

    const task = await vscode.window.showInputBox({
      prompt: 'Describe the feature, refactoring, or bug you want AI to work on:',
      placeHolder: 'e.g. Implement rate limiting middleware with Redis store'
    });

    if (!task) return;

    statusBar.showBusy('Compiling Context...');
    const prompt = core.generateContextPrompt(task);
    await vscode.env.clipboard.writeText(prompt);

    statusBar.updateScore(CoreBridge.getCachedHealthScore());
    vscode.window.showInformationMessage(
      `ProjectBrain: AI Context Prompt (${prompt.length} chars) generated and copied to clipboard! 📋`
    );
  });

  // 4. Start Task Session
  const startTaskCmd = vscode.commands.registerCommand('projectbrain.startTask', async () => {
    const core = CoreBridge.getCore();
    if (!core) return;

    const title = await vscode.window.showInputBox({
      prompt: 'Enter title for the new Task Session:',
      placeHolder: 'e.g. Refactor Auth Tokens & JWT rotation'
    });

    if (!title) return;

    const session = core.startTaskSession(title);
    CoreBridge.reindex();
    vscode.window.showInformationMessage(`ProjectBrain: Task session "${session.title}" active.`);
  });

  // 5. Finish Task Session
  const finishTaskCmd = vscode.commands.registerCommand('projectbrain.finishTask', async () => {
    const core = CoreBridge.getCore();
    if (!core) return;

    const session = core.getActiveTaskSession();
    if (!session) {
      vscode.window.showInformationMessage('ProjectBrain: No active task session to finish.');
      return;
    }

    core.finishTaskSession(session.id);
    CoreBridge.reindex();
    vscode.window.showInformationMessage(`ProjectBrain: Task session "${session.title}" completed!`);
  });

  // 6. Security Report QuickPick
  const securityReportCmd = vscode.commands.registerCommand('projectbrain.showSecurityReport', async () => {
    const core = CoreBridge.getCore();
    if (!core) return;

    const report = await core.runSecurityScan();
    const allFindings = [...report.findings, ...report.envAudit, ...report.gitHistoryFindings];

    if (allFindings.length === 0) {
      vscode.window.showInformationMessage('ProjectBrain: Clean security audit! 0 exposed secrets or vulnerable .env files.');
      return;
    }

    const items = allFindings.map(f => ({
      label: `[${f.risk.toUpperCase()}] ${f.filePath}:${f.line ?? 1}`,
      description: f.description,
      detail: `Type: ${f.type} (Masked: ${f.secretMasked})`,
      finding: f
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: `Security Risk: ${report.totalRisk.toUpperCase()} (${allFindings.length} findings). Select to jump:`
    });

    if (selected) {
      const fullPath = `${core.workspace.rootPath}/${selected.finding.filePath}`;
      await vscode.commands.executeCommand('projectbrain.openFile', fullPath, selected.finding.line ?? 1);
    }
  });

  // 7. Open File Helper Command
  const openFileCmd = vscode.commands.registerCommand(
    'projectbrain.openFile',
    async (filePath: string, line = 1) => {
      try {
        const uri = vscode.Uri.file(filePath);
        const doc = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(doc);
        const pos = new vscode.Position(Math.max(0, line - 1), 0);
        editor.selection = new vscode.Selection(pos, pos);
        editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
      } catch (err) {
        vscode.window.showErrorMessage(`ProjectBrain: Could not open file ${filePath}`);
      }
    }
  );

  // 8. Refresh All Views
  const refreshAllCmd = vscode.commands.registerCommand('projectbrain.refreshAll', async () => {
    await CoreBridge.reindex();
    vscode.window.showInformationMessage('ProjectBrain: Views refreshed.');
  });

  // 9. Review AI Changes
  const reviewCmd = vscode.commands.registerCommand('projectbrain.reviewAiChanges', async () => {
    const core = CoreBridge.getCore();
    if (!core) return;

    const status = core.gitAnalyzer.getStatus();
    const diff = core.gitAnalyzer.getDiff();

    if (status.isClean) {
      vscode.window.showInformationMessage('ProjectBrain: Working directory is clean. No uncommitted changes to review.');
      return;
    }

    const items = diff.map(d => ({
      label: `[${d.status.toUpperCase()}] ${d.filePath}`,
      description: d.oldPath ? `Renamed from ${d.oldPath}` : 'Changed file',
      diff: d
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: `Reviewing ${diff.length} modified/added files. Select to inspect:`
    });

    if (selected) {
      const fullPath = `${core.workspace.rootPath}/${selected.diff.filePath}`;
      await vscode.commands.executeCommand('projectbrain.openFile', fullPath, 1);
    }
  });

  context.subscriptions.push(
    analyzeCmd,
    deadCodeCmd,
    generatePromptCmd,
    startTaskCmd,
    finishTaskCmd,
    securityReportCmd,
    openFileCmd,
    refreshAllCmd,
    reviewCmd
  );
}
