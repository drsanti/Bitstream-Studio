import assert from "node:assert/strict";
import test from "node:test";

import { createFlowUndoCoalescer } from "../../src/webview/sensor-studio/features/editor/store/flow-undo-coalesce";

test("createFlowUndoCoalescer pushes once per microtask batch", async () => {
  let pushCount = 0;
  const microtasks: Array<() => void> = [];
  const coalescer = createFlowUndoCoalescer(
    () => {
      pushCount++;
    },
    (fn) => {
      microtasks.push(fn);
    },
  );

  coalescer.pushCoalesced();
  coalescer.pushCoalesced();
  assert.equal(pushCount, 1);
  assert.equal(coalescer.batchDepth(), 2);

  microtasks.forEach((fn) => fn());
  assert.equal(coalescer.batchDepth(), 0);

  coalescer.pushCoalesced();
  assert.equal(pushCount, 2);
});
