export const RAG_CONFIG = {
  chunkSize: 150,
  chunkOverlap: 20,
  topK: 5,
  /**
   * Primary embedding model served by Voyage AI (P1 provider).
   * Dimension MUST match the PostgreSQL vector column:
   *   voyage-code-3   → 1024 (current after migration)
   *   gemini-embedding-001 → 3072 (original, kept as fallback reference)
   */
  embeddingModel: "voyage-code-3",
  embeddingDimension: 1024,
  maxFileSizeBytes: 500 * 1024,
  rateLimit: {
    requestsPerMinute: 15,
    batchSize: 3,
    delayBetweenBatchesMs: 5000,
    retryDelayMs: 65_000, // 429 pe wait
  },
  supportedExtensions: [
    ".ts", ".tsx", ".js", ".jsx",
    ".py", ".go", ".rs", ".java", ".cpp", ".c",
    ".md", ".json", ".yaml", ".yml", ".toml",
  ],
  ignoredDirs: [
    "node_modules", ".git", "dist", "build",
    ".next", "coverage", "__pycache__", ".cache",
    ".turbo", "out", ".vercel",
  ],
  ignoredFiles: [
    ".env", ".env.local", ".env.*",
    "*.lock", "*.log", "*.min.js",
    "*.min.css", "*.map",
  ],
} as const;