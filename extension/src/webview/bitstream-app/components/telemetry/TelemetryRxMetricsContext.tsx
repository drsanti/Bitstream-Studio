import { createContext, useContext, type ReactNode } from "react";
import { useSerialBytesReadMetrics } from "./useSerialBytesReadMetrics.js";

export type TelemetryRxMetricsValue = ReturnType<typeof useSerialBytesReadMetrics>;

const TelemetryRxMetricsContext = createContext<TelemetryRxMetricsValue | null>(null);

/**
 * Single **`useSerialBytesReadMetrics`** instance for the Bitstream webview (wedge banner, auto-reconnect,
 * diagnostic log). Provider is mounted in **`BitstreamAppMain`** so floating windows and portals stay
 * under the same context.
 */
export function TelemetryRxMetricsProvider(props: { children: ReactNode }) {
  const value = useSerialBytesReadMetrics();
  return (
    <TelemetryRxMetricsContext.Provider value={value}>{props.children}</TelemetryRxMetricsContext.Provider>
  );
}

export function useTelemetryRxMetrics(): TelemetryRxMetricsValue {
  const ctx = useContext(TelemetryRxMetricsContext);
  if (ctx == null) {
    throw new Error("useTelemetryRxMetrics must be used within TelemetryRxMetricsProvider");
  }
  return ctx;
}
