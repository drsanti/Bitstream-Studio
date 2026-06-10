import assert from "node:assert/strict";
import test from "node:test";

import {
  DIAGRAM_BINDING_CATALOG,
  catalogEntryForPath,
  catalogSensorForPath,
  resolveBindingDisplayUnit,
  resolveDiagramBindingPath,
  snapshotHasAnySensorSample,
  snapshotHasSampleForBindingPath,
} from "../../src/webview/course-studio/runtime/diagram/diagramBindingCatalog";
import { presentationBmi270FromSample } from "../../src/webview/presentation/display/selectors";
import { diagramLiveSnapshot } from "./diagramLiveSnapshotFixtures";

const snapshot = diagramLiveSnapshot({
  connected: true,
  bmi270: {
    ...presentationBmi270FromSample(null),
    ax: 0.12,
    ay: -0.08,
    az: -0.98,
    heading: 45,
    pitch: -5,
    roll: 10,
    temp: 26.5,
    qw: 0.9,
    accValid: true,
    hasSample: true,
  },
  bmm350: { bx: 10, by: 20, bz: 30, headingDeg: 90, magnitude: 37.4, hasSample: true },
  sht40: { temp: 24.5, rh: 55, hasSample: true },
  dps368: { pressureHpa: 1013, altitudeM: 120, hasSample: true },
});

test("DIAGRAM_BINDING_CATALOG covers all four sensors and bridge", () => {
  const ids = new Set(DIAGRAM_BINDING_CATALOG.map((e) => e.id));
  for (const path of [
    "bmi270.ax",
    "bmi270.heading",
    "bmm350.headingDeg",
    "sht40.rh",
    "dps368.pressureHpa",
    "bridge.connected",
  ]) {
    assert.ok(ids.has(path), `missing catalog entry ${path}`);
  }
  assert.ok(DIAGRAM_BINDING_CATALOG.length >= 40);
});

test("catalogSensorForPath routes paths to sensor tabs", () => {
  assert.equal(catalogSensorForPath("bmm350.bx"), "bmm350");
  assert.equal(catalogSensorForPath("sht40.temp"), "sht40");
  assert.equal(catalogSensorForPath("dps368.altitudeM"), "dps368");
  assert.equal(catalogSensorForPath("bridge.connected"), "bridge");
});

test("resolveDiagramBindingPath resolves BMI270 fusion and derived paths", () => {
  assert.equal(resolveDiagramBindingPath("bmi270.ax", snapshot), 0.12);
  assert.equal(resolveDiagramBindingPath("bmi270.axAbs", snapshot), 0.12);
  assert.equal(resolveDiagramBindingPath("bmi270.ayAbs", snapshot), 0.08);
  assert.equal(resolveDiagramBindingPath("bmi270.azAbs", snapshot), 0.98);
  assert.equal(
    resolveDiagramBindingPath("bmi270.accMag", snapshot),
    Math.hypot(0.12, -0.08, -0.98),
  );
  assert.equal(
    resolveDiagramBindingPath("bmi270.gyrMag", snapshot),
    Math.hypot(snapshot.bmi270.gx, snapshot.bmi270.gy, snapshot.bmi270.gz),
  );
  assert.equal(resolveDiagramBindingPath("bmi270.heading", snapshot), 45);
  assert.equal(resolveDiagramBindingPath("bmi270.qw", snapshot), 0.9);
  assert.equal(resolveDiagramBindingPath("bmi270.temp", snapshot), 26.5);
  assert.equal(resolveDiagramBindingPath("bmi270.accValid", snapshot), true);
  assert.equal(resolveDiagramBindingPath("bridge.connected", snapshot), true);
  assert.equal(resolveDiagramBindingPath("unknown.path", snapshot), null);
});

test("resolveDiagramBindingPath resolves BMM350, SHT40, and DPS368 paths", () => {
  assert.equal(resolveDiagramBindingPath("bmm350.bx", snapshot), 10);
  assert.equal(resolveDiagramBindingPath("bmm350.headingDeg", snapshot), 90);
  assert.equal(resolveDiagramBindingPath("sht40.rh", snapshot), 55);
  assert.equal(resolveDiagramBindingPath("dps368.pressureHpa", snapshot), 1013);
  assert.equal(resolveDiagramBindingPath("dps368.altitudeM", snapshot), 120);
});

test("snapshotHasSampleForBindingPath is path-aware", () => {
  const onlyBmm = diagramLiveSnapshot({
    connected: true,
    bmm350: { hasSample: true },
  });
  assert.equal(snapshotHasSampleForBindingPath("bmm350.bx", onlyBmm), true);
  assert.equal(snapshotHasSampleForBindingPath("bmi270.ax", onlyBmm), false);
  assert.equal(snapshotHasAnySensorSample(onlyBmm), true);
});

test("catalogEntryForPath returns metadata for inspector defaults", () => {
  const entry = catalogEntryForPath("bmi270.heading");
  assert.equal(entry?.unit, "°");
  assert.equal(entry?.valueKind, "number");
  assert.equal(catalogEntryForPath("bmm350.headingDeg")?.unit, "°");
});

test("resolveBindingDisplayUnit uses catalog unit for fusion paths", () => {
  assert.equal(
    resolveBindingDisplayUnit({ path: "bmi270.heading", unit: "g", fallback: 0 }),
    "°",
  );
  assert.equal(
    resolveBindingDisplayUnit({ path: "bmi270.ax", unit: "g", fallback: 0 }),
    "g",
  );
});
