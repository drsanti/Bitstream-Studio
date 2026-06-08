/**
 * JSON textarea emits many `setDraftJson` calls per edit tick — coalesce to one undo step.
 */
const jsonUndoBatch = new Map<string, boolean>();

export function pushDiagramJsonUndoCoalesced(
  diagramId: string,
  push: () => void,
  scheduleMicrotask: (fn: () => void) => void = queueMicrotask,
): void {
  if (jsonUndoBatch.get(diagramId)) {
    return;
  }
  push();
  jsonUndoBatch.set(diagramId, true);
  scheduleMicrotask(() => {
    jsonUndoBatch.delete(diagramId);
  });
}

/** Test hook — reset coalesce state between cases. */
export function resetDiagramJsonUndoCoalesceForTests(): void {
  jsonUndoBatch.clear();
}
