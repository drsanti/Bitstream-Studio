import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  alignMappedFusionQuatToDisplay,
  capFusionQuatStepForDisplay,
  computeMeshTargetFusionQuat,
  createMeshOrientationScratch,
  eulerZyxDegFromFusionQuat,
  quaternionAngleDegBetween,
  quaternionAngleDegFromIdentity,
  wireEulerZyxDegFromHundredths,
} from "../../src/webview/bitstream-app/components/3d-rotation/shared/orientationPreviewMath.js";
import type { FusionQuat4 } from "../../src/webview/bitstream-app/components/3d-rotation/shared/orientationPreviewMath.js";

describe("orientationPreviewMath", () => {
  it("identity quaternion has zero angle from identity", () => {
    const deg = quaternionAngleDegFromIdentity({ qw: 1, qx: 0, qy: 0, qz: 0 });
    assert.ok(Math.abs(deg) < 1e-6);
  });

  it("180° flip has 180° angle from identity (either hemisphere)", () => {
    const deg = quaternionAngleDegFromIdentity({ qw: 0, qx: 1, qy: 0, qz: 0 });
    assert.ok(Math.abs(deg - 180) < 0.01);
  });

  it("angle between q and -q is zero", () => {
    const a = { qw: 0.8, qx: 0.2, qy: 0.4, qz: 0.4 };
    const b = { qw: -0.8, qx: -0.2, qy: -0.4, qz: -0.4 };
    const deg = quaternionAngleDegBetween(a, b);
    assert.ok(Math.abs(deg) < 0.01);
  });

  it("wire euler hundredths map to Three ZYX degrees", () => {
    const deg = wireEulerZyxDegFromHundredths({
      roll: 0,
      pitch: Math.round((Math.PI / 2) * 100),
      heading: 0,
    });
    assert.ok(Math.abs(deg.pitchDeg - 90) < 0.1);
    assert.ok(Math.abs(deg.rollDeg) < 0.1);
    assert.ok(Math.abs(deg.yawDeg) < 0.1);
  });

  it("alignMappedFusionQuatToDisplay keeps short arc vs previous display", () => {
    const prev = { qw: 1, qx: 0, qy: 0, qz: 0 };
    const mappedOpposite = { qw: -1, qx: 0, qy: 0, qz: 0 };
    const aligned = alignMappedFusionQuatToDisplay(mappedOpposite, prev);
    assert.ok(Math.abs(aligned.qw - 1) < 1e-6);
    assert.ok(quaternionAngleDegBetween(aligned, prev) < 0.01);
  });

  it("pcb-glb mapping differs from wire-direct for rotation about wire X", () => {
    const scratch = createMeshOrientationScratch();
    const half = (25 * Math.PI) / 180 / 2;
    const wire: FusionQuat4 = {
      qw: Math.cos(half),
      qx: Math.sin(half),
      qy: 0,
      qz: 0,
    };
    const direct = computeMeshTargetFusionQuat(
      {
        ...wire,
        fusionEulerHundredths: null,
        meshOrientationFromEulerFallback: false,
        eulerOnly: false,
        orientationMappingMode: "wire-direct",
      },
      scratch,
    );
    const mapped = computeMeshTargetFusionQuat(
      {
        ...wire,
        fusionEulerHundredths: null,
        meshOrientationFromEulerFallback: false,
        eulerOnly: false,
        orientationMappingMode: "pcb-glb",
      },
      scratch,
    );
    assert.ok(quaternionAngleDegBetween(direct, mapped) > 5);
    assert.ok(quaternionAngleDegBetween(direct, wire) < 0.5);
  });

  it("wire-direct mapping copies wire quaternion to mesh", () => {
    const scratch = createMeshOrientationScratch();
    const wire: FusionQuat4 = { qw: 1, qx: 0, qy: 0, qz: 0 };
    const out = computeMeshTargetFusionQuat(
      {
        ...wire,
        fusionEulerHundredths: null,
        meshOrientationFromEulerFallback: false,
        eulerOnly: false,
        orientationMappingMode: "wire-direct",
      },
      scratch,
    );
    assert.ok(quaternionAngleDegBetween(out, wire) < 0.5);
  });

  it("capFusionQuatStepForDisplay limits per-wire rotation", () => {
    const prev = { qw: 1, qx: 0, qy: 0, qz: 0 };
    const incoming = { qw: 0.7071, qx: 0.7071, qy: 0, qz: 0 };
    const capped = capFusionQuatStepForDisplay(prev, incoming, 10);
    const deg = quaternionAngleDegBetween(capped, prev);
    assert.ok(deg <= 10.5);
    assert.ok(deg >= 9);
  });

  it("mesh target at identity wire quat is finite", () => {
    const scratch = createMeshOrientationScratch();
    const out = computeMeshTargetFusionQuat(
      {
        qw: 1,
        qx: 0,
        qy: 0,
        qz: 0,
        fusionEulerHundredths: null,
        meshOrientationFromEulerFallback: false,
        eulerOnly: false,
      },
      scratch,
    );
    assert.ok(Number.isFinite(out.qw));
    const euler = eulerZyxDegFromFusionQuat(out);
    assert.ok(Number.isFinite(euler.pitchDeg));
  });
});
