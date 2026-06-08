import { useSyncExternalStore } from "react";

/** True while a flow node is actively dragged (local RF buffer, not yet in Zustand). */
let flowNodeDragActive = false;
/** True while the React Flow viewport is panning/zooming from user input. */
let flowCanvasPanActive = false;
const listeners = new Set<() => void>();

function emitFlowNodeDragActive(): void {
  for (const listener of listeners) {
    listener();
  }
}

function clearPanActiveOnWindowPointerUp(): void {
  if (!flowCanvasPanActive) {
    return;
  }
  setFlowCanvasPanActive(false);
}

function ensurePanPointerUpGuard(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.addEventListener("pointerup", clearPanActiveOnWindowPointerUp, { once: true });
  window.addEventListener("pointercancel", clearPanActiveOnWindowPointerUp, { once: true });
}

export function setFlowNodeDragActive(active: boolean): void {
  if (flowNodeDragActive === active) {
    return;
  }
  flowNodeDragActive = active;
  emitFlowNodeDragActive();
}

export function setFlowCanvasPanActive(active: boolean): void {
  if (flowCanvasPanActive === active) {
    return;
  }
  flowCanvasPanActive = active;
  if (active) {
    ensurePanPointerUpGuard();
  }
}

export function isFlowNodeDragActive(): boolean {
  return flowNodeDragActive;
}

export function isFlowCanvasPanActive(): boolean {
  return flowCanvasPanActive;
}

/**
 * @deprecated Prefer {@link readFlowInteractionTickGate} — respects user interaction policy.
 */
export function isFlowInteractionBlockingTicks(): boolean {
  return flowNodeDragActive || flowCanvasPanActive;
}

function subscribeFlowNodeDragActive(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Re-renders while RF keeps node positions in the local drag buffer (before Zustand commit). */
export function useFlowNodeDragActive(): boolean {
  return useSyncExternalStore(
    subscribeFlowNodeDragActive,
    isFlowNodeDragActive,
    isFlowNodeDragActive,
  );
}
