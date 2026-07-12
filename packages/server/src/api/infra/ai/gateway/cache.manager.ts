/**
 * CacheManager — Redis-Backed Embedding Cache
 *
 * Features:
 * - SHA256-keyed cache in Redis (configurable TTL)
 * - In-flight deduplication: concurrent identical requests share one Promise
 * - Serializes/deserializes embedding arrays as JSON
 */

import type { Redis } from "ioredis";
import { sha256 } from "../utils/hashing";
import type { CacheConfig } from "../../../config/ai.config";

export class CacheManager {
  /** In-flight deduplication map: hash → ongoing Promise<number[]> */
  private readonly inFlight = new Map<string, Promise<number[]>>();

  constructor(
    private readonly redis: Redis,
    private readonly config: CacheConfig,
  ) {}

  private buildKey(text: string): string {
    return `${this.config.keyPrefix}:${sha256(text)}`;
  }

  /**
   * Attempt to read a cached embedding.
   * Returns null on cache miss.
   */
  async get(text: string): Promise<number[] | null> {
    try {
      const raw = await this.redis.get(this.buildKey(text));
      if (!raw) return null;
      return JSON.parse(raw) as number[];
    } catch {
      return null; // Cache failure is non-fatal — fall through to provider
    }
  }

  /**
   * Write an embedding to cache.
   */
  async set(text: string, embedding: number[]): Promise<void> {
    try {
      await this.redis.set(
        this.buildKey(text),
        JSON.stringify(embedding),
        "EX",
        this.config.ttlSeconds,
      );
    } catch {
      // Cache write failure is non-fatal
    }
  }

  /**
   * Deduplicate in-flight requests.
   *
   * If another coroutine is already computing the embedding for `text`,
   * this returns the same Promise — preventing duplicate API calls.
   */
  getOrComputeInFlight(
    text: string,
    compute: () => Promise<number[]>,
  ): Promise<number[]> {
    const hash = sha256(text);
    const existing = this.inFlight.get(hash);
    if (existing) return existing;

    const promise = compute().finally(() => {
      this.inFlight.delete(hash);
    });

    this.inFlight.set(hash, promise);
    return promise;
  }

  /** Returns true if an in-flight request exists for this text */
  isInFlight(text: string): boolean {
    return this.inFlight.has(sha256(text));
  }
}
