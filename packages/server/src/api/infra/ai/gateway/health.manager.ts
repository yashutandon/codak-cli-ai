/**
 * HealthManager — Circuit Breaker for AI Providers
 *
 * Tracks per-provider health state in memory.
 * - Mark unhealthy on failure
 * - Skip unhealthy providers
 * - Auto-recover after configured window (default: 5 minutes)
 *
 * Singleton: one shared instance across the gateway.
 */

export interface ProviderHealth {
  name: string;
  healthy: boolean;
  markedUnhealthyAt?: number;
  failureCount: number;
}

export class HealthManager {
  private readonly state = new Map<string, ProviderHealth>();

  constructor(private readonly unhealthyWindowMs: number = 5 * 60 * 1_000) {}

  /**
   * Returns true if the provider is currently healthy.
   * Auto-recovers if unhealthy window has elapsed.
   */
  isHealthy(providerName: string): boolean {
    const entry = this.state.get(providerName);
    if (!entry || entry.healthy) return true;

    // Auto-recover after window
    if (
      entry.markedUnhealthyAt !== undefined &&
      Date.now() - entry.markedUnhealthyAt >= this.unhealthyWindowMs
    ) {
      this.markHealthy(providerName);
      return true;
    }

    return false;
  }

  markUnhealthy(providerName: string): void {
    const existing = this.state.get(providerName);
    this.state.set(providerName, {
      name: providerName,
      healthy: false,
      markedUnhealthyAt: Date.now(),
      failureCount: (existing?.failureCount ?? 0) + 1,
    });
    console.warn(
      `[HealthManager] Provider "${providerName}" marked UNHEALTHY — will retry in ${this.unhealthyWindowMs / 60_000}min`,
    );
  }

  markHealthy(providerName: string): void {
    const existing = this.state.get(providerName);
    this.state.set(providerName, {
      name: providerName,
      healthy: true,
      markedUnhealthyAt: undefined,
      failureCount: existing?.failureCount ?? 0,
    });
  }

  /** Snapshot of all tracked provider states — useful for debug endpoints */
  getSnapshot(): ProviderHealth[] {
    return Array.from(this.state.values());
  }
}
