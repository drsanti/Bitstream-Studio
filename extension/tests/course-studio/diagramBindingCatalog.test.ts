import assert from "node:assert/strict";
import test from "node:test";

import {
  DIAGRAM_BINDING_CATALOG,
  catalogEntryForPath,
  resolveDiagramBindingPath,
} from "../../src/webview/course-studio/runtime/diagram/diagramBindingCatalog";
import type { DiagramLiveSnapshot } from "../../src/webview/course-studio/runtime/diagram/diagramBindingCatalog";
import { presentationBmi270FromSample } from "../../src/webview/presentation/display/selectors";

const snapshot: DiagramLiveSnapshot = {
  bmi270: {
    ...presentationBmi270FromSample(null),
    ax: 0.12,
    heading: 45,
    pitch: -5,
    roll: 10,
    temp: 26.5,
    qw: 0.9,
    accValid: true,
    hasSample: true,
  },
  connected: true,
};

test("DIAGRAM_BINDING_CATALOG covers PresentationBmi270Frame numeric and boolean fields", () => {
  const ids = new Set(DIAGRAM_BINDING_CATALOG.map((e) => e.id));
  for (const path of [
    "bmi270.ax",
    "bmi270.heading",
    "bmi270.qw",
    "bmi270.temp",
    "bmi270.accValid",
    "bridge.connected",
  ]) {
    assert.ok(ids.has(path), `missing catalog entry ${path}`);
  }
  assert.ok(DIAGRAM_BINDING_CATALOG.length >= 15);
});

test("resolveDiagramBindingPath resolves fusion and status paths", () => {
  assert.equal(resolveDiagramBindingPath("bmi270.ax", snapshot), 0.12);
  assert.equal(resolveDiagramBindingPath("bmi270.axAbs", snapshot), 0.12);
  assert.equal(resolveDiagramBindingPath("bmi270.heading", snapshot), 45);
  assert.equal(resolveDiagramBindingPath("bmi270.qw", snapshot), 0.9);
  assert.equal(resolveDiagramBindingPath("bmi270.temp", snapshot), 26.5);
  assert.equal(resolveDiagramBindingPath("bmi270.accValid", snapshot), true);
  assert.equal(resolveDiagramBindingPath("bridge.connected", snapshot), true);
  assert.equal(resolveDiagramBindingPath("unknown.path", snapshot), null);
});

test("catalogEntryForPath returns metadata for inspector defaults", () => {
  const entry = catalogEntryForPath("bmi270.heading");
  assert.equal(entry?.unit, "°");
  assert.equal(entry?.valueKind, "number");
});
