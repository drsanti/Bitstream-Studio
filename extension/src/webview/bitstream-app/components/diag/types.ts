import type { DiagSnapshotData } from "../../types/diagSnapshot";

export type DiagSnapshotCardProps = {
  snapshot: DiagSnapshotData | null;
  error: string | null;
  updatedAt: number | null;
  collapsed: boolean;
  onCollapsedChange: (next: boolean) => void;
  /** When false, snapshot metrics are hidden (diagnostics stream off). */
  diagnosticsStreamEnabled?: boolean;
  /** Where snapshot updates are coming from (UI hint). */
  snapshotUpdateSource?: "stream" | "poll" | "off";
};

export type DiagControlAckState = "idle" | "pending" | "ok" | "error";

export type DiagControlCardProps = {
  streamEnabled: boolean;
  globalPeriodMs: number;
  taskPeriodMs: number;
  maxRowsPerBatch: number;
  resyncPeriodMs: number;
  priorityMode: "sensor" | "diagnostics";
  loading: boolean;
  ackState: DiagControlAckState;
  ackMessage: string;
  onToggleStream: (enabled: boolean) => void;
  onGlobalPeriodChange: (value: number) => void;
  onTaskPeriodChange: (value: number) => void;
  onMaxRowsPerBatchChange: (value: number) => void;
  onResyncPeriodChange: (value: number) => void;
  onPriorityModeChange: (value: "sensor" | "diagnostics") => void;
  collapsed: boolean;
  onCollapsedChange: (next: boolean) => void;
};
