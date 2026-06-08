export const RAG_CONFIG = {
  chunkSize: 150,
  chunkOverlap: 20,
  topK: 5,
  embeddingModel: "text-embedding-004",
  embeddingDimension: 768,
  maxFileSizeBytes: 500 * 1024, // 500KB skip karo
  rateLimit: {
    requestsPerMinute: 60, // Google free tier
    batchSize: 10,         // ek baar mein kitni files
    delayBetweenBatchesMs: 1000,
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