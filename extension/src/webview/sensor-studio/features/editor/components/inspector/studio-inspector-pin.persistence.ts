import type { StudioInspectorPinTarget } from "./studio-inspector-pin";

const STORAGE_KEY = "ternion.sensor-studio.inspectorPin.v1";

export type PersistedInspectorPinV1 = {
  isPinned: boolean;
  target: StudioInspectorPinTarget | null;
};

export function readPersistedInspectorPin(): PersistedInspectorPinV1 | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    const row = parsed as PersistedInspectorPinV1;
    if (typeof row.isPinned !== "boolean") {
      return null;
    }
    return row;
  } catch {
    return null;
  }
}

export function writePersistedInspectorPin(state: PersistedInspectorPinV1): void {
  try {
    if (!state.isPinned || state.target == null) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}
