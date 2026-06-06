import type { StudioNodeData } from "../../store/flow-editor.store";
import { resolveStudioNodeMinDimensionFloor } from "./studio-node-resize-defaults";
import {
  isBodyControlsVisible,
  isSocketValuesVisible,
  isSocketsExpanded,
  studioNodeHasHideableBody,
  type StudioNodeUiFlags,
} from "./socket-display";

/** Persisted width profile keyed by socket + body chrome (saved in flow JSON). */
export type StudioNodeChromeLayoutKey =
  | "all"
  | "noLive"
  | "noUnused"
  | "noLiveNoUnused"
  | "noBody"
  | "noBodyNoLive"
  | "noBodyNoUnused"
  | "noBodyNoLiveNoUnused";

export type StudioNodeChromeLayoutWidthMap = Partial<
  Record<StudioNodeChromeLayoutKey, number>
>;

const SOCKET_ONLY_CHROME_LAYOUT_KEYS: readonly StudioNodeChromeLayoutKey[] = [
  "all",
  "noLive",
  "noUnused",
  "noLiveNoUnused",
];

const BODY_CHROME_LAYOUT_KEYS: readonly StudioNodeChromeLayoutKey[] = [
  "noBody",
  "noBodyNoLive",
  "noBodyNoUnused",
  "noBodyNoLiveNoUnused",
];

export const STUDIO_NODE_CHROME_LAYOUT_KEY_META: Readonly<
  Record<StudioNodeChromeLayoutKey, { label: string; hint: string }>
> = {
  all: {
    label: "Show all",
    hint: "Live values on · all sockets visible · body shown",
  },
  noLive: {
    label: "Hide live values",
    hint: "Socket labels only · unwired sockets visible · body shown",
  },
  noUnused: {
    label: "Hide unwired sockets",
    hint: "Live values on · wired sockets only · body shown",
  },
  noLiveNoUnused: {
    label: "Hide live + unwired",
    hint: "Wired sockets only · no live readouts · body shown",
  },
  noBody: {
    label: "Hide body",
    hint: "Body collapsed · live values on · all sockets",
  },
  noBodyNoLive: {
    label: "Hide body + live",
    hint: "Body collapsed · no live readouts · all sockets",
  },
  noBodyNoUnused: {
    label: "Hide body + unwired",
    hint: "Body collapsed · live on · wired sockets only",
  },
  noBodyNoLiveNoUnused: {
    label: "Hide body + live + unwired",
    hint: "Body collapsed · wired sockets only · no live readouts",
  },
};

export function studioNodeChromeLayoutKeysForData(
  data: Pick<StudioNodeData, "nodeId">,
): readonly StudioNodeChromeLayoutKey[] {
  return studioNodeHasHideableBody(data)
    ? [...SOCKET_ONLY_CHROME_LAYOUT_KEYS, ...BODY_CHROME_LAYOUT_KEYS]
    : SOCKET_ONLY_CHROME_LAYOUT_KEYS;
}

export function resolveStudioNodeChromeLayoutKey(
  ui: StudioNodeUiFlags | undefined,
  hasHideableBody: boolean,
): StudioNodeChromeLayoutKey {
  const live = isSocketValuesVisible(ui);
  const sockets = isSocketsExpanded(ui);
  const body = !hasHideableBody || isBodyControlsVisible(ui);

  if (body && live && sockets) {
    return "all";
  }
  if (body && !live && sockets) {
    return "noLive";
  }
  if (body && live && !sockets) {
    return "noUnused";
  }
  if (body && !live && !sockets) {
    return "noLiveNoUnused";
  }
  if (!body && live && sockets) {
    return "noBody";
  }
  if (!body && !live && sockets) {
    return "noBodyNoLive";
  }
  if (!body && live && !sockets) {
    return "noBodyNoUnused";
  }
  return "noBodyNoLiveNoUnused";
}

export function readStudioNodeChromeLayoutWidthMap(
  ui: StudioNodeUiFlags | undefined,
): StudioNodeChromeLayoutWidthMap {
  const raw = ui?.layoutWidthByChrome;
  if (raw == null || typeof raw !== "object") {
    return {};
  }
  const next: StudioNodeChromeLayoutWidthMap = {};
  for (const key of Object.keys(STUDIO_NODE_CHROME_LAYOUT_KEY_META) as StudioNodeChromeLayoutKey[]) {
    const v = raw[key];
    if (typeof v === "number" && Number.isFinite(v) && v > 0) {
      next[key] = Math.round(v);
    }
  }
  return next;
}

export function readStoredChromeLayoutWidth(
  ui: StudioNodeUiFlags | undefined,
  key: StudioNodeChromeLayoutKey,
  catalogMinWidth: number,
): number | undefined {
  const map = readStudioNodeChromeLayoutWidthMap(ui);
  const stored = map[key];
  if (stored != null && stored > 0) {
    return stored;
  }
  return undefined;
}

export function resolveChromeLayoutWidth(
  ui: StudioNodeUiFlags | undefined,
  key: StudioNodeChromeLayoutKey,
  nodeId: string,
  fallbackWidth: number,
): number {
  const floor = resolveStudioNodeMinDimensionFloor(nodeId).minWidth;
  const stored = readStoredChromeLayoutWidth(ui, key, floor);
  if (stored != null) {
    return Math.max(floor, stored);
  }
  if (Number.isFinite(fallbackWidth) && fallbackWidth > 0) {
    return Math.max(floor, Math.round(fallbackWidth));
  }
  return floor;
}

export function patchStudioNodeChromeLayoutWidth(
  ui: StudioNodeUiFlags | undefined,
  key: StudioNodeChromeLayoutKey,
  widthPx: number,
): StudioNodeUiFlags | undefined {
  const width = Math.max(1, Math.round(widthPx));
  const prev = readStudioNodeChromeLayoutWidthMap(ui);
  if (prev[key] === width) {
    return ui;
  }
  const nextMap: StudioNodeChromeLayoutWidthMap = { ...prev, [key]: width };
  const base = ui ?? {};
  return { ...base, layoutWidthByChrome: nextMap };
}

export function copyChromeLayoutWidthToAllKeys(
  ui: StudioNodeUiFlags | undefined,
  keys: readonly StudioNodeChromeLayoutKey[],
  widthPx: number,
): StudioNodeUiFlags | undefined {
  let next = ui;
  for (const key of keys) {
    next = patchStudioNodeChromeLayoutWidth(next, key, widthPx);
  }
  return next;
}

export function clearStudioNodeChromeLayoutWidths(
  ui: StudioNodeUiFlags | undefined,
): StudioNodeUiFlags | undefined {
  if (ui == null || ui.layoutWidthByChrome == null) {
    return ui;
  }
  const { layoutWidthByChrome: _drop, ...rest } = ui;
  return Object.keys(rest).length > 0 ? rest : undefined;
}

/** Seed `all` from legacy RF width when opening older flows. */
export function migrateStudioNodeChromeLayoutWidth(
  nodeId: string,
  ui: StudioNodeUiFlags | undefined,
  rfWidth: number | undefined,
): StudioNodeUiFlags | undefined {
  const map = readStudioNodeChromeLayoutWidthMap(ui);
  if (Object.keys(map).length > 0) {
    return ui;
  }
  if (typeof rfWidth !== "number" || !Number.isFinite(rfWidth) || rfWidth <= 0) {
    return ui;
  }
  return patchStudioNodeChromeLayoutWidth(ui, "all", rfWidth);
}

export function resolveFitWidthFromContentMeasure(
  nodeId: string,
  ui: StudioNodeUiFlags | undefined,
): number {
  const floor = resolveStudioNodeMinDimensionFloor(nodeId).minWidth;
  const measured =
    typeof ui?.contentMinWidth === "number" && Number.isFinite(ui.contentMinWidth)
      ? Math.round(ui.contentMinWidth)
      : 0;
  return Math.max(floor, measured);
}
