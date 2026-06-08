import type { DashboardLayoutExportV1 } from "./dashboard-layout-export";
import { createDashboardLayoutExport } from "./dashboard-layout-export";
import type { DashboardSnapshotV1 } from "./dashboard-snapshot";
import { parseDashboardLayoutImportJson } from "./dashboard-layout-import";

const DASHBOARD_LAYOUT_LIBRARY_KEY = "ternion.sensor-studio.dashboard.layoutLibrary.v1";

export type DashboardLayoutLibraryEntryV1 = {
  id: string;
  name: string;
  savedAtMs: number;
  export: DashboardLayoutExportV1;
};

type DashboardLayoutLibraryStoreV1 = {
  version: 1;
  entries: DashboardLayoutLibraryEntryV1[];
};

function readStore(): DashboardLayoutLibraryStoreV1 {
  try {
    const raw = localStorage.getItem(DASHBOARD_LAYOUT_LIBRARY_KEY);
    if (raw == null) {
      return { version: 1, entries: [] };
    }
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed != null &&
      typeof parsed === "object" &&
      (parsed as DashboardLayoutLibraryStoreV1).version === 1 &&
      Array.isArray((parsed as DashboardLayoutLibraryStoreV1).entries)
    ) {
      return parsed as DashboardLayoutLibraryStoreV1;
    }
  } catch {
    /* ignore */
  }
  return { version: 1, entries: [] };
}

function writeStore(store: DashboardLayoutLibraryStoreV1): void {
  try {
    localStorage.setItem(DASHBOARD_LAYOUT_LIBRARY_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function listDashboardLayoutLibraryEntries(): readonly DashboardLayoutLibraryEntryV1[] {
  return readStore().entries.sort((a, b) => b.savedAtMs - a.savedAtMs);
}

export function saveDashboardLayoutToLibrary(
  name: string,
  snapshot: DashboardSnapshotV1,
): DashboardLayoutLibraryEntryV1 {
  const trimmed = name.trim();
  const entry: DashboardLayoutLibraryEntryV1 = {
    id: `dash-layout-${Date.now()}`,
    name: trimmed.length > 0 ? trimmed : "Dashboard layout",
    savedAtMs: Date.now(),
    export: createDashboardLayoutExport(snapshot),
  };
  const store = readStore();
  store.entries = [entry, ...store.entries].slice(0, 24);
  writeStore(store);
  return entry;
}

export function loadDashboardLayoutLibraryEntry(
  entryId: string,
): DashboardLayoutLibraryEntryV1 | null {
  return readStore().entries.find((row) => row.id === entryId) ?? null;
}

export function deleteDashboardLayoutLibraryEntry(entryId: string): boolean {
  const store = readStore();
  const next = store.entries.filter((row) => row.id !== entryId);
  if (next.length === store.entries.length) {
    return false;
  }
  store.entries = next;
  writeStore(store);
  return true;
}

export function parseDashboardLayoutLibraryExportJson(json: string) {
  return parseDashboardLayoutImportJson(json);
}
