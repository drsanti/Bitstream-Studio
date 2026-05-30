#!/usr/bin/env npx tsx
/**
 * SENSOR_CFG v2.1 SET → RES ack → GET round-trip on real MCU (or bridge).
 *
 * npm run bitstream2:uart-cfg-roundtrip -- --path COM3
 * npm run bitstream2:uart-cfg-roundtrip -- --sensor=sht40 --case=sht40-hybrid
 */
import { BS2_SENSOR_ID } from "../domains/sensors/sensor-ids";
import {
  buildCfgRoundtripCases,
  diffSensorCfg,
  expectedFirmwareCfg,
  formatCfgOneLine,
  resolveRoundtripWrittenCfg,
  type CfgRoundtripCase,
} from "./uart-sensor-cfg-assert";
import { UartTestHarness } from "./uart-test-harness";
import { UART_SENSOR_NAMES } from "./uart-sensor-assert";

const SENSOR_ALIASES: Record<string, number> = {
  bmi270: BS2_SENSOR_ID.BMI270,
  bmm350: BS2_SENSOR_ID.BMM350,
  sht40: BS2_SENSOR_ID.SHT40,
  dps368: BS2_SENSOR_ID.DPS368,
};

function parseFlagValue(flag: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(flag));
  if (arg == null) {
    return undefined;
  }
  return arg.slice(flag.length);
}

function parseSensorIds(): number[] {
  const raw = parseFlagValue("--sensor=")?.trim().toLowerCase();
  if (raw == null || raw === "" || raw === "all") {
    return [0, 1, 2, 3];
  }
  const id = SENSOR_ALIASES[raw];
  if (id == null) {
    console.error(`Unknown --sensor=${raw} (bmi270|bmm350|sht40|dps368|all)`);
    process.exit(1);
  }
  return [id];
}

function printHelp(): void {
  console.log(`Usage: npm run bitstream2:uart-cfg-roundtrip -- [options]

Write SENSOR_CFG v2.1 to firmware, compare SET ack + GET to expected (with clamp rules).

Options:
  --path=COM3           Serial port (default COM3)
  --baud=921600         Baud rate
  --sensor=all|sht40|…  Sensor subset (default all four)
  --case=<id>           Run one case id
  --list-cases          Print case ids and exit
  --continue-on-fail    Keep running after failures
  --ws-url=…            Bridge WebSocket URL
  --help / -h

Cases cover: enabled, publishMode 0/1/2, sampling/publish intervals,
mask partial, firmware clamp (min sample, minPublish).
`);
}

type CaseResult = {
  id: string;
  passed: boolean;
  errors: string[];
};

async function runCase(harness: UartTestHarness, testCase: CfgRoundtripCase): Promise<CaseResult> {
  const written = resolveRoundtripWrittenCfg(testCase);
  const expected = expectedFirmwareCfg(written);
  const errors: string[] = [];

  let ack;
  try {
    ack = await harness.setSensorCfg(written);
  } catch (e) {
    return {
      id: testCase.id,
      passed: false,
      errors: [`SET: ${e instanceof Error ? e.message : String(e)}`],
    };
  }

  const ackDiffs = diffSensorCfg(expected, ack);
  if (ackDiffs.length > 0) {
    errors.push(
      `SET ack: ${ackDiffs.map((d) => `${d.field} expected=${d.expected} got=${d.actual}`).join("; ")}`,
    );
  }

  let got;
  try {
    got = await harness.getSensorCfg(testCase.sensorId);
  } catch (e) {
    errors.push(`GET: ${e instanceof Error ? e.message : String(e)}`);
    return { id: testCase.id, passed: false, errors };
  }

  const getDiffs = diffSensorCfg(expected, got);
  if (getDiffs.length > 0) {
    errors.push(
      `GET: ${getDiffs.map((d) => `${d.field} expected=${d.expected} got=${d.actual}`).join("; ")}`,
    );
  }

  if (errors.length === 0) {
    console.log(`  OK  ${formatCfgOneLine(expected)}`);
  }

  return { id: testCase.id, passed: errors.length === 0, errors };
}

async function main(): Promise<void> {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  const sensorIds = parseSensorIds();
  let cases = buildCfgRoundtripCases(sensorIds);
  const caseId = parseFlagValue("--case=");
  if (caseId != null && caseId !== "") {
    cases = cases.filter((c) => c.id === caseId);
    if (cases.length === 0) {
      console.error(`Unknown --case=${caseId}`);
      process.exit(1);
    }
  }

  if (process.argv.includes("--list-cases")) {
    for (const c of buildCfgRoundtripCases(sensorIds)) {
      console.log(`${c.id}  —  ${UART_SENSOR_NAMES[c.sensorId]}: ${c.description}`);
    }
    process.exit(0);
  }

  const path = parseFlagValue("--path=") ?? "COM3";
  const baud = Number(parseFlagValue("--baud=") ?? "921600");
  const wsUrl = parseFlagValue("--ws-url=") ?? process.env.T3D_WS_CLIENT_URL;
  const continueOnFail = process.argv.includes("--continue-on-fail");

  console.log(`SENSOR_CFG round-trip  cases=${cases.length}  path=${path}\n`);

  const harness = new UartTestHarness({ path, baud, wsUrl });
  try {
    await harness.connect();
    console.log(`OK  HELLO ${harness.getHello()?.fwTag ?? "?"}\n`);
  } catch (e) {
    console.error(`FAIL connect: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }

  const results: CaseResult[] = [];
  let index = 0;
  for (const testCase of cases) {
    index++;
    console.log(`[${index}/${cases.length}] ${testCase.id}`);
    console.log(`  ${testCase.description}`);
    const result = await runCase(harness, testCase);
    results.push(result);
    if (!result.passed) {
      console.log("  FAIL");
      for (const err of result.errors) {
        console.log(`    - ${err}`);
      }
      console.log("");
      if (!continueOnFail) {
        break;
      }
    } else {
      console.log("");
    }
  }

  await harness.disconnect();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const skipped = cases.length - results.length;

  console.log("=== Summary ===");
  console.log(`  PASS ${passed}  FAIL ${failed}  not run ${skipped}  total ${cases.length}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
