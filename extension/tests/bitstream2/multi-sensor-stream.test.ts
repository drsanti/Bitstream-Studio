import assert from "node:assert/strict";
import test from "node:test";
import { BsFirmwareSimulator } from "../../src/bitstream2/device/firmware-simulator";
import { BsUartDecoder } from "../../src/bitstream2/runtime/uart-decode";
import { BS2_SIM_BOARD_PROFILE } from "../../src/bitstream2/device/board-profile";
import { BS2_SENSOR_ID } from "../../src/bitstream2/domains/sensors/sensor-ids";

test("firmware simulator: full board profile streams all sensors", async () => {
  const decoder = new BsUartDecoder();
  const rx: Uint8Array[] = [];
  const sim = new BsFirmwareSimulator((b) => rx.push(b), {
    defaultSensorConfigs: BS2_SIM_BOARD_PROFILE.defaultSensorConfigs.map((c) => ({ ...c })),
  });
  sim.onBoot();

  const drain = () => {
    const seen = new Set<number>();
    while (rx.length > 0) {
      for (const ev of decoder.feed(rx.shift()!)) {
        if (ev.type === "sensor") seen.add(ev.payload.sensorId);
      }
    }
    return seen;
  };

  await new Promise((r) => setTimeout(r, 350));
  const seen = drain();
  assert.ok(seen.has(BS2_SENSOR_ID.BMI270), "BMI270 samples");
  assert.ok(seen.has(BS2_SENSOR_ID.BMM350), "BMM350 samples");
  assert.ok(seen.has(BS2_SENSOR_ID.SHT40), "SHT40 samples");
  assert.ok(seen.has(BS2_SENSOR_ID.DPS368), "DPS368 samples");
  sim.dispose();
});
