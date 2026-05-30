export type DiagSnapshotData = {
  atMs: number;
  cpuLoadPctX100: number;
  idlePctX100: number;
  heapFreeBytes: number;
  heapMinEverFreeBytes: number;
  taskCount: number;
  streamOverrunCount: number;
  streamGlobalPeriodMs: number;
  tickHz: number;
  faultFlags: number;
  sampledTaskCount: number;
  runtimeTaskCount: number;
  /**
   * Cumulative runtime accounting total from firmware (`runtimeTotalTicks`).
   * In this product, **1 tick = 1 ms**, so the numeric value matches elapsed milliseconds.
   */
  runtimeTotal: number;
  /** Runtime sum for listed tasks (`runtimeListedTicks`); **1 tick = 1 ms** (same as `runtimeTotal`). */
  runtimeListed: number;
  unattributedCpuPctX100: number;
};
