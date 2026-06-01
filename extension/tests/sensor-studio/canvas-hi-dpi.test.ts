import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveStudioCanvasDpr,
  resolveStudioWebGlPixelRatio,
} from "../../src/webview/sensor-studio/features/editor/nodes/display/canvas-hi-dpi";

describe("resolveStudioCanvasDpr", () => {
  it("defaults display scale to 1", () => {
    const original = globalThis.window;
    // @ts-expect-error test shim
    globalThis.window = { devicePixelRatio: 2 };
    try {
      assert.equal(resolveStudioCanvasDpr(), 2);
      assert.equal(resolveStudioCanvasDpr(1), 2);
    } finally {
      globalThis.window = original;
    }
  });

  it("multiplies device pixel ratio by viewport zoom", () => {
    const original = globalThis.window;
    // @ts-expect-error test shim
    globalThis.window = { devicePixelRatio: 2 };
    try {
      assert.equal(resolveStudioCanvasDpr(1.5), 3);
    } finally {
      globalThis.window = original;
    }
  });

  it("caps extreme scale", () => {
    const original = globalThis.window;
    // @ts-expect-error test shim
    globalThis.window = { devicePixelRatio: 3 };
    try {
      assert.equal(resolveStudioCanvasDpr(2), 4);
    } finally {
      globalThis.window = original;
    }
  });

  it("ignores invalid display scale", () => {
    const original = globalThis.window;
    // @ts-expect-error test shim
    globalThis.window = { devicePixelRatio: 2 };
    try {
      assert.equal(resolveStudioCanvasDpr(0), 2);
      assert.equal(resolveStudioCanvasDpr(Number.NaN), 2);
    } finally {
      globalThis.window = original;
    }
  });
});

describe("resolveStudioWebGlPixelRatio", () => {
  it("respects dprMin and scales with viewport zoom", () => {
    const original = globalThis.window;
    // @ts-expect-error test shim
    globalThis.window = { devicePixelRatio: 2 };
    try {
      assert.equal(
        resolveStudioWebGlPixelRatio({ dprMin: 1, dprMax: 2 }, 1.5),
        3,
      );
      assert.equal(
        resolveStudioWebGlPixelRatio({ dprMin: 1.5, dprMax: 2 }, 1),
        2,
      );
    } finally {
      globalThis.window = original;
    }
  });
});
