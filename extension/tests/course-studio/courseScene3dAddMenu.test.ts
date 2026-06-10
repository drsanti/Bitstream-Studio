import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildCourseScene3dAddMenuEntries,
  filterCourseScene3dAddMenuEntries,
  spawnCourseScene3dGroupNode,
} from "../../src/webview/course-studio/maintainer/courseScene3dAddCatalog";
import {
  clampCourseDiagram3dGizmoSize,
  COURSE_DIAGRAM_3D_GIZMO_SIZE_DEFAULT,
  readStoredCourseDiagram3dGizmoSize,
  readStoredCourseDiagram3dProjection,
  writeStoredCourseDiagram3dProjection,
} from "../../src/webview/course-studio/maintainer/course-diagram-3d-viewport.persistence";
import {
  computeOrthoZoomFromPerspectiveView,
  computePerspectiveDistanceFromOrthographicView,
  STUDIO_VIEWPORT_ORTHO_FRUSTUM_HEIGHT,
} from "../../src/webview/sensor-studio/core/viewport/studio-viewport-projection";
import {
  readDiagram3dProjectionToggleFromKeyboardEvent,
  readDiagram3dViewSnapFromKeyboardEvent,
} from "../../src/webview/course-studio/runtime/diagram/diagram3dViewSnapShortcuts";

describe("readDiagram3dViewSnapFromKeyboardEvent", () => {
  it("maps numpad and top-row number keys to cardinal views", () => {
    assert.equal(
      readDiagram3dViewSnapFromKeyboardEvent({ code: "Numpad1" } as KeyboardEvent),
      "front",
    );
    assert.equal(
      readDiagram3dViewSnapFromKeyboardEvent({ code: "Digit1" } as KeyboardEvent),
      "front",
    );
    assert.equal(
      readDiagram3dViewSnapFromKeyboardEvent({ code: "Numpad3" } as KeyboardEvent),
      "right",
    );
    assert.equal(
      readDiagram3dViewSnapFromKeyboardEvent({ code: "Digit7" } as KeyboardEvent),
      "top",
    );
    assert.equal(
      readDiagram3dViewSnapFromKeyboardEvent({ code: "Numpad9" } as KeyboardEvent),
      "back",
    );
    assert.equal(
      readDiagram3dViewSnapFromKeyboardEvent({
        code: "Digit1",
        ctrlKey: true,
      } as KeyboardEvent),
      null,
    );
  });
});

describe("readDiagram3dProjectionToggleFromKeyboardEvent", () => {
  it("maps numpad and top-row 5 to projection toggle", () => {
    assert.equal(
      readDiagram3dProjectionToggleFromKeyboardEvent({ code: "Numpad5" } as KeyboardEvent),
      true,
    );
    assert.equal(
      readDiagram3dProjectionToggleFromKeyboardEvent({ code: "Digit5" } as KeyboardEvent),
      true,
    );
    assert.equal(
      readDiagram3dProjectionToggleFromKeyboardEvent({
        code: "Digit5",
        shiftKey: true,
      } as KeyboardEvent),
      false,
    );
  });
});

describe("computeOrthoZoomFromPerspectiveView", () => {
  it("derives ortho zoom from orbit distance and FOV so framing matches perspective", () => {
    const distance = 5;
    const fovDeg = 45;
    const visibleHeight = 2 * distance * Math.tan((fovDeg * Math.PI) / 180 / 2);
    const zoom = computeOrthoZoomFromPerspectiveView({ distance, fovDeg });
    assert.equal(zoom, STUDIO_VIEWPORT_ORTHO_FRUSTUM_HEIGHT / visibleHeight);
    assert.ok(zoom < 1, "default orbit distance should yield zoom below 1, not hard-coded 1");
  });

  it("round-trips with computePerspectiveDistanceFromOrthographicView", () => {
    const distance = 8;
    const fovDeg = 45;
    const zoom = computeOrthoZoomFromPerspectiveView({ distance, fovDeg });
    const restored = computePerspectiveDistanceFromOrthographicView({ orthoZoom: zoom, fovDeg });
    assert.ok(Math.abs(restored - distance) < 1e-6);
  });
});

describe("courseDiagram3dProjection persistence", () => {
  it("round-trips perspective and orthographic modes", () => {
    const backing = new Map<string, string>();
    const prev = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: (key: string) => backing.get(key) ?? null,
        setItem: (key: string, value: string) => {
          backing.set(key, value);
        },
        removeItem: (key: string) => {
          backing.delete(key);
        },
      },
      configurable: true,
    });
    try {
      writeStoredCourseDiagram3dProjection("perspective");
      assert.equal(readStoredCourseDiagram3dProjection(), "perspective");
      writeStoredCourseDiagram3dProjection("orthographic");
      assert.equal(readStoredCourseDiagram3dProjection(), "orthographic");
    } finally {
      Object.defineProperty(globalThis, "localStorage", {
        value: prev,
        configurable: true,
      });
    }
  });
});

describe("courseDiagram3dGizmoSize persistence", () => {
  it("clamps gizmo size to the supported range", () => {
    assert.equal(clampCourseDiagram3dGizmoSize(0.1), 0.6);
    assert.equal(clampCourseDiagram3dGizmoSize(99), 2.5);
    assert.equal(clampCourseDiagram3dGizmoSize(Number.NaN), COURSE_DIAGRAM_3D_GIZMO_SIZE_DEFAULT);
    assert.equal(readStoredCourseDiagram3dGizmoSize(), COURSE_DIAGRAM_3D_GIZMO_SIZE_DEFAULT);
  });
});

describe("courseScene3dAddCatalog", () => {
  it("includes mesh box and preset entries", () => {
    const entries = buildCourseScene3dAddMenuEntries();
    assert.ok(entries.some((entry) => entry.id === "mesh-box"));
    assert.ok(entries.some((entry) => entry.id === "mesh-sphere"));
    assert.ok(entries.some((entry) => entry.id === "mesh-cylinder"));
    assert.ok(entries.some((entry) => entry.id === "mesh-cone"));
    assert.ok(entries.some((entry) => entry.id === "mesh-plane"));
    assert.ok(entries.some((entry) => entry.id === "mesh-torus"));
    assert.ok(entries.some((entry) => entry.id === "mesh-capsule"));
    assert.ok(entries.some((entry) => entry.id === "mesh-ring"));
    assert.ok(entries.some((entry) => entry.id === "mesh-icosahedron"));
    assert.ok(entries.some((entry) => entry.id === "mesh-torus-knot"));
    assert.ok(entries.some((entry) => entry.id === "preset-pcb"));
    assert.ok(entries.some((entry) => entry.id === "preset-axis-triad"));
  });

  it("filters add menu rows by search query", () => {
    const entries = buildCourseScene3dAddMenuEntries();
    const rows = filterCourseScene3dAddMenuEntries(entries, "pcb");
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.entry.id, "preset-pcb");
    assert.equal(rows[0]?.categoryLabel, "Presets");
  });

  it("spawns an empty group node", () => {
    const node = spawnCourseScene3dGroupNode();
    assert.equal(node.type, "group3d");
  });
});
