/**
 * Central AI Infrastructure Configuration
 *
 * All provider-specific settings, keys, timeouts, and priority order
 * are declared here. No other file should read process.env for AI keys.
 */

export interface ProviderConfig {
  readonly name: string;
  readonly apiKey: string | undefined;
  readonly timeoutMs: number;
  readonly enabled: boolean;
}

export interface RetryConfig {
  readonly maxAttempts: number;
  readonly delays: readonly number[]; // ms per attempt
  readonly retryableStatusCodes: readonly number[];
}

export interface CacheConfig {
  readonly ttlSeconds: number;
  readonly keyPrefix: string;
}

export interface AIConfig {
  readonly embedding: {
    readonly providers: readonly ProviderConfig[];
    readonly retry: RetryConfig;
    readonly cache: CacheConfig;
    /** After a failure, how long (ms) before a provider is retried */
    readonly unhealthyWindowMs: number;
  };
  readonly llm: {
    readonly providers: readonly ProviderConfig[];
    readonly retry: RetryConfig;
  };
}

const RETRY_DELAYS = [500, 1_000, 2_000] as const;
const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504] as const;

export const AI_CONFIG: AIConfig = {
  embedding: {
    /**
     * Priority order: first enabled + healthy provider wins.
     * Voyage is P1 — requires vector(1024) in PostgreSQL.
     */
    providers: [
      {
        name: "voyage",
        apiKey: process.env.VOYAGE_API_KEY,
        timeoutMs: 15_000,
        enabled: Boolean(process.env.VOYAGE_API_KEY),
      },
      {
        name: "jina",
        apiKey: process.env.JINA_API_KEY,
        timeoutMs: 15_000,
        enabled: Boolean(process.env.JINA_API_KEY),
      },
      {
        name: "cohere",
        apiKey: process.env.COHERE_API_KEY,
        timeoutMs: 15_000,
        enabled: Boolean(process.env.COHERE_API_KEY),
      },
      {
        name: "huggingface",
        apiKey: process.env.HF_API_KEY,
        timeoutMs: 20_000,
        enabled: Boolean(process.env.HF_API_KEY),
      },
      {
        name: "gemini",
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        timeoutMs: 15_000,
        enabled: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
      },
    ],

    retry: {
      maxAttempts: 3,
      delays: RETRY_DELAYS,
      retryableStatusCodes: RETRYABLE_STATUS_CODES,
    },

    cache: {
      ttlSeconds: 60 * 60 * 24, // 24 hours
      keyPrefix: "ai:embed",
    },

    unhealthyWindowMs: 5 * 60 * 1_000, // 5 minutes
  },

  llm: {
    providers: [
      {
        name: "gemini",
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        timeoutMs: 60_000,
        enabled: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
      },
      {
        name: "openrouter",
        apiKey: process.env.OPENROUTER_API_KEY,
        timeoutMs: 60_000,
        enabled: Boolean(process.env.OPENROUTER_API_KEY),
      },
      {
        name: "groq",
        apiKey: process.env.GROQ_API_KEY,
        timeoutMs: 30_000,
        enabled: Boolean(process.env.GROQ_API_KEY),
      },
      {
        name: "openai",
        apiKey: process.env.OPENAI_API_KEY,
        timeoutMs: 60_000,
        enabled: Boolean(process.env.OPENAI_API_KEY),
      },
      {
        name: "huggingface",
        apiKey: process.env.HF_API_KEY,
        timeoutMs: 60_000,
        enabled: Boolean(process.env.HF_API_KEY),
      },
    ],

    retry: {
      maxAttempts: 3,
      delays: RETRY_DELAYS,
      retryableStatusCodes: RETRYABLE_STATUS_CODES,
    },
  },
} as const;
