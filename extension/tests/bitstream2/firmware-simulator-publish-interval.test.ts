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

test("firmware simulator: publishIntervalMs decimates telemetry", async () => {
  const tx: Uint8Array[] = [];
  const sim = new BsFirmwareSimulator((b) => tx.push(b), { defaultSensorConfigs: [] });

  try {
    const cfg = encodeSensorCfgBody({
      sensorId: BS2_SENSOR_ID.SHT40,
      enabled: true,
      publishMode: 0,
      mask: 0x01,
      samplingIntervalMs: 5,
      publishIntervalMs: 40,
      deltaX100: 0,
      minPublishIntervalMs: 0,
    });
    const wire = encodeBsEnvelope({
      type: BS_TYPE.REQ,
      payload: encodeReq({
        reqId: 1,
        cmdId: BS2_CMD.SENSOR_CFG_SET,
        flags: 0,
        body: cfg,
      }),
    }).bytes;
    sim.rxFromHost(wire);

    await new Promise((r) => setTimeout(r, 55));
    const decoder = new BsUartDecoder();
    let n = 0;
    for (const chunk of tx) {
      for (const ev of decoder.feed(chunk)) {
        if (ev.type === "sensor") n += 1;
      }
    }
    assert.ok(n >= 1 && n <= 3, `expected decimated events, got ${n}`);
  } finally {
    sim.dispose();
  }
});
