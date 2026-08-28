import type { DependencyNode, DependencyEdge, DependencyGraphData } from '@projectbrain/shared';
export declare class DependencyGraph {
    private nodes;
    private edges;
    private outEdges;
    private inEdges;
    addNode(node: DependencyNode): void;
    addEdge(edge: DependencyEdge): void;
    getNode(id: string): DependencyNode | undefined;
    getIncomingEdges(nodeId: string): DependencyEdge[];
    getOutgoingEdges(nodeId: string): DependencyEdge[];
    toJSON(): DependencyGraphData;
}
//# sourceMappingURL=index.d.ts.map