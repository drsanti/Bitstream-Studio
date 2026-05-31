/** Persists Canvas inspector tab when no flow node is selected. */

const KEY = "ternion.sensor-studio.canvasInspector.activeTab.v1";

export type CanvasInspectorTab = "canvas" | "telemetry" | "document";

function safeGet(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function safeSet(value: string): void {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* ignore */
  }
}

export function readStoredCanvasInspectorTab(): CanvasInspectorTab {
  const raw = safeGet();
  if (raw === "canvas" || raw === "telemetry" || raw === "document") {
    return raw;
  }
  return "canvas";
}

export function writeStoredCanvasInspectorTab(tab: CanvasInspectorTab): void {
  safeSet(tab);
}
