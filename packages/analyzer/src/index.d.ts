import type { DeadCodeItem, DuplicateCandidate, FileEntity } from '@projectbrain/shared';
import type { DependencyGraph } from '@projectbrain/graph';
import type { CodebaseIndex } from '@projectbrain/indexer';
export declare class DeadCodeEngine {
    findDeadCode(index: CodebaseIndex, graph: DependencyGraph): DeadCodeItem[];
}
export declare class DuplicateDetector {
    findDuplicates(_files: FileEntity[]): DuplicateCandidate[];
}
//# sourceMappingURL=index.d.ts.map