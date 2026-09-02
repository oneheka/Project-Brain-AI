import * as crypto from 'node:crypto';

export class CodeNormalizer {
  /**
   * Normalizes source code for exact clone hash comparison:
   * 1. Strips comments (// and / * ... * /)
   * 2. Replaces string literals with "$STR"
   * 3. Replaces numeric literals with "$NUM"
   * 4. Normalizes whitespace
   */
  static normalizeForHashing(code: string): string {
    let normalized = code;

    // Remove multi-line comments
    normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove single-line comments
    normalized = normalized.replace(/\/\/.*$/gm, '');
    // Replace double-quoted and single-quoted strings
    normalized = normalized.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '"$STR"');
    // Replace template literals
    normalized = normalized.replace(/`[\s\S]*?`/g, '`$STR`');
    // Replace numbers
    normalized = normalized.replace(/\b\d+(?:\.\d+)?\b/g, '$NUM');
    // Collapse whitespace
    normalized = normalized.replace(/\s+/g, ' ').trim();

    return normalized;
  }

  /**
   * Generates a SHA-256 hash of normalized code.
   */
  static hash(normalized: string): string {
    return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
  }

  /**
   * Normalizes source code into a clean array of statement/line tokens for structural LCS comparison.
   */
  static normalizeForStructural(code: string): string[] {
    const rawLines = code.split('\n');
    const cleanedLines: string[] = [];

    for (const line of rawLines) {
      const trimmed = line.trim();
      // Skip empty or comment-only lines
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        continue;
      }
      // Normalize internal tokens
      const normalizedLine = trimmed
        .replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '"$STR"')
        .replace(/\b\d+\b/g, '$NUM')
        .replace(/\s+/g, ' ');

      cleanedLines.push(normalizedLine);
    }

    return cleanedLines;
  }

  /**
   * Calculates Longest Common Subsequence (LCS) similarity between two token arrays.
   * Returns a similarity ratio between 0.0 and 1.0.
   */
  static calculateLcsSimilarity(tokensA: string[], tokensB: string[]): number {
    const m = tokensA.length;
    const n = tokensB.length;

    if (m === 0 && n === 0) return 1.0;
    if (m === 0 || n === 0) return 0.0;

    // Fast path: if identical
    if (m === n && tokensA.every((t, i) => t === tokensB[i])) {
      return 1.0;
    }

    // Space-optimized LCS matrix
    const prev = new Uint16Array(n + 1);
    const curr = new Uint16Array(n + 1);

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (tokensA[i - 1] === tokensB[j - 1]) {
          curr[j] = prev[j - 1] + 1;
        } else {
          curr[j] = Math.max(prev[j], curr[j - 1]);
        }
      }
      prev.set(curr);
    }

    const lcsLength = curr[n];
    return (2.0 * lcsLength) / (m + n);
  }
}
