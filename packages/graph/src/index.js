export class DependencyGraph {
    nodes = new Map();
    edges = [];
    outEdges = new Map();
    inEdges = new Map();
    addNode(node) {
        this.nodes.set(node.id, node);
    }
    addEdge(edge) {
        this.edges.push(edge);
        const outList = this.outEdges.get(edge.sourceId) ?? [];
        outList.push(edge);
        this.outEdges.set(edge.sourceId, outList);
        const inList = this.inEdges.get(edge.targetId) ?? [];
        inList.push(edge);
        this.inEdges.set(edge.targetId, inList);
    }
    getNode(id) {
        return this.nodes.get(id);
    }
    getIncomingEdges(nodeId) {
        return this.inEdges.get(nodeId) ?? [];
    }
    getOutgoingEdges(nodeId) {
        return this.outEdges.get(nodeId) ?? [];
    }
    toJSON() {
        return {
            nodes: Array.from(this.nodes.values()),
            edges: [...this.edges]
        };
    }
}
//# sourceMappingURL=index.js.map