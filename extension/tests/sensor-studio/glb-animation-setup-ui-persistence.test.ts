import assert from "node:assert/strict";
import test from "node:test";

import {
  readStoredGlbAnimationSetupCombinerMode,
  writeStoredGlbAnimationSetupCombinerMode,
} from "../../src/webview/sensor-studio/features/editor/components/node-palette/glb-animation-setup-ui-persistence";

test("glb animation setup combiner mode defaults to mix", () => {
  const prev = globalThis.localStorage;
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    },
    configurable: true,
  });
  try {
    assert.equal(readStoredGlbAnimationSetupCombinerMode(), "mix");
    writeStoredGlbAnimationSetupCombinerMode("merge");
    assert.equal(readStoredGlbAnimationSetupCombinerMode(), "merge");
    writeStoredGlbAnimationSetupCombinerMode("mix");
    assert.equal(readStoredGlbAnimationSetupCombinerMode(), "mix");
  } finally {
    Object.defineProperty(globalThis, "localStorage", { value: prev, configurable: true });
  }
});
