import * as vscode from 'vscode';
import * as path from 'node:path';
import { CoreBridge } from '../core-bridge';
import type { DeadCodeItem, DuplicateCandidate } from '@projectbrain/shared';

export type QualityTreeItem = GroupItem | FindingItem | DuplicateItem;

export class QualityTreeProvider implements vscode.TreeDataProvider<QualityTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<QualityTreeItem | undefined | null | void> =
    new vscode.EventEmitter<QualityTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<QualityTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor() {
    CoreBridge.onDidReindex(() => {
      this.refresh();
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: QualityTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: QualityTreeItem): Promise<QualityTreeItem[]> {
    const core = CoreBridge.getCore();
    if (!core) return [];

    await CoreBridge.ensureIndexed();

    if (!element) {
      const deadCode = core.findDeadCode();
      const duplicates = await core.findDuplicates();

      const definitely = deadCode.filter(d => d.confidence === 'definitely');
      const probably = deadCode.filter(d => d.confidence === 'probably');
      const possibly = deadCode.filter(d => d.confidence === 'possibly');

      const items: GroupItem[] = [];

      if (deadCode.length === 0 && duplicates.length === 0) {
        return [new GroupItem('Clean Quality Audit (No Dead Code or Duplicates)', [], 'pass', vscode.TreeItemCollapsibleState.None)];
      }

      if (definitely.length > 0) {
        items.push(new GroupItem(`Definitely Unused Code (${definitely.length})`, definitely, 'error', vscode.TreeItemCollapsibleState.Expanded));
      }
      if (probably.length > 0) {
        items.push(new GroupItem(`Probably Unused Code (${probably.length})`, probably, 'warning', vscode.TreeItemCollapsibleState.Collapsed));
      }
      if (possibly.length > 0) {
        items.push(new GroupItem(`Possibly Unused Code (${possibly.length})`, possibly, 'info', vscode.TreeItemCollapsibleState.Collapsed));
      }
      if (duplicates.length > 0) {
        items.push(new GroupItem(`Duplicate Code Candidates (${duplicates.length})`, duplicates, 'copy', vscode.TreeItemCollapsibleState.Collapsed));
      }

      return items;
    }

    if (element instanceof GroupItem) {
      if (element.items.length === 0) return [];

      const first = element.items[0];
      if ('kind' in first) {
        // DeadCodeItem list
        return (element.items as DeadCodeItem[]).map(
          item => new FindingItem(item, core.workspace.rootPath)
        );
      } else if ('exactSimilarity' in first) {
        // DuplicateCandidate list
        return (element.items as DuplicateCandidate[]).map(
          item => new DuplicateItem(item, core.workspace.rootPath)
        );
      }
    }

    return [];
  }
}

class GroupItem extends vscode.TreeItem {
  constructor(
    label: string,
    public readonly items: (DeadCodeItem | DuplicateCandidate)[],
    iconName: string,
    collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.iconPath = new vscode.ThemeIcon(iconName);
  }
}

class FindingItem extends vscode.TreeItem {
  constructor(
    public readonly finding: DeadCodeItem,
    workspaceRoot: string
  ) {
    super(
      finding.reason,
      vscode.TreeItemCollapsibleState.None
    );

    const line = finding.span?.startLine ?? 1;
    this.description = `${finding.filePath}:${line}`;
    this.tooltip = `Kind: ${finding.kind}\nConfidence: ${finding.confidence} (${Math.round(finding.confidenceScore * 100)}%)\n${finding.reason}`;

    let iconName = 'trash';
    if (finding.kind === 'unused_file') iconName = 'file-submodule';
    else if (finding.kind === 'unused_export') iconName = 'export';
    else if (finding.kind === 'unused_import') iconName = 'package';

    this.iconPath = new vscode.ThemeIcon(iconName);

    this.command = {
      command: 'projectbrain.openFile',
      title: 'Jump to Dead Code',
      arguments: [path.join(workspaceRoot, finding.filePath), line]
    };
  }
}

class DuplicateItem extends vscode.TreeItem {
  constructor(
    public readonly duplicate: DuplicateCandidate,
    workspaceRoot: string
  ) {
    super(
      duplicate.evidence,
      vscode.TreeItemCollapsibleState.None
    );

    const sim = Math.round(duplicate.overallConfidence * 100);
    this.description = `${sim}% similarity`;
    this.tooltip = `${duplicate.evidence}\nSymbol A: ${duplicate.symbolA.name} in ${duplicate.symbolA.filePath}:${duplicate.symbolA.span.startLine}\nSymbol B: ${duplicate.symbolB.name} in ${duplicate.symbolB.filePath}:${duplicate.symbolB.span.startLine}`;
    this.iconPath = new vscode.ThemeIcon('copy');

    this.command = {
      command: 'projectbrain.openFile',
      title: 'Jump to Duplicate',
      arguments: [path.join(workspaceRoot, duplicate.symbolA.filePath), duplicate.symbolA.span.startLine]
    };
  }
}
