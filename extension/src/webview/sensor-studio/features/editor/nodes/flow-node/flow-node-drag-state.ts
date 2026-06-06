/** True while a flow node is actively dragged (local RF buffer, not yet in Zustand). */
let flowNodeDragActive = false;

export function setFlowNodeDragActive(active: boolean): void {
  flowNodeDragActive = active;
}

export function isFlowNodeDragActive(): boolean {
  return flowNodeDragActive;
}
