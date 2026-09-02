import * as vscode from 'vscode';
import { CoreBridge } from '../core-bridge';
import type { HealthScoreCategory } from '@projectbrain/shared';

export type HealthTreeItem = CategoryItem | DetailItem;

export class HealthTreeProvider implements vscode.TreeDataProvider<HealthTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<HealthTreeItem | undefined | null | void> =
    new vscode.EventEmitter<HealthTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<HealthTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor() {
    CoreBridge.onDidReindex(() => {
      this.refresh();
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: HealthTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: HealthTreeItem): Promise<HealthTreeItem[]> {
    const core = CoreBridge.getCore();
    if (!core) return [];

    const score = await CoreBridge.ensureIndexed();
    if (!score) return [];

    if (!element) {
      // Root level items
      const items: HealthTreeItem[] = [];

      // 1. Overall Score banner
      const overallIcon = score.overall >= 80 ? 'pass-filled' : score.overall >= 50 ? 'warning' : 'error';
      const overallItem = new CategoryItem(
        `Overall Health: ${score.overall} / 100`,
        `Overall codebase readiness: ${score.overall >= 80 ? 'Great' : score.overall >= 50 ? 'Needs Attention' : 'Critical Issues'}`,
        vscode.TreeItemCollapsibleState.None,
        overallIcon
      );
      items.push(overallItem);

      // 2. Metrics categories
      const categories: { label: string; score: number; key: keyof typeof score; icon: string }[] = [
        { label: 'Architecture', score: score.architecture, key: 'architecture', icon: 'type-hierarchy' },
        { label: 'Code Quality', score: score.codeQuality, key: 'codeQuality', icon: 'check-all' },
        { label: 'Security & Secrets', score: score.security, key: 'security', icon: 'shield' },
        { label: 'Duplication', score: score.duplication, key: 'duplication', icon: 'copy' },
        { label: 'Type Safety', score: score.typeSafety, key: 'typeSafety', icon: 'symbol-interface' },
        { label: 'Maintainability', score: score.maintainability, key: 'maintainability', icon: 'tools' },
        { label: 'AI Readiness', score: score.aiReadiness, key: 'aiReadiness', icon: 'sparkle' }
      ];

      for (const cat of categories) {
        const breakdown = score.breakdown?.find(b => b.category.toLowerCase() === cat.key.toLowerCase());
        const hasDetails = breakdown && (breakdown.positives.length > 0 || breakdown.negatives.length > 0);

        items.push(
          new CategoryItem(
            `${cat.label}: ${cat.score} / 100`,
            undefined,
            hasDetails ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
            cat.icon,
            breakdown
          )
        );
      }

      return items;
    }

    if (element instanceof CategoryItem && element.breakdown) {
      const details: DetailItem[] = [];

      for (const pos of element.breakdown.positives) {
        details.push(new DetailItem(pos, 'pass', 'positive'));
      }
      for (const neg of element.breakdown.negatives) {
        details.push(new DetailItem(neg, 'warning', 'negative'));
      }

      return details;
    }

    return [];
  }
}

class CategoryItem extends vscode.TreeItem {
  constructor(
    public override readonly label: string,
    public override readonly description?: string,
    public override readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
    iconName?: string,
    public readonly breakdown?: HealthScoreCategory
  ) {
    super(label, collapsibleState);
    if (iconName) {
      this.iconPath = new vscode.ThemeIcon(iconName);
    }
  }
}

class DetailItem extends vscode.TreeItem {
  constructor(
    public override readonly label: string,
    iconName: string,
    public readonly type: 'positive' | 'negative'
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon(iconName);
  }
}
