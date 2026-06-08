/**
 * RF `deleteElements` can emit separate node + edge remove changes in one tick.
 * Coalesce undo snapshots so Ctrl+Z restores the full graph (nodes + wires).
 */
export type FlowUndoCoalescer = {
  pushCoalesced: () => void;
  /** Test hook — current batch depth within the tick. */
  readonly batchDepth: () => number;
  resetForTests: () => void;
};

export function createFlowUndoCoalescer(
  pushUndoSnapshot: () => void,
  scheduleMicrotask: (fn: () => void) => void = queueMicrotask,
): FlowUndoCoalescer {
  let batchDepth = 0;
  let batchResetScheduled = false;

  return {
    pushCoalesced() {
      if (batchDepth === 0) {
        pushUndoSnapshot();
      }
      batchDepth++;
      if (!batchResetScheduled) {
        batchResetScheduled = true;
        scheduleMicrotask(() => {
          batchDepth = 0;
          batchResetScheduled = false;
        });
      }
    },
    batchDepth() {
      return batchDepth;
    },
    resetForTests() {
      batchDepth = 0;
      batchResetScheduled = false;
    },
  };
}
