import type { BitstreamTelemetryProviderSamplePayload } from "./map-provider-sample";

export const DEFAULT_PROVIDER_STALE_MS = 2000;

export type BitstreamTelemetryStalePayload = {
  sensor: string;
  lastHostMs: number;
  staleAfterMs: number;
};

export type ProviderStaleAfterMsResolver = (sensor: string) => number;

function normalizeStaleResolver(
  staleAfterMsOrResolver: number | ProviderStaleAfterMsResolver,
): ProviderStaleAfterMsResolver {
  if (typeof staleAfterMsOrResolver === "function") {
    return staleAfterMsOrResolver;
  }
  return () => staleAfterMsOrResolver;
}

/**
 * Emits at most one `bitstream:stale` per sensor until a fresh sample arrives.
 * Used by the public gateway and Course postMessage bridge.
 */
export class ProviderStaleTracker {
  private readonly resolveStaleAfterMs: ProviderStaleAfterMsResolver;
  private readonly lastHostMsBySensor = new Map<string, number>();
  private readonly staleEmitted = new Set<string>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    staleAfterMsOrResolver: number | ProviderStaleAfterMsResolver,
    private readonly onStale: (payload: BitstreamTelemetryStalePayload) => void,
    private readonly tickMs = 250,
  ) {
    this.resolveStaleAfterMs = normalizeStaleResolver(staleAfterMsOrResolver);
  }

  start(): void {
    if (this.timer != null) {
      return;
    }
    this.timer = setInterval(() => this.tick(), this.tickMs);
  }

  stop(): void {
    if (this.timer != null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  reset(): void {
    this.lastHostMsBySensor.clear();
    this.staleEmitted.clear();
  }

  noteSample(sample: Pick<BitstreamTelemetryProviderSamplePayload, "sensor" | "hostMs">): void {
    this.lastHostMsBySensor.set(sample.sensor, sample.hostMs);
    this.staleEmitted.delete(sample.sensor);
  }

  /** Test hook — evaluate stale at a synthetic clock (not for production callers). */
  evaluateStaleAt(nowMs: number): void {
    for (const [sensor, lastHostMs] of this.lastHostMsBySensor) {
      const staleAfterMs = this.resolveStaleAfterMs(sensor);
      if (nowMs - lastHostMs <= staleAfterMs) {
        continue;
      }
      if (this.staleEmitted.has(sensor)) {
        continue;
      }
      this.staleEmitted.add(sensor);
      this.onStale({
        sensor,
        lastHostMs,
        staleAfterMs,
      });
    }
  }

  private tick(): void {
    this.evaluateStaleAt(Date.now());
  }
}
