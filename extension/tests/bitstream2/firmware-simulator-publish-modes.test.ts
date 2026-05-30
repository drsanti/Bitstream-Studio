import assert from "node:assert/strict";
import test from "node:test";
import { BsFirmwareSimulator } from "../../src/bitstream2/device/firmware-simulator";
import { BS2_SENSOR_ID } from "../../src/bitstream2/domains/sensors/sensor-ids";
import { encodeSensorCfgBody } from "../../src/bitstream2/domains/config/sensor-config";
import { BS2_CMD } from "../../src/bitstream2/domains/config/commands";
import { encodeReq } from "../../src/bitstream2/protocol/req-res";
import { encodeBsEnvelope } from "../../src/bitstream2/framing/bs-envelope";
import { BS_TYPE } from "../../src/bitstream2/protocol/types";
import { BsUartDecoder } from "../../src/bitstream2/runtime/uart-decode";

function applyCfg(sim: BsFirmwareSimulator, tx: Uint8Array[], cfgBody: Uint8Array): void {
  const reqPayload = encodeReq({
    reqId: 1,
    cmdId: BS2_CMD.SENSOR_CFG_SET,
    flags: 0,
    body: cfgBody,
  });
  const wire = encodeBsEnvelope({ type: BS_TYPE.REQ, payload: reqPayload }).bytes;
  sim.rxFromHost(wire);
  tx.length = 0;
}

function countSensorEvents(tx: Uint8Array[]): number {
  const decoder = new BsUartDecoder();
  let n = 0;
  for (const chunk of tx) {
    for (const ev of decoder.feed(chunk)) {
      if (ev.type === "sensor") n += 1;
    }
  }
  return n;
}

test("firmware simulator: on_change vs periodic publish rate", async () => {
  const tx: Uint8Array[] = [];
  const sim = new BsFirmwareSimulator((b) => tx.push(b), {
    defaultSensorConfigs: [],
  });

  try {
    applyCfg(
      sim,
      tx,
      encodeSensorCfgBody({
        sensorId: BS2_SENSOR_ID.BMM350,
        enabled: true,
        publishMode: 1,
        mask: 0x01,
      samplingIntervalMs: 5,
      publishIntervalMs: 0,
      deltaX100: 65535,
      minPublishIntervalMs: 0,
      }),
    );

    await new Promise((r) => setTimeout(r, 45));
    const onChangeCount = countSensorEvents(tx);
    assert.ok(onChangeCount <= 2, `on_change expected ≤2 events, got ${onChangeCount}`);

    tx.length = 0;
    applyCfg(
      sim,
      tx,
      encodeSensorCfgBody({
        sensorId: BS2_SENSOR_ID.BMM350,
        enabled: true,
        publishMode: 0,
        mask: 0x01,
      samplingIntervalMs: 5,
      publishIntervalMs: 0,
      deltaX100: 0,
      minPublishIntervalMs: 0,
      }),
    );

    await new Promise((r) => setTimeout(r, 45));
    const periodicCount = countSensorEvents(tx);
    assert.ok(periodicCount >= 5, `periodic expected ≥5 events, got ${periodicCount}`);
    assert.ok(
      periodicCount > onChangeCount,
      `periodic (${periodicCount}) should exceed on_change (${onChangeCount})`,
    );
  } finally {
    sim.dispose();
  }
});
