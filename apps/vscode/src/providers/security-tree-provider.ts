import * as vscode from 'vscode';
import * as path from 'node:path';
import { CoreBridge } from '../core-bridge';
import type { SecretFinding, SecurityReport } from '@projectbrain/core';

export type SecurityTreeItem = SecurityOverviewItem | SecurityGroupItem | SecretFindingItem;

export class SecurityTreeProvider implements vscode.TreeDataProvider<SecurityTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<SecurityTreeItem | undefined | null | void> =
    new vscode.EventEmitter<SecurityTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<SecurityTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private cachedReport?: SecurityReport;

  constructor() {
    CoreBridge.onDidReindex(() => {
      this.cachedReport = undefined;
      this.refresh();
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SecurityTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: SecurityTreeItem): Promise<SecurityTreeItem[]> {
    const core = CoreBridge.getCore();
    if (!core) return [];

    await CoreBridge.ensureIndexed();

    if (!this.cachedReport) {
      this.cachedReport = await core.runSecurityScan();
    }

    const report = this.cachedReport;

    if (!element) {
      const items: SecurityTreeItem[] = [];

      // 1. Overall Risk Banner
      const riskIcon = report.totalRisk === 'critical' ? 'error' : report.totalRisk === 'high' ? 'warning' : 'shield';
      items.push(new SecurityOverviewItem(`Security Risk Level: ${report.totalRisk.toUpperCase()}`, `Total findings: ${report.findings.length + report.envAudit.length + report.gitHistoryFindings.length}`, riskIcon));

      // 2. Sections
      if (report.findings.length > 0) {
        items.push(new SecurityGroupItem(`Content Secrets (${report.findings.length})`, report.findings, 'key', vscode.TreeItemCollapsibleState.Expanded));
      }
      if (report.envAudit.length > 0) {
        items.push(new SecurityGroupItem(`Environment Files Audit (${report.envAudit.length})`, report.envAudit, 'file-lock', vscode.TreeItemCollapsibleState.Expanded));
      }
      if (report.gitHistoryFindings.length > 0) {
        items.push(new SecurityGroupItem(`Git History Findings (${report.gitHistoryFindings.length})`, report.gitHistoryFindings, 'git-commit', vscode.TreeItemCollapsibleState.Collapsed));
      }

      if (items.length === 1) {
        // Only banner, no findings
        items.push(new SecurityOverviewItem('Clean Security Audit (0 Exposed Secrets)', 'No credentials or untracked .env files detected', 'pass'));
      }

      return items;
    }

    if (element instanceof SecurityGroupItem) {
      return element.findings.map(f => new SecretFindingItem(f, core.workspace.rootPath));
    }

    return [];
  }
}

class SecurityOverviewItem extends vscode.TreeItem {
  constructor(label: string, description: string, iconName: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.iconPath = new vscode.ThemeIcon(iconName);
  }
}

class SecurityGroupItem extends vscode.TreeItem {
  constructor(
    label: string,
    public readonly findings: SecretFinding[],
    iconName: string,
    collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.iconPath = new vscode.ThemeIcon(iconName);
  }
}

class SecretFindingItem extends vscode.TreeItem {
  constructor(
    public readonly finding: SecretFinding,
    workspaceRoot: string
  ) {
    super(
      finding.description,
      vscode.TreeItemCollapsibleState.None
    );

    const line = finding.line ?? 1;
    this.description = `[${finding.risk.toUpperCase()}] ${finding.filePath}:${line}`;
    this.tooltip = `Type: ${finding.type}\nRisk: ${finding.risk}\nMasked: ${finding.secretMasked}\n${finding.description}`;

    const iconName = finding.risk === 'critical' ? 'error' : finding.risk === 'high' ? 'warning' : 'info';
    this.iconPath = new vscode.ThemeIcon(iconName);

    this.command = {
      command: 'projectbrain.openFile',
      title: 'Open Secret Location',
      arguments: [path.join(workspaceRoot, finding.filePath), line]
    };
  }
}
