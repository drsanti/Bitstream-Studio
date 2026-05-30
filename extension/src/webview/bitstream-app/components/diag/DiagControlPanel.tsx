import { useCallback, useEffect, useRef, useState } from "react";
import {
  clampDiagStreamIntervalMs,
  clampDiagStreamSliderMs,
} from "../../constants/diagStreamIntervals";
import { useBitstreamAppControl } from "../../BitstreamAppWrapper";
import { DiagControlCard } from "./DiagControlCard";
import type { DiagControlAckState } from "./types";
import { useBitstreamDiagStore } from "../../state/bitstreamDiag.store";
import { useBitstreamDiagControlStore } from "../../state/bitstreamDiagControl.store";

export function DiagControlPanel(props: {
  collapsed: boolean;
  onCollapsedChange: (next: boolean) => void;
  /** Notifies parent when diagnostics stream toggle changes (for snapshot visibility). */
  onDiagnosticsStreamEnabledChange?: (enabled: boolean) => void;
}) {
  const { collapsed, onCollapsedChange, onDiagnosticsStreamEnabledChange } = props;
  const { startDiagStream, stopDiagStream, getDiagSnapshot, setDiagTaskStreamConfig } = useBitstreamAppControl();
  const setSnapshot = useBitstreamDiagStore((s) => s.setSnapshot);
  const {
    streamEnabled, globalPeriodMs, taskPeriodMs, maxRowsPerBatch, resyncPeriodMs, priorityMode,
    setStreamEnabled, setGlobalPeriodMs, setTaskPeriodMs, setMaxRowsPerBatch, setResyncPeriodMs, setPriorityMode,
  } = useBitstreamDiagControlStore();
  const [loading, setLoading] = useState(false);
  const [ackState, setAckState] = useState<DiagControlAckState>("idle");
  const [ackMessage, setAckMessage] = useState("Idle");

  const streamEnabledRef = useRef(streamEnabled);
  const globalPeriodMsRef = useRef(globalPeriodMs);
  const taskPeriodMsRef = useRef(taskPeriodMs);
  streamEnabledRef.current = streamEnabled;
  globalPeriodMsRef.current = globalPeriodMs;
  taskPeriodMsRef.current = taskPeriodMs;

  useEffect(() => {
    onDiagnosticsStreamEnabledChange?.(streamEnabled);
  }, [streamEnabled, onDiagnosticsStreamEnabledChange]);

  const runWithAck = useCallback(async (fn: () => Promise<{ ok: boolean; message: string }>) => {
    setLoading(true);
    setAckState("pending");
    setAckMessage("ACK pending");
    const result = await fn();
    setAckState(result.ok ? "ok" : "error");
    setAckMessage(result.message || (result.ok ? "ACK OK" : "ACK ERR"));
    setLoading(false);
    return result;
  }, []);

  const onToggleStream = useCallback(
    (enabled: boolean) => {
      if (loading) {
        return;
      }
      if (enabled && streamEnabledRef.current) {
        return;
      }
      if (!enabled && !streamEnabledRef.current) {
        return;
      }
      /** Must update before `setStreamEnabled` re-render; slider `onChange` can fire in the same gesture. */
      streamEnabledRef.current = enabled;
      setStreamEnabled(enabled);
      if (enabled) {
        void runWithAck(async () =>
          startDiagStream(
            clampDiagStreamIntervalMs(globalPeriodMsRef.current),
            clampDiagStreamIntervalMs(taskPeriodMsRef.current),
          ),
        ).then((res) => {
          if (!res.ok) {
            streamEnabledRef.current = false;
            setStreamEnabled(false);
          }
        });
        return;
      }
      void runWithAck(stopDiagStream).then((res) => {
        if (!res.ok) {
          streamEnabledRef.current = true;
          setStreamEnabled(true);
        }
      });
    },
    [loading, runWithAck, startDiagStream, stopDiagStream],
  );

  // Do not auto-enable diagnostics stream on mount; user controls this explicitly.

  // Fallback: when stream is OFF, poll snapshot so users still see basic metrics.
  useEffect(() => {
    if (collapsed) {
      return;
    }
    if (streamEnabled) {
      return;
    }
    const timer = window.setInterval(() => {
      void getDiagSnapshot().then((snapshot) => {
        if (snapshot) {
          setSnapshot(snapshot);
        }
      });
    }, 2000);
    return () => window.clearInterval(timer);
  }, [collapsed, getDiagSnapshot, setSnapshot, streamEnabled]);

  const onGlobalPeriodChange = useCallback(
    (v: number) => {
      const next = clampDiagStreamSliderMs(v);
      setGlobalPeriodMs(next);
      if (!streamEnabledRef.current) {
        return;
      }
      void runWithAck(async () =>
        startDiagStream(
          clampDiagStreamIntervalMs(next),
          clampDiagStreamIntervalMs(taskPeriodMsRef.current),
        ),
      );
    },
    [runWithAck, startDiagStream],
  );

  const onTaskPeriodChange = useCallback(
    (v: number) => {
      const next = clampDiagStreamSliderMs(v);
      setTaskPeriodMs(next);
      if (!streamEnabledRef.current) {
        return;
      }
      void runWithAck(async () =>
        startDiagStream(
          clampDiagStreamIntervalMs(globalPeriodMsRef.current),
          clampDiagStreamIntervalMs(next),
        ),
      );
    },
    [runWithAck, startDiagStream],
  );
  const onMaxRowsPerBatchChange = useCallback((v: number) => setMaxRowsPerBatch(Math.max(1, Math.min(24, Math.round(v)))), [setMaxRowsPerBatch]);
  const onResyncPeriodChange = useCallback((v: number) => setResyncPeriodMs(Math.max(250, Math.min(60000, Math.round(v)))), [setResyncPeriodMs]);
  const onPriorityModeChange = useCallback((v: "sensor" | "diagnostics") => setPriorityMode(v), [setPriorityMode]);

  useEffect(() => {
    if (!streamEnabled) {
      return;
    }
    void runWithAck(async () =>
      setDiagTaskStreamConfig({
        taskPeriodMs: clampDiagStreamIntervalMs(taskPeriodMs),
        maxRowsPerBatch,
        priorityMode,
        resyncPeriodMs,
      }),
    );
  }, [
    streamEnabled,
    taskPeriodMs,
    maxRowsPerBatch,
    priorityMode,
    resyncPeriodMs,
    runWithAck,
    setDiagTaskStreamConfig,
  ]);

  return (
    <DiagControlCard
      streamEnabled={streamEnabled}
      globalPeriodMs={globalPeriodMs}
      taskPeriodMs={taskPeriodMs}
      maxRowsPerBatch={maxRowsPerBatch}
      resyncPeriodMs={resyncPeriodMs}
      priorityMode={priorityMode}
      loading={loading}
      ackState={ackState}
      ackMessage={ackMessage}
      onToggleStream={onToggleStream}
      onGlobalPeriodChange={onGlobalPeriodChange}
      onTaskPeriodChange={onTaskPeriodChange}
      onMaxRowsPerBatchChange={onMaxRowsPerBatchChange}
      onResyncPeriodChange={onResyncPeriodChange}
      onPriorityModeChange={onPriorityModeChange}
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
    />
  );
}
