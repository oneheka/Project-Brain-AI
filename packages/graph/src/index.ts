import type { DependencyNode, DependencyEdge, DependencyGraphData } from '@projectbrain/shared';

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

  getIncomingEdges(nodeId: string): DependencyEdge[] {
    return this.inEdges.get(nodeId) ?? [];
  }

  getOutgoingEdges(nodeId: string): DependencyEdge[] {
    return this.outEdges.get(nodeId) ?? [];
  }

  toJSON(): DependencyGraphData {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: [...this.edges]
    };
  }
}
