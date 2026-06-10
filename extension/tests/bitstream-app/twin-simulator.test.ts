import assert from "node:assert/strict";
import test from "node:test";
import { evaluateTwinSignalHealth } from "../../src/webview/bitstream-app/components/animation-lab/animation-lab-twin-health.js";
import { buildDefaultDroneDigitalTwinFromClips } from "../../src/webview/bitstream-app/components/animation-lab/build-default-drone-digital-twin.js";
import { runAnimationLabTwinSimulator } from "../../src/webview/bitstream-app/components/animation-lab/animation-lab-twin-simulator.js";
import { buildTwinSparklinePolylinePoints } from "../../src/webview/bitstream-app/components/animation-lab/animation-lab-twin-trends.js";

const CLIPS = [
  "Gimbal1Action",
  "Gimbal2Action",
  "CameraAction",
  "Wing back leftAction",
  "Wing back rightAction",
];

test("buildTwinSparklinePolylinePoints stretches absolute telemetry to full height", () => {
  const points = buildTwinSparklinePolylinePoints([40.2, 41.5, 43.1, 44.8, 46], 72);
  const ys = points.split(" ").map((pair) => Number.parseFloat(pair.split(",")[1] ?? "50"));
  assert.ok(Math.max(...ys) - Math.min(...ys) > 50);
});

test("evaluateTwinSignalHealth maps warn / caution / alarm bands", () => {
  const def = { key: "x", label: "X", unit: "", warn: 10, alarm: 20 };
  assert.equal(evaluateTwinSignalHealth(5, def), "ok");
  assert.equal(evaluateTwinSignalHealth(9, def), "caution");
  assert.equal(evaluateTwinSignalHealth(12, def), "warning");
  assert.equal(evaluateTwinSignalHealth(22, def), "error");
});

test("parallel-all + stopped keeps simulated components healthy", () => {
  const twin = buildDefaultDroneDigitalTwinFromClips(CLIPS);
  assert.ok(twin != null);
  const result = runAnimationLabTwinSimulator({
    twin,
    nowMs: 10_000,
    playbackMode: "parallel-all",
    activeClipName: "Gimbal1Action",
    transport: "stopped",
    demoFaultEnabled: false,
  });
  const warningCount = result.components.filter(
    (c) => c.health === "warning" || c.health === "error",
  ).length;
  assert.equal(warningCount, 0);
  assert.equal(result.summary.health, "ok");
});

test("parallel-all + playing yields mixed health, not all warning", () => {
  const twin = buildDefaultDroneDigitalTwinFromClips(CLIPS);
  assert.ok(twin != null);
  const result = runAnimationLabTwinSimulator({
    twin,
    nowMs: 10_000,
    playbackMode: "parallel-all",
    activeClipName: "Gimbal1Action",
    transport: "playing",
    demoFaultEnabled: false,
  });
  const warningCount = result.components.filter((c) => c.health === "warning").length;
  assert.ok(warningCount < result.components.length);
});
