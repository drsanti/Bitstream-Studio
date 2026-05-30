import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { base64ToBytes } from "../../src/bitstream2/util/base64";
import { BsUartDecoder } from "../../src/bitstream2/runtime/uart-decode";

type GoldenFixture = {
  id: string;
  description: string;
  wireB64: string;
  expect: {
    event: string;
    version?: number;
    fwTag?: string;
    sensorId?: number;
    mask?: number;
    counter?: number;
    tMs?: number;
    values?: number[];
    valuesLength?: number;
  };
};

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../fixtures/bitstream2-golden",
);

function loadFixtures(): GoldenFixture[] {
  return fs
    .readdirSync(fixtureDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(fixtureDir, f), "utf8")) as GoldenFixture);
}

test("golden wire captures decode to expected broker events", () => {
  const fixtures = loadFixtures();
  assert.ok(fixtures.length >= 4, "expected golden fixtures in tests/fixtures/bitstream2-golden");

  for (const fx of fixtures) {
    const decoder = new BsUartDecoder();
    const events = decoder.feed(base64ToBytes(fx.wireB64));

    if (fx.expect.event === "hello") {
      const hello = events.find((e) => e.type === "hello");
      assert.ok(hello && hello.type === "hello", `${fx.id}: missing hello`);
      if (fx.expect.version != null) assert.equal(hello.payload.version, fx.expect.version);
      if (fx.expect.fwTag != null) assert.equal(hello.payload.fwTag, fx.expect.fwTag);
      continue;
    }

    if (fx.expect.event === "req_ping") {
      assert.equal(events.length, 0, `${fx.id}: REQ wire should not decode as device RX event`);
      continue;
    }

    if (fx.expect.event === "sensor") {
      const sensor = events.find((e) => e.type === "sensor");
      assert.ok(sensor && sensor.type === "sensor", `${fx.id}: missing sensor`);
      assert.equal(sensor.payload.sensorId, fx.expect.sensorId);
      assert.equal(sensor.payload.mask, fx.expect.mask);
      assert.equal(sensor.payload.counter, fx.expect.counter);
      if (fx.expect.tMs != null) assert.equal(sensor.payload.tMs, fx.expect.tMs);
      if (fx.expect.values != null) {
        assert.deepEqual(sensor.payload.values, fx.expect.values);
      }
      if (fx.expect.valuesLength != null) {
        assert.equal(sensor.payload.values.length, fx.expect.valuesLength);
      }
    }
  }
});
