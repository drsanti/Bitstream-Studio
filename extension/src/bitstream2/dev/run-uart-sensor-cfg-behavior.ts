#!/usr/bin/env npx tsx
/**
 * SENSOR_CFG behavior: SET cfg → soak → verify EVT rate vs publishMode / intervals.
 *
 * npm run bitstream2:uart-cfg-behavior -- --path COM3
 * npm run bitstream2:uart-cfg-behavior -- --sensor=bmm350 --case=bmm350-hybrid-floor
 */
import { BS2_SENSOR_ID } from "../domains/sensors/sensor-ids";
import type { Bs2SensorConfig } from "../domains/config/sensor-config";
import {
  buildCfgBehaviorCases,
  disabledSensorCfg,
  evaluateBehaviorExpect,
  formatCfgOneLine,
  resolveBehaviorWrittenCfg,
  resolvePairedWrittenCfg,
  restoreAllSensorsCfg,
  type AnyBehaviorCase,
  type CfgBehaviorCase,
  type PairedBehaviorCase,
} from "./uart-sensor-cfg-behavior-assert";
import { CFG_ACCESS_SET_TIMEOUT_UNDER_LOAD_MS } from "../domains/config/sensor-cfg-access-policy";
import { UartTestHarness } from "./uart-test-harness";
import { computeSensorHz, UART_ALL_SENSOR_IDS, UART_SENSOR_NAMES } from "./uart-sensor-assert";

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
  if (raw == null || raw === "") {
    return [1, 2, 3];
  }
  if (raw === "all") {
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
  console.log(`Usage: npm run bitstream2:uart-cfg-behavior -- [options]

Apply SENSOR_CFG, soak, and verify EVT cadence matches publishMode / intervals.

Options:
  --path=COM3           Serial port (default COM3)
  --baud=921600         Baud rate
  --sensor=all|bmm350|… Default: bmm350,sht40,dps368 (excludes BMI270)
  --case=<id>           Run one case id
  --list-cases          Print case ids and exit
  --soak-ms=N           Override default soak window
  --continue-on-fail    Keep running after failures
  --no-restore          Skip re-enabling all sensors at exit
  --ws-url=…            Bridge WebSocket URL
  --help / -h
`);
}

type CaseResult = {
  id: string;
  passed: boolean;
  errors: string[];
  hz?: number;
};

async function quietAllSensors(harness: UartTestHarness): Promise<void> {
  for (const sensorId of UART_ALL_SENSOR_IDS) {
    await harness.setSensorCfg(disabledSensorCfg(sensorId));
    await sleep(100);
  }
  await harness.settleAfterConfig();
}

async function isolateSensors(harness: UartTestHarness, activeSensorId: number): Promise<void> {
  for (const sensorId of UART_ALL_SENSOR_IDS) {
    if (sensorId === activeSensorId) {
      continue;
    }
    await harness.setSensorCfg(disabledSensorCfg(sensorId));
    await sleep(80);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function applyAndSoak(
  harness: UartTestHarness,
  cfg: Bs2SensorConfig,
  soakMs: number,
  isolate: boolean,
): Promise<{ ack: Bs2SensorConfig; elapsed: number }> {
  if (isolate) {
    await isolateSensors(harness, cfg.sensorId);
  }
  const ack = await harness.setSensorCfg(cfg);
  await harness.settleAfterConfig();
  const elapsed = await harness.soak(soakMs);
  return { ack, elapsed };
}

async function runSingleCase(
  harness: UartTestHarness,
  testCase: CfgBehaviorCase,
  defaultSoakMs: number,
): Promise<CaseResult> {
  const written = resolveBehaviorWrittenCfg(testCase);
  const soakMs = defaultSoakMs > 0 ? defaultSoakMs : (testCase.soakMs ?? 3000);
  const isolate = testCase.isolate !== false;
  const errors: string[] = [];

  let ack: Bs2SensorConfig;
  let elapsed: number;
  try {
    ({ ack, elapsed } = await applyAndSoak(harness, written, soakMs, isolate));
  } catch (e) {
    return {
      id: testCase.id,
      passed: false,
      errors: [`apply/soak: ${e instanceof Error ? e.message : String(e)}`],
    };
  }

  const elapsedMs = elapsed;
  const samples = harness.getSamples();
  errors.push(...evaluateBehaviorExpect(testCase.sensorId, ack, samples, elapsedMs, testCase.expect));

  const hz = computeSensorHz(samples, testCase.sensorId, elapsedMs);
  const n = samples.filter((s) => s.sensorId === testCase.sensorId).length;

  if (errors.length === 0) {
    console.log(`  OK  ${formatCfgOneLine(ack)}  →  ${n} evt (${hz.toFixed(2)} Hz)`);
  }

  return { id: testCase.id, passed: errors.length === 0, errors, hz };
}

async function runPairedCase(
  harness: UartTestHarness,
  testCase: PairedBehaviorCase,
  defaultSoakMs: number,
): Promise<CaseResult> {
  const soakMs = defaultSoakMs > 0 ? defaultSoakMs : (testCase.soakMs ?? 3000);
  const errors: string[] = [];

  const periodicCfg = resolvePairedWrittenCfg(testCase.sensorId, testCase.periodicPatch);
  const onChangeCfg = resolvePairedWrittenCfg(testCase.sensorId, testCase.onChangePatch);

  let periodicAck: Bs2SensorConfig;
  let periodicElapsed: number;
  try {
    ({ ack: periodicAck, elapsed: periodicElapsed } = await applyAndSoak(
      harness,
      periodicCfg,
      soakMs,
      true,
    ));
  } catch (e) {
    return {
      id: testCase.id,
      passed: false,
      errors: [`periodic apply: ${e instanceof Error ? e.message : String(e)}`],
    };
  }

  const periodicSamples = harness.getSamples();
  const periodicHz = computeSensorHz(periodicSamples, testCase.sensorId, periodicElapsed);
  errors.push(
    ...evaluateBehaviorExpect(testCase.sensorId, periodicAck, periodicSamples, periodicElapsed, {
      kind: "min_hz",
      hz: (1000 / Math.max(1, periodicAck.samplingIntervalMs)) * 0.5,
    }),
  );

  let onChangeAck: Bs2SensorConfig;
  let onChangeElapsed: number;
  try {
    ({ ack: onChangeAck, elapsed: onChangeElapsed } = await applyAndSoak(
      harness,
      onChangeCfg,
      soakMs,
      true,
    ));
  } catch (e) {
    errors.push(`on_change apply: ${e instanceof Error ? e.message : String(e)}`);
    return { id: testCase.id, passed: false, errors };
  }

  const onChangeSamples = harness.getSamples();
  const onChangeHz = computeSensorHz(onChangeSamples, testCase.sensorId, onChangeElapsed);
  errors.push(
    ...evaluateBehaviorExpect(testCase.sensorId, onChangeAck, onChangeSamples, onChangeElapsed, {
      kind: "max_hz",
      hz: 1.0,
    }),
  );

  const minRatio = testCase.minRatio ?? 3;
  if (periodicHz <= onChangeHz) {
    errors.push(
      `${UART_SENSOR_NAMES[testCase.sensorId]}: periodic ${periodicHz.toFixed(2)} Hz must exceed on_change ${onChangeHz.toFixed(2)} Hz`,
    );
  } else if (onChangeHz > 0.05 && periodicHz < onChangeHz * minRatio) {
    errors.push(
      `${UART_SENSOR_NAMES[testCase.sensorId]}: periodic ${periodicHz.toFixed(2)} Hz should be ≥ ${minRatio}× on_change (${onChangeHz.toFixed(2)} Hz)`,
    );
  }

  if (errors.length === 0) {
    console.log(
      `  OK  periodic ${periodicHz.toFixed(2)} Hz  vs  on_change ${onChangeHz.toFixed(2)} Hz`,
    );
    console.log(`      ${formatCfgOneLine(onChangeAck)}`);
  }

  return { id: testCase.id, passed: errors.length === 0, errors, hz: periodicHz };
}

async function runCase(
  harness: UartTestHarness,
  testCase: AnyBehaviorCase,
  defaultSoakMs: number,
): Promise<CaseResult> {
  if (testCase.type === "paired") {
    return runPairedCase(harness, testCase, defaultSoakMs);
  }
  return runSingleCase(harness, testCase, defaultSoakMs);
}

async function main(): Promise<void> {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  const sensorIds = parseSensorIds();
  let cases = buildCfgBehaviorCases(sensorIds);
  const caseId = parseFlagValue("--case=");
  if (caseId != null && caseId !== "") {
    cases = cases.filter((c) => c.id === caseId);
    if (cases.length === 0) {
      console.error(`Unknown --case=${caseId}`);
      process.exit(1);
    }
  }

  if (process.argv.includes("--list-cases")) {
    for (const c of buildCfgBehaviorCases(sensorIds)) {
      console.log(`${c.id}  —  ${c.description}`);
    }
    process.exit(0);
  }

  const path = parseFlagValue("--path=") ?? "COM3";
  const baud = Number(parseFlagValue("--baud=") ?? "921600");
  const wsUrl = parseFlagValue("--ws-url=") ?? process.env.T3D_WS_CLIENT_URL;
  const continueOnFail = process.argv.includes("--continue-on-fail");
  const noRestore = process.argv.includes("--no-restore");
  const soakOverride = Number(parseFlagValue("--soak-ms=") ?? "0");

  console.log(`SENSOR_CFG behavior  cases=${cases.length}  path=${path}\n`);

  const harness = new UartTestHarness({
    path,
    baud,
    wsUrl,
    reqTimeoutMs: CFG_ACCESS_SET_TIMEOUT_UNDER_LOAD_MS,
  });
  try {
    await harness.connect();
    console.log(`OK  HELLO ${harness.getHello()?.fwTag ?? "?"}\n`);
    console.log("Quiet bus: disable all sensors before behavior cases…");
    await quietAllSensors(harness);
    console.log("");
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
    const result = await runCase(harness, testCase, soakOverride);
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

  if (!noRestore) {
    console.log("Restoring all sensors to periodic 50 Hz…");
    for (const cfg of restoreAllSensorsCfg()) {
      try {
        await harness.setSensorCfg(cfg);
      } catch {
        /* best effort */
      }
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
