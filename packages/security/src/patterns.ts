import type { SecretRisk } from '@projectbrain/shared';

export interface SecretPattern {
  id: string;
  name: string;
  category: 'ai' | 'cloud' | 'auth' | 'database' | 'webhook' | 'crypto' | 'generic';
  regex: RegExp;
  risk: SecretRisk;
  description: string;
}

export const SECRET_PATTERNS: SecretPattern[] = [
  // 1. AI API Keys
  {
    id: 'openai-api-key',
    name: 'OpenAI API Key',
    category: 'ai',
    regex: /\b(sk-[a-zA-Z0-9T3BlbkFJ]{20,})\b/g,
    risk: 'critical',
    description: 'Exposed OpenAI API key allows unauthorized API usage and billing.'
  },
  {
    id: 'anthropic-api-key',
    name: 'Anthropic Claude API Key',
    category: 'ai',
    regex: /\b(sk-ant-[a-zA-Z0-9_-]{30,})\b/g,
    risk: 'critical',
    description: 'Exposed Anthropic API key allows unauthorized Claude API usage.'
  },
  {
    id: 'google-ai-api-key',
    name: 'Google AI Studio / Gemini API Key',
    category: 'ai',
    regex: /\b(AIza[0-9A-Za-z-_]{35})\b/g,
    risk: 'critical',
    description: 'Exposed Google API key grants access to GCP / Gemini APIs.'
  },

  // 2. Cloud Providers
  {
    id: 'aws-access-key-id',
    name: 'AWS Access Key ID',
    category: 'cloud',
    regex: /\b((?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16})\b/g,
    risk: 'high',
    description: 'AWS IAM access key ID found in source code.'
  },
  {
    id: 'aws-secret-access-key',
    name: 'AWS Secret Access Key',
    category: 'cloud',
    regex: /(?:aws_secret_access_key|aws_secret_key)\s*[:=]\s*['"]([a-zA-Z0-9\/+=]{40})['"]/gi,
    risk: 'critical',
    description: 'AWS IAM secret access key grants full programmatic AWS access.'
  },
  {
    id: 'azure-storage-key',
    name: 'Azure Storage Account Key',
    category: 'cloud',
    regex: /(?:DefaultEndpointsProtocol=[^;]+;AccountName=[^;]+;AccountKey=([a-zA-Z0-9+/=]{80,}))/g,
    risk: 'critical',
    description: 'Azure Storage connection string with raw account key.'
  },

  // 3. Auth & VCS Tokens
  {
    id: 'github-personal-token',
    name: 'GitHub Personal Access Token',
    category: 'auth',
    regex: /\b(gh[pousr]_[A-Za-z0-9_]{36,255})\b/g,
    risk: 'critical',
    description: 'GitHub token grants direct repository and account access.'
  },
  {
    id: 'gitlab-token',
    name: 'GitLab Personal Access Token',
    category: 'auth',
    regex: /\b(glpat-[0-9a-zA-Z_\-]{20,})\b/g,
    risk: 'critical',
    description: 'GitLab Personal Access Token.'
  },
  {
    id: 'npm-access-token',
    name: 'NPM Access Token',
    category: 'auth',
    regex: /\b(npm_[A-Za-z0-9]{36})\b/g,
    risk: 'critical',
    description: 'NPM automation or publish token.'
  },

  // 4. Databases
  {
    id: 'mongodb-connection-string',
    name: 'MongoDB Connection URI with Credentials',
    category: 'database',
    regex: /(mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@[a-zA-Z0-9_.-]+)/gi,
    risk: 'critical',
    description: 'Hardcoded MongoDB connection URI containing username and password.'
  },
  {
    id: 'postgres-connection-string',
    name: 'PostgreSQL Connection URI with Password',
    category: 'database',
    regex: /(postgres(?:ql)?:\/\/[^:]+:[^@]+@[a-zA-Z0-9_.-]+(?::\d+)?\/[a-zA-Z0-9_.-]+)/gi,
    risk: 'critical',
    description: 'PostgreSQL database connection string with credentials.'
  },
  {
    id: 'mysql-connection-string',
    name: 'MySQL Connection URI with Password',
    category: 'database',
    regex: /(mysql:\/\/[^:]+:[^@]+@[a-zA-Z0-9_.-]+(?::\d+)?\/[a-zA-Z0-9_.-]+)/gi,
    risk: 'critical',
    description: 'MySQL database connection string with credentials.'
  },
  {
    id: 'redis-connection-string',
    name: 'Redis Connection URI with Password',
    category: 'database',
    regex: /(redis:\/\/[^:]*:[^@]+@[a-zA-Z0-9_.-]+(?::\d+)?)/gi,
    risk: 'high',
    description: 'Redis connection string with authentication password.'
  },

  // 5. Webhooks & Messaging
  {
    id: 'discord-webhook-url',
    name: 'Discord Webhook URL',
    category: 'webhook',
    regex: /(https:\/\/discord(?:app)?\.com\/api\/webhooks\/\d+\/[a-zA-Z0-9_\-]+)/g,
    risk: 'high',
    description: 'Exposed Discord webhook URL allows unauthorized message injection.'
  },
  {
    id: 'slack-webhook-url',
    name: 'Slack Incoming Webhook URL',
    category: 'webhook',
    regex: /(https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]+\/B[a-zA-Z0-9_]+\/[a-zA-Z0-9_]+)/g,
    risk: 'high',
    description: 'Slack incoming webhook URL.'
  },

  // 6. Private Keys & Crypto
  {
    id: 'private-key-block',
    name: 'Private Key Block (RSA/EC/SSH)',
    category: 'crypto',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
    risk: 'critical',
    description: 'Unencrypted private cryptographic key block.'
  },

  // 7. Generic Hardcoded Secrets & Passwords
  {
    id: 'hardcoded-password',
    name: 'Hardcoded Password in Assignment',
    category: 'generic',
    regex: /(?:password|passwd|db_password|secret_key|api_secret)\s*[:=]\s*['"]([^\s'"]{8,})['"]/gi,
    risk: 'high',
    description: 'Potential hardcoded password or secret key string.'
  },
  {
    id: 'jwt-token',
    name: 'Hardcoded JSON Web Token (JWT)',
    category: 'generic',
    regex: /\b(eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})\b/g,
    risk: 'medium',
    description: 'Hardcoded JWT authorization token.'
  }
];
