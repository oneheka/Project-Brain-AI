import type { HeuristicTemplate } from '@projectbrain/templates';

export const BUILTIN_TEMPLATES: HeuristicTemplate[] = [
  {
    id: 'large-react-component',
    category: 'quality',
    description: 'Detects oversized React components with excessive state and responsibilities',
    weights: {
      lines: 0.2,
      symbol_count: 0.1,
      dependencies: 0.25,
      hooks: 0.1,
      state_count: 0.15,
      responsibilities: 0.2
    },
    threshold: 0.75
  },
  {
    id: 'unlayered-database-access',
    category: 'architecture',
    description: 'Detects direct database queries executed inside UI controllers or views',
    weights: {
      db_imports_in_ui: 0.5,
      missing_service_layer: 0.3,
      sql_in_component: 0.2
    },
    threshold: 0.7
  },
  {
    id: 'hardcoded-secret-candidate',
    category: 'security',
    description: 'Detects high-entropy string tokens resembling API keys or private certificates',
    weights: {
      entropy: 0.4,
      keyword_match: 0.3,
      untracked_env: 0.3
    },
    threshold: 0.65
  }
];
