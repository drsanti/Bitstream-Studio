import assert from "node:assert/strict";
import test from "node:test";

import {
  shouldGateOrbitControlsPointerDown,
  syncDiagram3dOrbitControlsForPointer,
} from "../../src/webview/course-studio/runtime/diagram/diagram3dBlenderOrbitPointerGate";

test("shouldGateOrbitControlsPointerDown allows plain LMB for R3F object pick", () => {
  assert.equal(
    shouldGateOrbitControlsPointerDown({ button: 0, altKey: false, pointerType: "mouse" } as PointerEvent),
    false,
  );
  assert.equal(
    shouldGateOrbitControlsPointerDown({ button: 0, altKey: true, pointerType: "mouse" } as PointerEvent),
    false,
  );
});

test("shouldGateOrbitControlsPointerDown blocks RMB and MMB", () => {
  assert.equal(
    shouldGateOrbitControlsPointerDown({ button: 1, altKey: false, pointerType: "mouse" } as PointerEvent),
    true,
  );
  assert.equal(
    shouldGateOrbitControlsPointerDown({ button: 2, altKey: false, pointerType: "mouse" } as PointerEvent),
    true,
  );
});

test("shouldGateOrbitControlsPointerDown allows touch", () => {
  assert.equal(
    shouldGateOrbitControlsPointerDown({ button: 0, altKey: false, pointerType: "touch" } as PointerEvent),
    false,
  );
});

test("syncDiagram3dOrbitControlsForPointer enables orbit only with Alt modifiers", () => {
  const controls = { enableRotate: true, enablePan: true, enabled: true };

  syncDiagram3dOrbitControlsForPointer(controls, {
    altKey: false,
    shiftKey: false,
    pointerType: "mouse",
  });
  assert.equal(controls.enableRotate, false);
  assert.equal(controls.enablePan, false);
  assert.equal(controls.enabled, true);

  syncDiagram3dOrbitControlsForPointer(controls, {
    altKey: true,
    shiftKey: false,
    pointerType: "mouse",
  });
  assert.equal(controls.enableRotate, true);
  assert.equal(controls.enablePan, true);
  assert.equal(controls.enabled, true);

  syncDiagram3dOrbitControlsForPointer(controls, {
    altKey: true,
    shiftKey: true,
    pointerType: "mouse",
  });
  assert.equal(controls.enableRotate, false);
  assert.equal(controls.enablePan, true);
  assert.equal(controls.enabled, true);
});
