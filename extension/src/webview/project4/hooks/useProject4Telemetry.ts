import { useEffect, useRef, useState } from "react";
import { fetchProject4Telemetry } from "../lib/mcu-http";
import type { Project4TelemetrySnapshot } from "../lib/project4-telemetry-types";
import { useProject4SettingsStore } from "../settings/project4-settings.store";

export type Project4TelemetryStatus = "idle" | "live" | "stale" | "error";

export type UseProject4TelemetryOptions = {
  /** When false, polling stops and status returns to idle after cleanup. Default: true if base URL is non-empty. */
  enabled?: boolean;
};

export type UseProject4TelemetryResult = {
  status: Project4TelemetryStatus;
  snapshot: Project4TelemetrySnapshot | null;
  lastSampleAt: number | null;
  lastError: string | null;
  /** Twice the configured poll interval — matches HUD stale guidance in PROJECT_INFO.md. */
  staleThresholdMs: number;
};

export function useProject4Telemetry(
  options: UseProject4TelemetryOptions = {},
): UseProject4TelemetryResult {
  const telemetryPollIntervalMs = useProject4SettingsStore((s) => s.telemetryPollIntervalMs);
  const mcuBaseUrl = useProject4SettingsStore((s) => s.mcuBaseUrl);

  const effectiveEnabled =
    options.enabled !== undefined ? options.enabled : mcuBaseUrl.trim().length > 0;

  const [status, setStatus] = useState<Project4TelemetryStatus>("idle");
  const [snapshot, setSnapshot] = useState<Project4TelemetrySnapshot | null>(null);
  const [lastSampleAt, setLastSampleAt] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const pollMsRef = useRef(telemetryPollIntervalMs);
  pollMsRef.current = telemetryPollIntervalMs;

  const lastSampleAtRef = useRef<number | null>(null);
  lastSampleAtRef.current = lastSampleAt;

  const staleThresholdMs = Math.max(100, telemetryPollIntervalMs * 2);

  useEffect(() => {
    if (!effectiveEnabled) {
      setStatus("idle");
      return;
    }

    let cancelled = false;
    let inFlight = false;

    const pollOnce = async () => {
      if (cancelled || inFlight) {
        return;
      }
      inFlight = true;
      const settings = useProject4SettingsStore.getState();
      try {
        const next = await fetchProject4Telemetry(settings);
        if (cancelled) {
          return;
        }
        const now = Date.now();
        lastSampleAtRef.current = now;
        setLastSampleAt(now);
        setSnapshot(next);
        setLastError(null);
        setStatus("live");
      } catch (e) {
        if (cancelled) {
          return;
        }
        if (e instanceof DOMException && e.name === "AbortError") {
          return;
        }
        const msg = e instanceof Error ? e.message : String(e);
        setLastError(msg);
        setStatus("error");
      } finally {
        inFlight = false;
      }
    };

    void pollOnce();
    const id = window.setInterval(() => void pollOnce(), telemetryPollIntervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [effectiveEnabled, telemetryPollIntervalMs]);

  useEffect(() => {
    if (!effectiveEnabled) {
      return;
    }
    const tickMs = Math.min(250, Math.max(50, telemetryPollIntervalMs));
    const id = window.setInterval(() => {
      const last = lastSampleAtRef.current;
      const poll = pollMsRef.current;
      if (last == null) {
        return;
      }
      if (Date.now() - last > poll * 2) {
        setStatus((prev) => {
          if (prev === "error") {
            return prev;
          }
          return "stale";
        });
      }
    }, tickMs);
    return () => window.clearInterval(id);
  }, [effectiveEnabled, telemetryPollIntervalMs]);

  return {
    status,
    snapshot,
    lastSampleAt,
    lastError,
    staleThresholdMs,
  };
}
