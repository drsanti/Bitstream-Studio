import type { PaneDockZone } from "./paneDock";

export type WorkbenchDockSizeMemory = Record<string, number>;

const clampRatio = (ratio: number) => Math.max(0.05, Math.min(0.95, ratio));

export function dockSplitMemoryKey(
  incomingType: string,
  targetType: string,
  zone: Exclude<PaneDockZone, "center">,
): string {
  return `${incomingType}|${targetType}|${zone}`;
}

export function workbenchEdgeMemoryKey(
  editorType: string,
  zone: Exclude<PaneDockZone, "center">,
): string {
  return `__edge__|${editorType}|${zone}`;
}

export function resolveDockSplitRatio(
  memory: WorkbenchDockSizeMemory,
  incomingType: string,
  targetType: string,
  zone: PaneDockZone,
  fallback: number,
): number {
  if (zone === "center") {
    return fallback;
  }
  const stored = memory[dockSplitMemoryKey(incomingType, targetType, zone)];
  return stored != null && Number.isFinite(stored) ? clampRatio(stored) : fallback;
}

export function resolveWorkbenchEdgeRatio(
  memory: WorkbenchDockSizeMemory,
  editorType: string,
  zone: Exclude<PaneDockZone, "center">,
  fallback: number,
): number {
  const stored = memory[workbenchEdgeMemoryKey(editorType, zone)];
  return stored != null && Number.isFinite(stored) ? clampRatio(stored) : fallback;
}

export function rememberDockSplitRatio(
  memory: WorkbenchDockSizeMemory,
  incomingType: string,
  targetType: string,
  zone: PaneDockZone,
  ratio: number,
): WorkbenchDockSizeMemory {
  if (zone === "center") {
    return memory;
  }
  const key = dockSplitMemoryKey(incomingType, targetType, zone);
  return { ...memory, [key]: clampRatio(ratio) };
}

export function rememberWorkbenchEdgeRatio(
  memory: WorkbenchDockSizeMemory,
  editorType: string,
  zone: Exclude<PaneDockZone, "center">,
  ratio: number,
): WorkbenchDockSizeMemory {
  return { ...memory, [workbenchEdgeMemoryKey(editorType, zone)]: clampRatio(ratio) };
}

export function rememberSplitResizeRatio(
  memory: WorkbenchDockSizeMemory,
  firstType: string,
  secondType: string,
  direction: "horizontal" | "vertical",
  ratio: number,
): WorkbenchDockSizeMemory {
  const r = clampRatio(ratio);
  let next = { ...memory };
  if (direction === "horizontal") {
    next = { ...next, [dockSplitMemoryKey(firstType, secondType, "left")]: r };
    next = { ...next, [dockSplitMemoryKey(secondType, firstType, "right")]: r };
  } else {
    next = { ...next, [dockSplitMemoryKey(firstType, secondType, "top")]: r };
    next = { ...next, [dockSplitMemoryKey(secondType, firstType, "bottom")]: r };
  }
  return next;
}
