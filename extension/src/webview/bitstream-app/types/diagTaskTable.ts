export type DiagTaskRow = {
  taskId: number;
  name: string;
  priority: number;
  state: number;
  stackAllocWords: number;
  stackFreeNowWords: number;
  stackMinEverWords: number;
  runTicks: number;
  runCount: number;
  waitTicks: number;
  flags: number;
  cpuPctX100: number;
  healthFlags: number;
  lastSeenAtMs?: number;
  stale?: boolean;
};

export type DiagTaskTableState = {
  timestampMs: number | null;
  expectedTaskCount: number | null;
  rowsById: Record<number, DiagTaskRow>;
  /** Task-set epoch from v2 header when available. */
  epoch?: number | null;
  /** Delta batch sequence from v2 header when available. */
  deltaSeq?: number | null;
  updatedAt: number | null;
  error: string | null;
};

