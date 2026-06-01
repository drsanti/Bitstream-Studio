import type { WorkbenchDockSizeMemory } from "./workbench-dock-size-memory";

const STORAGE_PREFIX = "trn_workbench_dock_";

export function loadPersistedDockSizeMemory(key: string): WorkbenchDockSizeMemory {
  try {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!saved) {
      return {};
    }
    const parsed = JSON.parse(saved) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed as WorkbenchDockSizeMemory;
  } catch {
    return {};
  }
}

export function savePersistedDockSizeMemory(key: string, memory: WorkbenchDockSizeMemory): void {
  localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(memory));
}

export function clearPersistedDockSizeMemory(key: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
}
