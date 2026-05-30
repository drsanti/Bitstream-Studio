import assert from "node:assert/strict";
import test from "node:test";
import { BsMockFirmware } from "../../src/bitstream2/dev/mock-firmware";
import { BsSession } from "../../src/bitstream2/runtime/session";
import { BsUartDecoder } from "../../src/bitstream2/runtime/uart-decode";
import { BS2_CMD } from "../../src/bitstream2/domains/config/commands";
import { decodeSensorCfgBody, encodeSensorCfgGetBody } from "../../src/bitstream2/domains/config/sensor-config";

function runLoopback(): {
  mock: BsMockFirmware;
  decoder: BsUartDecoder;
  session: BsSession;
  drainRx: () => ReturnType<BsUartDecoder["feed"]>;
} {
  const decoder = new BsUartDecoder();
  const rx: Uint8Array[] = [];
  const mock = new BsMockFirmware((bytes) => rx.push(bytes));
  const session = new BsSession({
    write: async (bytes) => {
      mock.rxFromHost(bytes);
      drainRx();
    },
  });

  const drainRx = () => {
    const events: ReturnType<BsUartDecoder["feed"]> = [];
    while (rx.length > 0) {
      const chunk = rx.shift()!;
      for (const ev of decoder.feed(chunk)) {
        events.push(ev);
        if (ev.type === "res_frame") session.handleFrame(ev.frame);
      }
    }
    return events;
  };

  return { mock, decoder, session, drainRx };
}

test("mock firmware: HELLO and BMI270 sample decode", () => {
  const { mock, drainRx } = runLoopback();
  mock.emitHello();
  const events = drainRx();
  assert.ok(events.some((e) => e.type === "hello"));

  mock.emitBmi270AccSample(999);
  const sensor = drainRx().find((e) => e.type === "sensor");
  assert.ok(sensor && sensor.type === "sensor");
  assert.ok(sensor.payload.values.length >= 3);
  assert.equal(sensor.payload.tMs, 999);
});

test("mock firmware: PING and SENSOR_CFG_GET REQ/RES", async () => {
  const { mock, session, drainRx } = runLoopback();

  const ping = await session.sendReq({
    requestId: "ping-1",
    cmdId: BS2_CMD.PING,
    timeoutMs: 500,
  });
  assert.equal(ping.status, 0);
  drainRx();

  const cfgRes = await session.sendReq({
    requestId: "cfg-1",
    cmdId: BS2_CMD.SENSOR_CFG_GET,
    body: encodeSensorCfgGetBody(0),
    timeoutMs: 500,
  });
  assert.equal(cfgRes.status, 0);
  const cfg = decodeSensorCfgBody(cfgRes.body);
  assert.ok(cfg);
  assert.equal(cfg.enabled, true);

  mock.emitHello();
  drainRx();
});
