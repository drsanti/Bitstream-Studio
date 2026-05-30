import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBitstreamConnectionStore } from "../../state/bitstreamConnection.store.js";

const NOW_TICK_MS = 400;

/**
 * Smoothed **`bytesRead`** rate and last-increase time from **`serialBridgeStatus`** (same math as
 * `BitstreamBridgeSerialRxBadge`). Shared by wedge detection, auto-reconnect, and optional diagnostic logs.
 */
export function useSerialBytesReadMetrics(): {
  nowMs: number;
  displayBps: number | null;
  lastBytesIncreaseAtMs: () => number | null;
  serialOpen: boolean;
  bytesRead: number;
} {
  const serial = useBitstreamConnectionStore((s) => s.serialBridgeStatus);
  const serialOpen = serial?.isOpen === true;
  const bytesRead = serial?.bytesRead ?? 0;

  const [nowMs, setNowMs] = useState(() => Date.now());
  const tickRef = useRef<{ bytesRead: number; atMs: number }>({ bytesRead: 0, atMs: Date.now() });
  const prevBytesRef = useRef<number | null>(null);
  const lastBytesIncreaseAtRef = useRef<number | null>(null);
  const [displayBps, setDisplayBps] = useState<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), NOW_TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (serial?.isOpen !== true) {
      prevBytesRef.current = null;
      lastBytesIncreaseAtRef.current = null;
      return;
    }
    const prev = prevBytesRef.current;
    if (prev != null && bytesRead > prev) {
      lastBytesIncreaseAtRef.current = Date.now();
    }
    prevBytesRef.current = bytesRead;
  }, [bytesRead, serial?.isOpen]);

  useEffect(() => {
    if (serial?.isOpen === true) {
      const br = serial.bytesRead ?? 0;
      tickRef.current = { bytesRead: br, atMs: Date.now() };
      prevBytesRef.current = br;
      lastBytesIncreaseAtRef.current = Date.now();
      setDisplayBps(null);
    }
  }, [serial?.path, serial?.isOpen]);

  useEffect(() => {
    if (serial?.isOpen !== true) {
      setDisplayBps(null);
      return;
    }
    const now = nowMs;
    const prev = tickRef.current;
    const dtSec = (now - prev.atMs) / 1000;
    if (dtSec < 0.25) {
      return;
    }
    const delta = bytesRead - prev.bytesRead;
    const bps = delta / dtSec;
    setDisplayBps(Number.isFinite(bps) ? Math.max(0, bps) : null);
    tickRef.current = { bytesRead, atMs: now };
  }, [bytesRead, nowMs, serial?.isOpen]);

  const lastBytesIncreaseAtMs = useCallback(() => lastBytesIncreaseAtRef.current, []);

  return useMemo(
    () => ({
      nowMs,
      displayBps,
      lastBytesIncreaseAtMs,
      serialOpen,
      bytesRead,
    }),
    [nowMs, displayBps, lastBytesIncreaseAtMs, serialOpen, bytesRead],
  );
}
