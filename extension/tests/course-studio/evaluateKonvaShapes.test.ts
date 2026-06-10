import assert from "node:assert/strict";
import test from "node:test";

import { collectDiagramBindingPaths } from "../../src/webview/course-studio/runtime/diagram/collectDiagramBindings";
import { evaluateKonvaShapes } from "../../src/webview/course-studio/runtime/diagram/evaluateKonvaShapes";
import type { DiagramLiveSnapshot } from "../../src/webview/course-studio/runtime/diagram/diagramBindingCatalog";
import { parseDiagramV1 } from "../../src/webview/course-studio/schemas/diagram.v1";
import { presentationBmi270FromSample } from "../../src/webview/presentation/display/selectors";
import { diagramLiveSnapshot } from "./diagramLiveSnapshotFixtures";

function liveSnapshot(ax: number): DiagramLiveSnapshot {
  return diagramLiveSnapshot({
    connected: true,
    bmi270: { ...presentationBmi270FromSample(null), ax, hasSample: true, accValid: true },
  });
}

test("evaluateKonvaShapes applies numeric and text property bindings", () => {
  const diagram = parseDiagramV1({
    version: 1,
    id: "konva-bindings",
    viewBox: [0, 0, 640, 480],
    freeform: {
      engine: "konva",
      shapes: [
        { id: "mass", type: "rect", x: 100, y: 200, width: 40, height: 40 },
        { id: "label", type: "text", x: 10, y: 10, text: "static" },
      ],
      propertyBindings: {
        mass: {
          y: {
            base: 200,
            mode: "add",
            binding: {
              path: "bmi270.ax",
              map: [{ op: "scale", inMin: -1, inMax: 1, outMin: -40, outMax: 40 }],
              fallback: 0,
            },
          },
        },
        label: {
          text: {
            binding: { path: "bmi270.ax", format: "0.00", unit: "g", fallback: 0 },
            prefix: "aX ",
          },
        },
      },
    },
  });

  const resolved = evaluateKonvaShapes(diagram.freeform!, liveSnapshot(0.5));
  const mass = resolved.find((entry) => entry.id === "mass");
  const label = resolved.find((entry) => entry.id === "label");
  assert.equal(mass?.y, 220);
  assert.equal(label?.text, "aX 0.50 g");
});

test("evaluateKonvaShapes uses opacity scale 0–1", () => {
  const diagram = parseDiagramV1({
    version: 1,
    id: "konva-opacity",
    viewBox: [0, 0, 640, 480],
    freeform: {
      engine: "konva",
      shapes: [{ id: "fade", type: "rect", x: 0, y: 0, width: 10, height: 10, opacity: 1 }],
      propertyBindings: {
        fade: {
          opacity: {
            base: 0,
            mode: "absolute",
            binding: {
              path: "bmi270.ax",
              map: [{ op: "scale", inMin: 0, inMax: 1, outMin: 0.2, outMax: 0.8 }],
              fallback: 0,
            },
          },
        },
      },
    },
  });

  const resolved = evaluateKonvaShapes(diagram.freeform!, liveSnapshot(0.5));
  assert.equal(resolved.find((entry) => entry.id === "fade")?.opacity, 0.5);
});

test("evaluateKonvaShapes visible gate toggles opacity", () => {
  const diagram = parseDiagramV1({
    version: 1,
    id: "konva-visible",
    viewBox: [0, 0, 640, 480],
    freeform: {
      engine: "konva",
      shapes: [{ id: "chip", type: "rect", x: 0, y: 0, width: 10, height: 10, opacity: 1 }],
      propertyBindings: {
        chip: {
          visible: { path: "bmi270.hasSample", fallback: 0 },
        },
      },
    },
  });

  const visible = evaluateKonvaShapes(diagram.freeform!, liveSnapshot(0));
  assert.equal(visible.find((entry) => entry.id === "chip")?.opacity, 1);

  const hidden = evaluateKonvaShapes(diagram.freeform!, diagramLiveSnapshot({
    connected: true,
    bmi270: { ...presentationBmi270FromSample(null), hasSample: false, accValid: false },
  }));
  assert.equal(hidden.find((entry) => entry.id === "chip")?.opacity, 0);
});

test("evaluateKonvaShapes tracks changing telemetry samples", () => {
  const diagram = parseDiagramV1({
    version: 1,
    id: "konva-drift",
    viewBox: [0, 0, 640, 480],
    freeform: {
      engine: "konva",
      shapes: [{ id: "mass", type: "rect", x: 0, y: 200, width: 10, height: 10 }],
      propertyBindings: {
        mass: {
          y: {
            base: 200,
            mode: "add",
            binding: {
              path: "bmi270.ax",
              map: [{ op: "scale", inMin: -1, inMax: 1, outMin: -40, outMax: 40 }],
              fallback: 0,
            },
          },
        },
      },
    },
  });

  const low = evaluateKonvaShapes(diagram.freeform!, liveSnapshot(-1));
  const high = evaluateKonvaShapes(diagram.freeform!, liveSnapshot(1));
  assert.equal(low.find((entry) => entry.id === "mass")?.y, 160);
  assert.equal(high.find((entry) => entry.id === "mass")?.y, 240);
});

test("collectDiagramBindingPaths includes konva property bindings", () => {
  const diagram = parseDiagramV1({
    version: 1,
    id: "konva-collect",
    viewBox: [0, 0, 640, 480],
    freeform: {
      engine: "konva",
      shapes: [{ id: "a", type: "circle", x: 0, y: 0, radius: 10 }],
      propertyBindings: {
        a: {
          opacity: {
            base: 0,
            mode: "absolute",
            binding: { path: "bmi270.heading", fallback: 0 },
          },
          visible: { path: "bmi270.hasSample", fallback: 0 },
        },
      },
    },
  });
  const paths = collectDiagramBindingPaths(diagram);
  assert.ok(paths.includes("bmi270.heading"));
  assert.ok(paths.includes("bmi270.hasSample"));
});
