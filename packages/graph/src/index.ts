import type { DependencyNode, DependencyEdge, DependencyGraphData } from '@projectbrain/shared';

export interface GraphStats {
  nodesCount: number;
  edgesCount: number;
  fileNodesCount: number;
  symbolNodesCount: number;
  orphanNodesCount: number;
}

export class DependencyGraph {
  private nodes = new Map<string, DependencyNode>();
  private edges: DependencyEdge[] = [];
  private outEdges = new Map<string, DependencyEdge[]>();
  private inEdges = new Map<string, DependencyEdge[]>();

  addNode(node: DependencyNode): void {
    this.nodes.set(node.id, node);
  }

  addEdge(edge: DependencyEdge): void {
    this.edges.push(edge);

    const outList = this.outEdges.get(edge.sourceId) ?? [];
    outList.push(edge);
    this.outEdges.set(edge.sourceId, outList);

    const inList = this.inEdges.get(edge.targetId) ?? [];
    inList.push(edge);
    this.inEdges.set(edge.targetId, inList);
  }

  getNode(id: string): DependencyNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): DependencyNode[] {
    return Array.from(this.nodes.values());
  }

  getAllEdges(): DependencyEdge[] {
    return [...this.edges];
  }

  getIncomingEdges(nodeId: string): DependencyEdge[] {
    return this.inEdges.get(nodeId) ?? [];
  }

  getOutgoingEdges(nodeId: string): DependencyEdge[] {
    return this.outEdges.get(nodeId) ?? [];
  }

  getNodesByFile(filePath: string): DependencyNode[] {
    const cleanPath = filePath.replace(/\\/g, '/');
    return Array.from(this.nodes.values()).filter(n => n.filePath === cleanPath);
  }

  getOrphanNodes(): DependencyNode[] {
    const orphans: DependencyNode[] = [];
    for (const node of this.nodes.values()) {
      // Ignore root file entry points or declarations
      const incoming = this.inEdges.get(node.id) ?? [];
      const nonDeclareIncoming = incoming.filter(e => e.kind !== 'declares');
      if (nonDeclareIncoming.length === 0) {
        orphans.push(node);
      }
    }
    return orphans;
  }

  getTransitiveDependencies(nodeId: string, maxDepth = 20): Set<string> {
    const visited = new Set<string>();
    const queue: { id: string; depth: number }[] = [{ id: nodeId, depth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.id) || current.depth >= maxDepth) continue;
      visited.add(current.id);

      const outgoing = this.outEdges.get(current.id) ?? [];
      for (const edge of outgoing) {
        if (!visited.has(edge.targetId)) {
          queue.push({ id: edge.targetId, depth: current.depth + 1 });
        }
      }
    }

    visited.delete(nodeId);
    return visited;
  }

  hasCircularDependency(startNodeId: string): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recStack.add(nodeId);

      const outgoing = this.outEdges.get(nodeId) ?? [];
      for (const edge of outgoing) {
        if (edge.kind === 'declares') continue;
        if (!visited.has(edge.targetId)) {
          if (dfs(edge.targetId)) return true;
        } else if (recStack.has(edge.targetId)) {
          return true;
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    return dfs(startNodeId);
  }

  getStats(): GraphStats {
    let fileNodesCount = 0;
    let symbolNodesCount = 0;

    for (const node of this.nodes.values()) {
      if (node.kind === 'file') {
        fileNodesCount++;
      } else {
        symbolNodesCount++;
      }
    }

    return {
      nodesCount: this.nodes.size,
      edgesCount: this.edges.length,
      fileNodesCount,
      symbolNodesCount,
      orphanNodesCount: this.getOrphanNodes().length
    };
  }

  clear(): void {
    this.nodes.clear();
    this.edges = [];
    this.outEdges.clear();
    this.inEdges.clear();
  }

  toJSON(): DependencyGraphData {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: [...this.edges]
    };
  }

  toData(): DependencyGraphData {
    return this.toJSON();
  }
}
