/** Persists Canvas inspector tab when no flow node is selected. */

const PREFIX = "ternion.sensor-studio.canvasInspector.";

const KEYS = {
  activeTab: `${PREFIX}activeTab.v1`,
  canvasTabCardOrder: `${PREFIX}canvasTab.cardOrder.v1`,
  canvasTabCardCollapsed: `${PREFIX}canvasTab.cardCollapsed.v1`,
  telemetryTabCardOrder: `${PREFIX}telemetryTab.cardOrder.v1`,
  telemetryTabCardCollapsed: `${PREFIX}telemetryTab.cardCollapsed.v1`,
  documentTabCardOrder: `${PREFIX}documentTab.cardOrder.v1`,
  documentTabCardCollapsed: `${PREFIX}documentTab.cardCollapsed.v1`,
} as const;

export type CanvasInspectorTab = "canvas" | "telemetry" | "document";

export function readStoredCanvasInspectorTab(): CanvasInspectorTab {
  const raw = safeGet(KEYS.activeTab);
  if (raw === "canvas" || raw === "telemetry" || raw === "document") {
    return raw;
  }
  return "canvas";
}

export function writeStoredCanvasInspectorTab(tab: CanvasInspectorTab): void {
  safeSet(KEYS.activeTab, tab);
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export type CanvasInspectorCanvasTabCardId =
  | "viewport"
  | "wires-grid"
  | "canvas-chrome"
  | "selection"
  | "workbench";

export const DEFAULT_CANVAS_TAB_CARD_ORDER: readonly CanvasInspectorCanvasTabCardId[] = [
  "viewport",
  "wires-grid",
  "canvas-chrome",
  "selection",
  "workbench",
];

const CANVAS_TAB_CARD_IDS = new Set<string>(DEFAULT_CANVAS_TAB_CARD_ORDER);

function isCanvasTabCardId(value: string): value is CanvasInspectorCanvasTabCardId {
  return CANVAS_TAB_CARD_IDS.has(value);
}

export function readCanvasTabCardOrder(): CanvasInspectorCanvasTabCardId[] {
  const raw = safeGet(KEYS.canvasTabCardOrder);
  if (raw == null || raw.length === 0) {
    return [...DEFAULT_CANVAS_TAB_CARD_ORDER];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [...DEFAULT_CANVAS_TAB_CARD_ORDER];
    }
    const out: CanvasInspectorCanvasTabCardId[] = [];
    for (const item of parsed) {
      if (typeof item === "string" && isCanvasTabCardId(item) && !out.includes(item)) {
        out.push(item);
      }
    }
    for (const id of DEFAULT_CANVAS_TAB_CARD_ORDER) {
      if (!out.includes(id)) {
        out.push(id);
      }
    }
    return out;
  } catch {
    return [...DEFAULT_CANVAS_TAB_CARD_ORDER];
  }
}

export function writeCanvasTabCardOrder(order: readonly CanvasInspectorCanvasTabCardId[]): void {
  safeSet(KEYS.canvasTabCardOrder, JSON.stringify([...order]));
}

export function readCanvasTabCardCollapsed(): Record<CanvasInspectorCanvasTabCardId, boolean> {
  const raw = safeGet(KEYS.canvasTabCardCollapsed);
  if (raw == null || raw.length === 0) {
    return {
      viewport: false,
      "wires-grid": false,
      "canvas-chrome": false,
      selection: false,
      workbench: false,
    };
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        viewport: false,
        "wires-grid": false,
        "canvas-chrome": false,
        selection: false,
        workbench: false,
      };
    }
    const obj = parsed as Record<string, unknown>;
    return {
      viewport: obj.viewport === true,
      "wires-grid": obj["wires-grid"] === true,
      "canvas-chrome": obj["canvas-chrome"] === true,
      selection: obj.selection === true,
      workbench: obj.workbench === true,
    };
  } catch {
    return {
      viewport: false,
      "wires-grid": false,
      "canvas-chrome": false,
      selection: false,
      workbench: false,
    };
  }
}

export function writeCanvasTabCardCollapsed(next: Record<CanvasInspectorCanvasTabCardId, boolean>): void {
  safeSet(KEYS.canvasTabCardCollapsed, JSON.stringify(next));
}

export function mergeCanvasTabCardOrder(
  stored: readonly CanvasInspectorCanvasTabCardId[],
  visible: readonly CanvasInspectorCanvasTabCardId[],
): CanvasInspectorCanvasTabCardId[] {
  const visibleSet = new Set(visible);
  const ordered = stored.filter((id) => visibleSet.has(id));
  for (const id of visible) {
    if (!ordered.includes(id)) {
      ordered.push(id);
    }
  }
  return ordered;
}

export type CanvasInspectorTelemetryTabCardId = "graph-sensors" | "device-configuration";

export const DEFAULT_TELEMETRY_TAB_CARD_ORDER: readonly CanvasInspectorTelemetryTabCardId[] = [
  "graph-sensors",
  "device-configuration",
];

const TELEMETRY_TAB_CARD_IDS = new Set<string>(DEFAULT_TELEMETRY_TAB_CARD_ORDER);

function isTelemetryTabCardId(value: string): value is CanvasInspectorTelemetryTabCardId {
  return TELEMETRY_TAB_CARD_IDS.has(value);
}

export function readTelemetryTabCardOrder(): CanvasInspectorTelemetryTabCardId[] {
  const raw = safeGet(KEYS.telemetryTabCardOrder);
  if (raw == null || raw.length === 0) {
    return [...DEFAULT_TELEMETRY_TAB_CARD_ORDER];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [...DEFAULT_TELEMETRY_TAB_CARD_ORDER];
    }
    const out: CanvasInspectorTelemetryTabCardId[] = [];
    for (const item of parsed) {
      if (typeof item === "string" && isTelemetryTabCardId(item) && !out.includes(item)) {
        out.push(item);
      }
    }
    for (const id of DEFAULT_TELEMETRY_TAB_CARD_ORDER) {
      if (!out.includes(id)) {
        out.push(id);
      }
    }
    return out;
  } catch {
    return [...DEFAULT_TELEMETRY_TAB_CARD_ORDER];
  }
}

export function writeTelemetryTabCardOrder(order: readonly CanvasInspectorTelemetryTabCardId[]): void {
  safeSet(KEYS.telemetryTabCardOrder, JSON.stringify([...order]));
}

export function readTelemetryTabCardCollapsed(): Record<CanvasInspectorTelemetryTabCardId, boolean> {
  const raw = safeGet(KEYS.telemetryTabCardCollapsed);
  if (raw == null || raw.length === 0) {
    return { "graph-sensors": false, "device-configuration": false };
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { "graph-sensors": false, "device-configuration": false };
    }
    const obj = parsed as Record<string, unknown>;
    return {
      "graph-sensors": obj["graph-sensors"] === true,
      "device-configuration": obj["device-configuration"] === true,
    };
  } catch {
    return { "graph-sensors": false, "device-configuration": false };
  }
}

export function writeTelemetryTabCardCollapsed(
  next: Record<CanvasInspectorTelemetryTabCardId, boolean>,
): void {
  safeSet(KEYS.telemetryTabCardCollapsed, JSON.stringify(next));
}

export function mergeTelemetryTabCardOrder(
  stored: readonly CanvasInspectorTelemetryTabCardId[],
  visible: readonly CanvasInspectorTelemetryTabCardId[],
): CanvasInspectorTelemetryTabCardId[] {
  const visibleSet = new Set(visible);
  const ordered = stored.filter((id) => visibleSet.has(id));
  for (const id of visible) {
    if (!ordered.includes(id)) {
      ordered.push(id);
    }
  }
  return ordered;
}

export type CanvasInspectorDocumentTabCardId =
  | "document-summary"
  | "starter-graph"
  | "audio-safety"
  | "import-export";

export const DEFAULT_DOCUMENT_TAB_CARD_ORDER: readonly CanvasInspectorDocumentTabCardId[] = [
  "document-summary",
  "starter-graph",
  "audio-safety",
  "import-export",
];

const DOCUMENT_TAB_CARD_IDS = new Set<string>(DEFAULT_DOCUMENT_TAB_CARD_ORDER);

function isDocumentTabCardId(value: string): value is CanvasInspectorDocumentTabCardId {
  return DOCUMENT_TAB_CARD_IDS.has(value);
}

export function readDocumentTabCardOrder(): CanvasInspectorDocumentTabCardId[] {
  const raw = safeGet(KEYS.documentTabCardOrder);
  if (raw == null || raw.length === 0) {
    return [...DEFAULT_DOCUMENT_TAB_CARD_ORDER];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [...DEFAULT_DOCUMENT_TAB_CARD_ORDER];
    }
    const out: CanvasInspectorDocumentTabCardId[] = [];
    for (const item of parsed) {
      if (typeof item === "string" && isDocumentTabCardId(item) && !out.includes(item)) {
        out.push(item);
      }
    }
    for (const id of DEFAULT_DOCUMENT_TAB_CARD_ORDER) {
      if (!out.includes(id)) {
        out.push(id);
      }
    }
    return out;
  } catch {
    return [...DEFAULT_DOCUMENT_TAB_CARD_ORDER];
  }
}

export function writeDocumentTabCardOrder(order: readonly CanvasInspectorDocumentTabCardId[]): void {
  safeSet(KEYS.documentTabCardOrder, JSON.stringify([...order]));
}

export function readDocumentTabCardCollapsed(): Record<CanvasInspectorDocumentTabCardId, boolean> {
  const raw = safeGet(KEYS.documentTabCardCollapsed);
  if (raw == null || raw.length === 0) {
    return {
      "document-summary": false,
      "starter-graph": false,
      "audio-safety": false,
      "import-export": false,
    };
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        "document-summary": false,
        "starter-graph": false,
        "audio-safety": false,
        "import-export": false,
      };
    }
    const obj = parsed as Record<string, unknown>;
    return {
      "document-summary": obj["document-summary"] === true,
      "starter-graph": obj["starter-graph"] === true,
      "audio-safety": obj["audio-safety"] === true,
      "import-export": obj["import-export"] === true,
    };
  } catch {
    return {
      "document-summary": false,
      "starter-graph": false,
      "audio-safety": false,
      "import-export": false,
    };
  }
}

export function writeDocumentTabCardCollapsed(
  next: Record<CanvasInspectorDocumentTabCardId, boolean>,
): void {
  safeSet(KEYS.documentTabCardCollapsed, JSON.stringify(next));
}

export function mergeDocumentTabCardOrder(
  stored: readonly CanvasInspectorDocumentTabCardId[],
  visible: readonly CanvasInspectorDocumentTabCardId[],
): CanvasInspectorDocumentTabCardId[] {
  const visibleSet = new Set(visible);
  const ordered = stored.filter((id) => visibleSet.has(id));
  for (const id of visible) {
    if (!ordered.includes(id)) {
      ordered.push(id);
    }
  }
  return ordered;
}
