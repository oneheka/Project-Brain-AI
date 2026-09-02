import * as fs from 'node:fs';
import * as path from 'node:path';
import type { TaskSession } from '@projectbrain/shared';
import type { GitAnalyzer } from '@projectbrain/git';

export class TaskSessionManager {
  private sessions = new Map<string, TaskSession>();
  private sessionsDir: string;

  constructor(
    storageRoot: string,
    private gitAnalyzer?: GitAnalyzer
  ) {
    this.sessionsDir = path.join(path.resolve(storageRoot), '.projectbrain', 'sessions');
    this.ensureDirectory();
    this.loadAllFromDisk();
  }

  create(title: string, options?: { relevantModules?: string[]; relevantFiles?: string[] }): TaskSession {
    const id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();

    const session: TaskSession = {
      id,
      title,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      relevantModules: options?.relevantModules ?? [],
      relevantFiles: options?.relevantFiles ?? [],
      decisions: [],
      changedFiles: [],
      constraints: []
    };

    this.sessions.set(id, session);
    this.saveToDisk(session);
    return session;
  }

  addDecision(sessionId: string, decision: string): TaskSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    session.decisions.push(decision);
    session.updatedAt = Date.now();
    this.saveToDisk(session);
    return session;
  }

  addConstraint(sessionId: string, constraint: string): TaskSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    session.constraints.push(constraint);
    session.updatedAt = Date.now();
    this.saveToDisk(session);
    return session;
  }

  addRelevantFile(sessionId: string, filePath: string): TaskSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const cleanPath = filePath.replace(/\\/g, '/');
    if (!session.relevantFiles.includes(cleanPath)) {
      session.relevantFiles.push(cleanPath);
      session.updatedAt = Date.now();
      this.saveToDisk(session);
    }
    return session;
  }

  trackChangedFiles(sessionId: string): string[] {
    const session = this.sessions.get(sessionId);
    if (!session || !this.gitAnalyzer) return [];

    const diff = this.gitAnalyzer.getDiff();
    const staged = this.gitAnalyzer.getDiff(true);

    const changedSet = new Set<string>(session.changedFiles);
    for (const d of [...diff, ...staged]) {
      changedSet.add(d.filePath);
    }

    session.changedFiles = Array.from(changedSet);
    session.updatedAt = Date.now();
    this.saveToDisk(session);

    return session.changedFiles;
  }

  finish(sessionId: string): TaskSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    this.trackChangedFiles(sessionId);
    session.status = 'completed';
    session.updatedAt = Date.now();
    this.saveToDisk(session);
    return session;
  }

  abandon(sessionId: string): TaskSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    session.status = 'abandoned';
    session.updatedAt = Date.now();
    this.saveToDisk(session);
    return session;
  }

  getSession(sessionId: string): TaskSession | undefined {
    return this.sessions.get(sessionId);
  }

  getActiveSessions(): TaskSession[] {
    return Array.from(this.sessions.values()).filter(s => s.status === 'active');
  }

  getAllSessions(): TaskSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  private saveToDisk(session: TaskSession): void {
    try {
      this.ensureDirectory();
      const filePath = path.join(this.sessionsDir, `${session.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf8');
    } catch {
      // Ignore disk write errors
    }
  }

  private loadAllFromDisk(): void {
    try {
      if (!fs.existsSync(this.sessionsDir)) return;
      const files = fs.readdirSync(this.sessionsDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const raw = fs.readFileSync(path.join(this.sessionsDir, file), 'utf8');
            const parsed = JSON.parse(raw) as TaskSession;
            if (parsed && parsed.id) {
              this.sessions.set(parsed.id, parsed);
            }
          } catch {
            // Ignore invalid JSON files
          }
        }
      }
    } catch {
      // Ignore directory read errors
    }
  }

  private ensureDirectory(): void {
    try {
      if (!fs.existsSync(this.sessionsDir)) {
        fs.mkdirSync(this.sessionsDir, { recursive: true });
      }
    } catch {
      // Ignore directory creation errors
    }
  }
}
