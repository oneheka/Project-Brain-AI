import * as vscode from 'vscode';
import { CoreBridge } from '../core-bridge';
import type { TaskSession, ProjectConvention } from '@projectbrain/shared';

export type TaskTreeItem = ActionItem | ConventionGroupItem | ConventionItem | SessionGroupItem | SessionItem | SessionDetailItem;

export class TasksTreeProvider implements vscode.TreeDataProvider<TaskTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TaskTreeItem | undefined | null | void> =
    new vscode.EventEmitter<TaskTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TaskTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor() {
    CoreBridge.onDidReindex(() => {
      this.refresh();
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TaskTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TaskTreeItem): Promise<TaskTreeItem[]> {
    const core = CoreBridge.getCore();
    if (!core) return [];

    await CoreBridge.ensureIndexed();

    if (!element) {
      const items: TaskTreeItem[] = [];

      // 1. Quick Actions
      items.push(new ActionItem('✨ Generate AI Context Prompt', 'projectbrain.generatePrompt', 'sparkle'));
      items.push(new ActionItem('▶️ Start New Task Session', 'projectbrain.startTask', 'play'));

      // 2. Conventions
      const conventions = core.detectConventions();
      if (conventions.length > 0) {
        items.push(new ConventionGroupItem(`Project Conventions (${conventions.length})`, conventions));
      }

      // 3. Task Sessions
      const allSessions = core.taskSessionManager.getAllSessions();
      const active = allSessions.filter(s => s.status === 'active');
      const completed = allSessions.filter(s => s.status === 'completed');

      if (active.length > 0) {
        items.push(new SessionGroupItem(`Active Sessions (${active.length})`, active, 'play-circle', vscode.TreeItemCollapsibleState.Expanded));
      }
      if (completed.length > 0) {
        items.push(new SessionGroupItem(`Completed Sessions (${completed.length})`, completed, 'check-all', vscode.TreeItemCollapsibleState.Collapsed));
      }

      return items;
    }

    if (element instanceof ConventionGroupItem) {
      return element.conventions.map(c => new ConventionItem(c));
    }

    if (element instanceof SessionGroupItem) {
      return element.sessions.map(s => new SessionItem(s));
    }

    if (element instanceof SessionItem) {
      const details: SessionDetailItem[] = [];
      for (const d of element.session.decisions) {
        details.push(new SessionDetailItem(`Decision: ${d}`, 'lightbulb'));
      }
      for (const c of element.session.constraints) {
        details.push(new SessionDetailItem(`Constraint: ${c}`, 'lock'));
      }
      for (const f of element.session.relevantFiles) {
        details.push(new SessionDetailItem(`File: ${f}`, 'file'));
      }
      if (details.length === 0) {
        details.push(new SessionDetailItem('No decisions or files recorded yet', 'info'));
      }
      return details;
    }

    return [];
  }
}

class ActionItem extends vscode.TreeItem {
  constructor(label: string, commandId: string, iconName: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon(iconName);
    this.command = {
      command: commandId,
      title: label
    };
  }
}

class ConventionGroupItem extends vscode.TreeItem {
  constructor(label: string, public readonly conventions: ProjectConvention[]) {
    super(label, vscode.TreeItemCollapsibleState.Expanded);
    this.iconPath = new vscode.ThemeIcon('book');
  }
}

class ConventionItem extends vscode.TreeItem {
  constructor(convention: ProjectConvention) {
    super(convention.title, vscode.TreeItemCollapsibleState.None);
    this.description = `[${convention.category.toUpperCase()}]`;
    this.tooltip = convention.description;
    this.iconPath = new vscode.ThemeIcon('symbol-rule');
  }
}

class SessionGroupItem extends vscode.TreeItem {
  constructor(
    label: string,
    public readonly sessions: TaskSession[],
    iconName: string,
    collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.iconPath = new vscode.ThemeIcon(iconName);
  }
}

class SessionItem extends vscode.TreeItem {
  constructor(public readonly session: TaskSession) {
    super(
      session.title,
      vscode.TreeItemCollapsibleState.Collapsed
    );

    const dateStr = new Date(session.createdAt).toLocaleDateString();
    this.description = `${dateStr} (${session.decisions.length} decisions, ${session.changedFiles.length} changes)`;
    this.iconPath = new vscode.ThemeIcon(session.status === 'active' ? 'record' : 'pass');
  }
}

class SessionDetailItem extends vscode.TreeItem {
  constructor(label: string, iconName: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon(iconName);
  }
}
