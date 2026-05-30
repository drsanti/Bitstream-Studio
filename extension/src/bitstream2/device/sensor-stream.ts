/**
 * Per-sensor periodic EVT_SENSOR emission (device / firmware side).
 */

export type SensorStreamTick = () => void;

export class SensorStreamScheduler {
  private readonly timers = new Map<number, ReturnType<typeof setInterval>>();

  /** Start or replace stream for sensorId. intervalMs <= 0 clears the stream. */
  setStream(sensorId: number, intervalMs: number, tick: SensorStreamTick): void {
    this.clear(sensorId);
    if (intervalMs <= 0) return;
    const ms = Math.max(1, Math.floor(intervalMs));
    const timer = setInterval(tick, ms);
    this.timers.set(sensorId, timer);
  }

  isActive(sensorId: number): boolean {
    return this.timers.has(sensorId);
  }

  clear(sensorId: number): void {
    const t = this.timers.get(sensorId);
    if (t != null) {
      clearInterval(t);
      this.timers.delete(sensorId);
    }
  }

  clearAll(): void {
    for (const id of [...this.timers.keys()]) {
      this.clear(id);
    }
  }

  activeSensorIds(): number[] {
    return [...this.timers.keys()].sort((a, b) => a - b);
  }
}
