import { useCallback, useEffect, useRef } from "react";
import { useSerialPort } from "../../../serialport/useSerialPort";
import { useSerialMonitorStore } from "../store";

function stripVt100(text: string): string {
  return text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
}

const textDecoder = new TextDecoder("utf-8", { fatal: false });

export type UseSerialMonitorReturn = ReturnType<typeof useSerialPort>;

/** `useSerialPort` subscriber id; use for explicit `unsubscribe` when tearing down the quick scene. */
export const QS_SERIAL_MONITOR_SUBSCRIBER_ID = "qs-serial-monitor";

/**
 * Serial Monitor quick scene: WebSocket bridge only (`useSerialPort`).
 * Decodes incoming chunks to lines and appends to `serial-monitor-store`.
 */
export function useSerialMonitor(): UseSerialMonitorReturn {
  const appendLine = useSerialMonitorStore((s) => s.appendLine);
  const carryRef = useRef("");

  const onData = useCallback(
    (chunk: Uint8Array) => {
      if (!useSerialMonitorStore.getState().receivingEnabled) {
        return;
      }
      const piece = textDecoder.decode(chunk);
      const combined = carryRef.current + piece;
      const parts = combined.split(/\r\n|\n|\r/);
      carryRef.current = parts.pop() ?? "";
      for (const line of parts) {
        if (line.length > 0) {
          appendLine(stripVt100(line));
        }
      }
    },
    [appendLine],
  );

  const receivingEnabled = useSerialMonitorStore((s) => s.receivingEnabled);
  useEffect(() => {
    if (!receivingEnabled) {
      carryRef.current = "";
    }
  }, [receivingEnabled]);

  return useSerialPort(QS_SERIAL_MONITOR_SUBSCRIBER_ID, onData);
}
