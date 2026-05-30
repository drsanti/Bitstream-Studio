import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeBmi270Values, BMI270_MASK } from "../../src/bitstream2/domains/sensors/bmi270";
import { fusionQuat4FromWireX10000 } from "../../src/webview/bitstream-app/components/3d-rotation/shared/bmi270FusionExtract.js";
import { bs2SampleToBitstreamSensorSampleV2 } from "../../src/webview/bitstream-app/bridge/bs2-sample-to-live-v2";
import { extractNormalizedQuatFromBmi270Sample } from "../../src/webview/bitstream-app/components/3d-rotation/shared/bmi270FusionExtract.js";
import { BS2_SENSOR_ID } from "../../src/bitstream2/domains/sensors/sensor-ids";

function encodeQuatWire(qw: number, qx: number, qy: number, qz: number): number[] {
  const wBucket = Math.round(qw * 10000 + 10000);
  return [
    wBucket,
    Math.round(qx * 10000),
    Math.round(qy * 10000),
    Math.round(qz * 10000),
  ];
}

describe("fusion quaternion wire decode (firmware parity)", () => {
  it("fusionQuat4FromWireX10000 matches firmware encode for identity", () => {
    const wire = encodeQuatWire(1, 0, 0, 0);
    const q = fusionQuat4FromWireX10000({
      fusionQuatWBucketX10000: wire[0],
      fusionQuatXX10000: wire[1],
      fusionQuatYX10000: wire[2],
      fusionQuatZX10000: wire[3],
    });
    assert.ok(Math.abs(q.qw - 1) < 0.002);
    assert.ok(Math.abs(q.qx) < 0.002);
    assert.ok(Math.abs(q.qy) < 0.002);
    assert.ok(Math.abs(q.qz) < 0.002);
  });

  it("decodeBmi270Values reads W bucket as uint16", () => {
    const len = Math.hypot(0.6, 0.2, 0.3, 0.4);
    const wire = encodeQuatWire(0.6 / len, 0.2 / len, 0.3 / len, 0.4 / len);
    const bytes = new Uint8Array(8);
    const view = new DataView(bytes.buffer);
    view.setUint16(0, wire[0], true);
    view.setInt16(2, wire[1], true);
    view.setInt16(4, wire[2], true);
    view.setInt16(6, wire[3], true);
    const r = decodeBmi270Values(BMI270_MASK.QUAT, bytes);
    assert.equal(r.ok, true);
    if (!r.ok) {
      return;
    }
    assert.equal(r.decoded.qw_x10000, wire[0]);
    const q = fusionQuat4FromWireX10000({
      fusionQuatWBucketX10000: r.decoded.qw_x10000!,
      fusionQuatXX10000: r.decoded.qx_x10000!,
      fusionQuatYX10000: r.decoded.qy_x10000!,
      fusionQuatZX10000: r.decoded.qz_x10000!,
    });
    assert.ok(Math.abs(q.qw - 0.6 / len) < 0.02);
  });

  it("bs2 path → extractNormalizedQuatFromBmi270Sample round-trip", () => {
    const wire = encodeQuatWire(1, 0, 0, 0);
    const sample = bs2SampleToBitstreamSensorSampleV2({
      sensorId: BS2_SENSOR_ID.BMI270,
      mask: BMI270_MASK.QUAT,
      counter: 1,
      tMs: 0,
      values: wire,
      atMs: Date.now(),
    });
    assert.ok(sample);
    const q = extractNormalizedQuatFromBmi270Sample(sample);
    const len = Math.hypot(q.qw, q.qx, q.qy, q.qz);
    assert.ok(Math.abs(len - 1) < 0.02);
    assert.ok(Math.abs(q.qw - 1) < 0.02);
  });
});
