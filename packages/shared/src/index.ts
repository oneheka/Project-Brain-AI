/**
 * @projectbrain/shared
 * Core domain types, interfaces and DTOs for ProjectBrain.
 */

// ==========================================
// 1. Symbol & Codebase Entities
// ==========================================

export type SymbolKind =
  | 'file'
  | 'module'
  | 'function'
  | 'class'
  | 'method'
  | 'interface'
  | 'type'
  | 'variable'
  | 'constant'
  | 'component'
  | 'hook'
  | 'route'
  | 'controller'
  | 'service'
  | 'repository'
  | 'database_model'
  | 'table';

export interface LocationSpan {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface SymbolEntity {
  id: string; // e.g. "symbol:src/auth/AuthService.ts:authenticate"
  name: string;
  kind: SymbolKind;
  filePath: string;
  span: LocationSpan;
  isExported: boolean;
  isDefaultExport?: boolean;
  referencesCount: number;
  docstring?: string;
  signature?: string;
}

export interface FileEntity {
  filePath: string;
  relativeFilePath: string;
  extension: string;
  sizeBytes: number;
  linesCount: number;
  symbols: SymbolEntity[];
  imports: ImportDeclaration[];
  exports: ExportDeclaration[];
  lastModifiedMs: number;
}

export interface ImportDeclaration {
  source: string; // imported module path / specifier
  specifiers: {
    importedName: string;
    localName: string;
    isTypeOnly?: boolean;
    isDefault?: boolean;
    isNamespace?: boolean;
  }[];
  span: LocationSpan;
}

export interface ExportDeclaration {
  name: string;
  isDefault: boolean;
  isTypeOnly?: boolean;
  span: LocationSpan;
}

// ==========================================
// 2. Dependency Graph
// ==========================================

export type DependencyEdgeKind =
  | 'imports'
  | 'calls'
  | 'implements'
  | 'extends'
  | 'routes_to'
  | 'delegates_to'
  | 'queries'
  | 'declares';

export interface DependencyNode {
  id: string;
  label: string;
  kind: SymbolKind | 'file' | 'module';
  filePath?: string;
  metadata?: Record<string, unknown>;
}

export interface DependencyEdge {
  id: string;
  sourceId: string;
  targetId: string;
  kind: DependencyEdgeKind;
  evidence: string; // Explanation or code snippet why this connection exists
}

export interface DependencyGraphData {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

// ==========================================
// 3. Architecture Discovery
// ==========================================

export type ArchitectureLayerType =
  | 'frontend'
  | 'backend'
  | 'api'
  | 'auth'
  | 'database'
  | 'storage'
  | 'messaging'
  | 'workers'
  | 'infrastructure'
  | 'shared';

export interface ArchitectureLayer {
  type: ArchitectureLayerType;
  name: string;
  confidence: number; // 0.0 - 1.0
  files: string[];
  entryPoints: string[];
  evidence: string[];
}

export interface ArchitectureModel {
  layers: ArchitectureLayer[];
  flows: {
    name: string;
    steps: {
      layer: ArchitectureLayerType;
      symbolId: string;
      description: string;
    }[];
  }[];
}

// ==========================================
// 4. Quality, Dead Code & Duplicates
// ==========================================

export type ConfidenceLevel = 'definitely' | 'probably' | 'possibly';

export interface DeadCodeItem {
  id: string;
  symbolId?: string;
  filePath: string;
  kind: 'unused_symbol' | 'unused_file' | 'unused_import' | 'unused_export' | 'unreachable_code' | 'dead_route' | 'dead_css';
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0.0 - 1.0
  reason: string;
  span?: LocationSpan;
}

export interface DuplicateCandidate {
  id: string;
  symbolA: SymbolEntity;
  symbolB: SymbolEntity;
  exactSimilarity: number;
  structuralSimilarity: number;
  semanticSimilarity?: number;
  overallConfidence: number;
  evidence: string;
}

// ==========================================
// 5. Diagnostics & Compiler Health
// ==========================================

export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint';

export interface DiagnosticItem {
  id: string;
  source: 'typescript' | 'eslint' | 'stylelint' | 'projectbrain' | 'security';
  message: string;
  severity: DiagnosticSeverity;
  filePath: string;
  span: LocationSpan;
  ruleId?: string;
  fixable?: boolean;
  rootCauseId?: string; // For grouping cascading compiler errors
}

// ==========================================
// 6. Project Conventions & Rules
// ==========================================

export type RuleStatus = 'detected' | 'approved' | 'ignored';

export interface ProjectConvention {
  id: string;
  category: 'imports' | 'exports' | 'naming' | 'styles' | 'structure' | 'components';
  title: string;
  description: string;
  status: RuleStatus;
  evidenceCount: number;
  ruleDefinition?: Record<string, unknown>;
}

// ==========================================
// 7. Security Scanner
// ==========================================

export type SecretRisk = 'low' | 'medium' | 'high' | 'critical';

export interface SecretFinding {
  id: string;
  type: 'api_key' | 'token' | 'password' | 'private_key' | 'env_untracked' | 'secret_in_git_history';
  filePath: string;
  line?: number;
  secretMasked: string; // e.g. "sk-proj-****"
  risk: SecretRisk;
  description: string;
  commitHash?: string;
}

// ==========================================
// 8. Health Scores
// ==========================================

export interface HealthScoreCategory {
  category: string;
  score: number;
  positives: string[];
  negatives: string[];
}

export interface ProjectHealthScore {
  overall: number; // 0 - 100
  architecture: number;
  codeQuality: number;
  security: number;
  typeSafety: number;
  duplication: number;
  maintainability: number;
  aiReadiness: number;
  breakdown: HealthScoreCategory[];
}

// ==========================================
// 9. AI Task Session & Context Builder
// ==========================================

export interface TaskSession {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'abandoned';
  createdAt: number;
  updatedAt: number;
  relevantModules: string[];
  relevantFiles: string[];
  decisions: string[];
  changedFiles: string[];
  constraints: string[];
}

export interface PromptContextPayload {
  task: string;
  projectOverview: string;
  relevantFiles: { filePath: string; summary: string }[];
  relevantSymbols: string[];
  architectureOverview: string;
  existingImplementations: string[];
  projectConventions: string[];
  knownProblems: string[];
  doNotDuplicate: string[];
  taskBoundaryNotice: string;
  instructionsForAi: string[];
}

// ==========================================
// 10. ProjectBrain Configuration
// ==========================================

export interface ProjectBrainConfig {
  analysis: {
    include: string[];
    exclude: string[];
  };
  ai: {
    mode: 'offline' | 'local' | 'cloud' | 'automatic';
    ollamaEndpoint?: string;
    localModel?: string;
  };
  rules: {
    autoGenerate: boolean;
  };
}
