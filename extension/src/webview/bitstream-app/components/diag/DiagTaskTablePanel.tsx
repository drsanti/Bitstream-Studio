import { useEffect, useMemo, useRef, useState } from "react";
import { useBitstreamDiagTasksStore } from "../../state/bitstreamDiagTasks.store";
import { useBitstreamAppControl } from "../../BitstreamAppWrapper";
import { DiagTaskTableCard } from "./DiagTaskTableCard";
import { useBitstreamDiagControlStore } from "../../state/bitstreamDiagControl.store";

export function DiagTaskTablePanel(props: {
  collapsed: boolean;
  onCollapsedChange: (next: boolean) => void;
  diagnosticsStreamEnabled?: boolean;
}) {
  const {
    collapsed,
    onCollapsedChange,
    diagnosticsStreamEnabled = false,
  } = props;
  const { rowsById, expectedTaskCount, updatedAt, error } =
    useBitstreamDiagTasksStore();
  const { timestampMs, epoch, deltaSeq } = useBitstreamDiagTasksStore();
  const qualityWarning =
    typeof error === "string" &&
    (error.startsWith("task batch row count mismatch") ||
      error.startsWith("task batch incomplete") ||
      error.includes("task item layout/CRC mismatch"))
      ? error
      : null;
  const hardError = qualityWarning ? null : error;
  const setError = useBitstreamDiagTasksStore((s) => s.setError);
  const {
    setDiagTaskPriority,
    setDiagTaskStreamConfig,
    diagTaskStreamResyncNow,
  } = useBitstreamAppControl();
  const { taskPeriodMs, maxRowsPerBatch, resyncPeriodMs, priorityMode } =
    useBitstreamDiagControlStore();
  const [viewMode, setViewMode] = useState<"minimal" | "standard" | "full">(
    "minimal",
  );
  const appliedRef = useRef(false);

  const rows = useMemo(() => Object.values(rowsById), [rowsById]);
  const staleCount = useMemo(
    () => rows.filter((r) => r.stale === true).length,
    [rows],
  );
  const freshCount = Math.max(0, rows.length - staleCount);
  const effectiveEnabled = diagnosticsStreamEnabled || rows.length > 0;
  const debugLines = useMemo(() => {
    const lines: string[] = [];
    lines.push(`rows=${rows.length} expected=${expectedTaskCount ?? "--"}`);
    lines.push(`epoch=${epoch ?? "--"} seq=${deltaSeq ?? "--"} tsMs=${timestampMs ?? "--"}`);
    if (updatedAt != null) {
      lines.push(`updatedAt=${new Date(updatedAt).toLocaleTimeString()}`);
    }
    if (qualityWarning) {
      lines.push(`quality=${qualityWarning}`);
    }
    if (hardError) {
      lines.push(`error=${hardError}`);
    }
    return lines;
  }, [rows.length, expectedTaskCount, updatedAt, qualityWarning, hardError, epoch, deltaSeq, timestampMs]);

  const [headerTiming, setHeaderTiming] = useState<{
    deltaTimestampMs: number | null;
    deltaPublishedMs: number | null;
  }>({ deltaTimestampMs: null, deltaPublishedMs: null });
  const prevTimingRef = useRef<{
    timestampMs: number | null;
    updatedAt: number | null;
  }>({ timestampMs: null, updatedAt: null });

  useEffect(() => {
    const prev = prevTimingRef.current;
    const dtTs =
      prev.timestampMs != null && timestampMs != null
        ? timestampMs - prev.timestampMs
        : null;
    const dtPub =
      prev.updatedAt != null && updatedAt != null ? updatedAt - prev.updatedAt : null;
    prevTimingRef.current = { timestampMs: timestampMs ?? null, updatedAt: updatedAt ?? null };
    setHeaderTiming({
      deltaTimestampMs: dtTs != null && Number.isFinite(dtTs) ? dtTs : null,
      deltaPublishedMs: dtPub != null && Number.isFinite(dtPub) ? dtPub : null,
    });
  }, [timestampMs, updatedAt]);

  // Bandwidth guard: only stream task rows while this card is expanded.
  useEffect(() => {
    if (collapsed) {
      appliedRef.current = false;
      void setDiagTaskStreamConfig({
        taskPeriodMs: 0, // firmware v2: disables task streaming
        maxRowsPerBatch,
        priorityMode,
        resyncPeriodMs,
      }).then((res) => {
        if (!res.ok) {
          setError(`Task stream disable failed: ${res.message}`);
        }
      });
      return;
    }

    // When expanding, push config once and request an immediate resync.
    if (appliedRef.current) {
      return;
    }
    appliedRef.current = true;
    void setDiagTaskStreamConfig({
      taskPeriodMs,
      maxRowsPerBatch,
      priorityMode,
      resyncPeriodMs,
    }).then((res) => {
      if (!res.ok) {
        setError(`Task stream config failed: ${res.message}`);
        return;
      }
      setError(null);
      void diagTaskStreamResyncNow().then((r2) => {
        if (!r2.ok) {
          setError(`Task stream resync failed: ${r2.message}`);
        }
      });
    });
  }, [collapsed, diagTaskStreamResyncNow, setDiagTaskStreamConfig, setError, taskPeriodMs, maxRowsPerBatch, priorityMode, resyncPeriodMs]);

  return (
    <DiagTaskTableCard
      rows={rows}
      expectedTaskCount={expectedTaskCount}
      error={hardError}
      updatedAt={updatedAt}
      epoch={epoch ?? null}
      deltaSeq={deltaSeq ?? null}
      deltaTimestampMs={headerTiming.deltaTimestampMs}
      deltaPublishedAtMs={headerTiming.deltaPublishedMs}
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
      diagnosticsStreamEnabled={effectiveEnabled}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      onRequestSetPriority={setDiagTaskPriority}
      debugLines={debugLines}
      freshCount={freshCount}
      staleCount={staleCount}
      hasQualityWarning={qualityWarning != null}
    />
  );
}
