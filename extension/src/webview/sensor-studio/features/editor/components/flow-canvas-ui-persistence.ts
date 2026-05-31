/** Persisted flow canvas chrome (grid, minimap, background) — survives graph clear / templates. */

const STORAGE_KEY = "ternion.sensor-studio.flowCanvas.prefs.v1";

export type FlowCanvasGridSize = 12 | 16 | 20 | 24 | 32;

export type FlowCanvasPreferences = {
  snapToGrid: boolean;
  gridSize: FlowCanvasGridSize;
  showGrid: boolean;
  showMinimap: boolean;
  /** `null` = use Sensor Studio theme canvas color. */
  backgroundHex: string | null;
};

export const DEFAULT_FLOW_CANVAS_PREFERENCES: FlowCanvasPreferences = {
  snapToGrid: false,
  gridSize: 16,
  showGrid: true,
  showMinimap: false,
  backgroundHex: null,
};

const GRID_SIZES = new Set<number>([12, 16, 20, 24, 32]);

function safeGet(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function safeSet(value: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* quota / private mode */
  }
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function coercePreferences(raw: unknown): FlowCanvasPreferences {
  if (raw == null || typeof raw !== "object") {
    return { ...DEFAULT_FLOW_CANVAS_PREFERENCES };
  }
  const o = raw as Record<string, unknown>;
  const gridRaw = o.gridSize;
  const gridSize =
    typeof gridRaw === "number" && GRID_SIZES.has(gridRaw)
      ? (gridRaw as FlowCanvasGridSize)
      : DEFAULT_FLOW_CANVAS_PREFERENCES.gridSize;
  return {
    snapToGrid: o.snapToGrid === true,
    gridSize,
    showGrid: o.showGrid !== false,
    showMinimap: o.showMinimap === true,
    backgroundHex:
      o.backgroundHex === null
        ? null
        : isHexColor(o.backgroundHex)
          ? o.backgroundHex
          : DEFAULT_FLOW_CANVAS_PREFERENCES.backgroundHex,
  };
}

export function readStoredFlowCanvasPreferences(): FlowCanvasPreferences {
  const raw = safeGet();
  if (raw == null || raw.length === 0) {
    return { ...DEFAULT_FLOW_CANVAS_PREFERENCES };
  }
  try {
    return coercePreferences(JSON.parse(raw) as unknown);
  } catch {
    return { ...DEFAULT_FLOW_CANVAS_PREFERENCES };
  }
}

export function writeStoredFlowCanvasPreferences(next: FlowCanvasPreferences): void {
  safeSet(JSON.stringify(next));
}

export function mergeFlowCanvasPreferences(
  prev: FlowCanvasPreferences,
  patch: Partial<FlowCanvasPreferences>,
): FlowCanvasPreferences {
  const merged = { ...prev, ...patch };
  if (patch.gridSize != null && !GRID_SIZES.has(patch.gridSize)) {
    merged.gridSize = prev.gridSize;
  }
  if (patch.backgroundHex !== undefined && patch.backgroundHex !== null && !isHexColor(patch.backgroundHex)) {
    merged.backgroundHex = prev.backgroundHex;
  }
  return merged;
}
