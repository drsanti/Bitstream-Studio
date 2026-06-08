import type { DashboardSnapshotV1 } from "./dashboard-snapshot";

export type DashboardLayoutExportV1 = {
  version: 1;
  exportedAtMs: number;
  snapshot: DashboardSnapshotV1;
};

export function createDashboardLayoutExport(snapshot: DashboardSnapshotV1): DashboardLayoutExportV1 {
  return {
    version: 1,
    exportedAtMs: Date.now(),
    snapshot,
  };
}

export function downloadDashboardLayoutJson(snapshot: DashboardSnapshotV1, filename?: string): void {
  const payload = createDashboardLayoutExport(snapshot);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename ?? `dashboard-layout-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
