#!/usr/bin/env npx tsx
/**
 * Regenerate tests/fixtures/bitstream2-golden/*.json from encoders.
 *   npx tsx src/bitstream2/dev/generate-golden-fixtures.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bytesToBase64 } from "../util/base64";
import {
  wireBytesBmi270AccSample,
  wireBytesBmm350Sample,
  wireBytesDps368Sample,
  wireBytesHello,
  wireBytesPingReq,
  wireBytesSht40Sample,
} from "./wire-frames";
import { BS2_SIM_BOARD_PROFILE } from "../device/board-profile";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "../../../tests/fixtures/bitstream2-golden");

type GoldenFixture = {
  id: string;
  description: string;
  wireB64: string;
  expect: Record<string, unknown>;
};

const fixtures: GoldenFixture[] = [
  {
    id: "hello-sim",
    description: "HELLO from BS2_SIM_BOARD_PROFILE",
    wireB64: bytesToBase64(wireBytesHello(BS2_SIM_BOARD_PROFILE.hello.fwTag ?? "bs2-sim-psoc")),
    expect: {
      event: "hello",
      version: BS2_SIM_BOARD_PROFILE.hello.version,
      fwTag: "bs2-sim-psoc",
    },
  },
  {
    id: "ping-req-wire",
    description: "Host REQ PING wire bytes (device answers in session tests)",
    wireB64: bytesToBase64(wireBytesPingReq(1)),
    expect: { event: "req_ping" },
  },
  {
    id: "bmi270-acc-sample",
    description: "BMI270 ACC-only EVT_SENSOR",
    wireB64: bytesToBase64(wireBytesBmi270AccSample(1, 1000)),
    expect: {
      event: "sensor",
      sensorId: 0,
      mask: 1,
      counter: 1,
      tMs: 1000,
      values: [10, 20, 30],
    },
  },
  {
    id: "bmm350-mag-temp",
    description: "BMM350 MAG+TMP EVT_SENSOR",
    wireB64: bytesToBase64(wireBytesBmm350Sample(2, 2000)),
    expect: {
      event: "sensor",
      sensorId: 1,
      mask: 3,
      counter: 2,
      valuesLength: 4,
    },
  },
  {
    id: "sht40-temp-hum",
    description: "SHT40 temp+humidity EVT_SENSOR",
    wireB64: bytesToBase64(wireBytesSht40Sample(3, 3000)),
    expect: {
      event: "sensor",
      sensorId: 2,
      mask: 3,
      counter: 3,
      valuesLength: 2,
    },
  },
  {
    id: "dps368-press-temp",
    description: "DPS368 pressure+temp EVT_SENSOR",
    wireB64: bytesToBase64(wireBytesDps368Sample(4, 4000)),
    expect: {
      event: "sensor",
      sensorId: 3,
      mask: 3,
      counter: 4,
      valuesLength: 2,
    },
  },
];

fs.mkdirSync(outDir, { recursive: true });
for (const f of fixtures) {
  const file = path.join(outDir, `${f.id}.json`);
  fs.writeFileSync(file, `${JSON.stringify(f, null, 2)}\n`, "utf8");
  console.log("wrote", file);
}
