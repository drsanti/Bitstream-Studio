#!/usr/bin/env npx tsx
/**
 * Matrix runner: sweep BMI270 modes/rates/masks, env sensor masks, publishMode.
 *
 * npm run bitstream2:uart-matrix -- [options]
 * npm run bitstream2:uart-matrix:standard --
 *
 * Full reference: src/bitstream2/dev/UART_TEST_COMMANDS.md
 */
import type { Bs2SensorConfig } from "../domains/config/sensor-config";
import {
  buildMatrixCases,
  estimateTierDurationMs,
  findMatrixCase,
  type MatrixTestCase,
  type MatrixTier,
} from "./uart-sensor-test-matrix";
import {
  evaluateMatrixCase,
  matrixCaseRates,
  type MatrixCaseResult,
} from "./matrix-case-evaluator";
import { UartTestHarness } from "./uart-test-harness";
import { UART_SENSOR_NAMES } from "./uart-sensor-assert";

const DEFAULT_SOAK_MS = 12_000;
const DEFAULT_MIN_PASS_RATIO = 0.6;
const DEFAULT_DISABLED_MAX_EVT = 0;
const DEFAULT_SETTLE_MS = 600;

function parseFlagValue(flag: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(flag));
  if (arg == null) {
    return undefined;
  }
  return arg.slice(flag.length);
}

function parseTier(): MatrixTier {
  const raw = parseFlagValue("--tier=")?.trim().toLowerCase() ?? "standard";
  if (raw === "smoke" || raw === "standard" || raw === "exhaustive") {
    return raw;
  }
  console.error(`Unknown --tier=${raw} (expected smoke|standard|exhaustive)`);
  process.exit(1);
}

function printHelp(): void {
  console.log(`Usage: npm run bitstream2:uart-matrix -- [options]

Matrix UART sensor validation (real MCU, bridge without loopback).

Options:
  --tier=smoke|standard|exhaustive   Case set (default: standard)
  --case=<id>                        Run one case by id
  --list-cases                       Print case ids for tier and exit
  --path=COM3                        Serial port (default COM3)
  --baud=921600                      Baud rate
  --soak-ms=12000                    Default soak per case (ms)
  --settle-ms=600                    Post-config settle before soak (ms)
  --disabled-max-evt=0               Max EVT from disabled sensors per case
  --min-pass-ratio=0.6               Periodic mode pass threshold
  --continue-on-fail                 Keep running after failed cases
  --print-fail-samples               Print up to 3 EVT samples on failure
  --resume-from=<caseId>             Skip cases until this id (inclusive)
  --ws-url=ws://127.0.0.1:9998       Bridge WebSocket URL
  --skip-open                        COM already open in webview
  --help / -h

npm scripts:
  bitstream2:uart-matrix:smoke
  bitstream2:uart-matrix:standard
  bitstream2:uart-matrix

See: src/bitstream2/dev/UART_TEST_COMMANDS.md
`);
}

type CaseResult = MatrixCaseResult;

function evaluateCase(
  testCase: MatrixTestCase,
  samples: readonly { sensorId: number; mask: number; values: number[] }[],
  elapsedMs: number,
  appliedCfg: Map<number, Bs2SensorConfig>,
  minPassRatio: number,
  defaultDisabledMaxEvt: number,
): string[] {
  return evaluateMatrixCase(
    testCase,
    samples,
    elapsedMs,
    appliedCfg,
    minPassRatio,
    defaultDisabledMaxEvt,
  );
}

function printFailSamples(
  testCase: MatrixTestCase,
  samples: readonly { sensorId: number; mask: number; values: number[]; seq?: number }[],
): void {
  for (const sensorId of testCase.activeSensorIds) {
    const subset = samples.filter((s) => s.sensorId === sensorId).slice(0, 3);
    for (const s of subset) {
      console.log(
        `    sample sensor=${UART_SENSOR_NAMES[sensorId]} mask=0x${s.mask.toString(16)} len=${s.values.length}`,
      );
    }
  }
}

async function runCase(
  harness: UartTestHarness,
  testCase: MatrixTestCase,
  defaultSoakMs: number,
  minPassRatio: number,
  defaultDisabledMaxEvt: number,
  printFailSamplesFlag: boolean,
): Promise<CaseResult> {
  const errors: string[] = [];

  let applied;
  try {
    applied = await harness.applyTestCase(testCase);
    await harness.settleAfterConfig();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { caseId: testCase.id, passed: false, errors: [`apply: ${msg}`], rates: {} };
  }

  const soakMs = testCase.soakMs ?? defaultSoakMs;
  const elapsed = await harness.soak(soakMs);
  const samples = harness.getSamples();

  const evalErrors = evaluateCase(
    testCase,
    samples,
    elapsed,
    applied,
    minPassRatio,
    defaultDisabledMaxEvt,
  );
  errors.push(...evalErrors);

  if (testCase.requireCfgGet) {
    const expectedBySensor = new Map<number, Bs2SensorConfig>();
    for (const [id, cfg] of applied) {
      expectedBySensor.set(id, cfg);
    }
    const getErrors = await harness.verifySensorCfgGet(testCase.activeSensorIds, expectedBySensor);
    errors.push(...getErrors.map((e) => `cfg-get: ${e}`));
  }

  const rates = matrixCaseRates(testCase, samples, elapsed);

  const passed = errors.length === 0;
  if (!passed && printFailSamplesFlag) {
    printFailSamples(testCase, samples);
  }

  return { caseId: testCase.id, passed, errors, rates };
}

async function main(): Promise<void> {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  const tier = parseTier();
  const caseId = parseFlagValue("--case=");
  const listCases = process.argv.includes("--list-cases");
  const path = parseFlagValue("--path=") ?? "COM3";
  const baud = Number(parseFlagValue("--baud=") ?? "921600");
  const defaultSoakMs = Number(parseFlagValue("--soak-ms=") ?? String(DEFAULT_SOAK_MS));
  const settleMs = Number(parseFlagValue("--settle-ms=") ?? String(DEFAULT_SETTLE_MS));
  const defaultDisabledMaxEvt = Number(
    parseFlagValue("--disabled-max-evt=") ?? String(DEFAULT_DISABLED_MAX_EVT),
  );
  const minPassRatio = Number(parseFlagValue("--min-pass-ratio=") ?? String(DEFAULT_MIN_PASS_RATIO));
  const continueOnFail = process.argv.includes("--continue-on-fail");
  const printFailSamplesFlag = process.argv.includes("--print-fail-samples");
  const skipOpen = process.argv.includes("--skip-open");
  const resumeFrom = parseFlagValue("--resume-from=");
  const wsUrl = parseFlagValue("--ws-url=") ?? process.env.T3D_WS_CLIENT_URL;

  let cases: MatrixTestCase[];
  if (caseId != null && caseId !== "") {
    const one = findMatrixCase(caseId);
    if (one == null) {
      console.error(`Unknown --case=${caseId}`);
      process.exit(1);
    }
    cases = [one];
  } else {
    cases = buildMatrixCases(tier);
  }

  if (listCases) {
    const estMin = Math.round(estimateTierDurationMs(tier, defaultSoakMs) / 60_000);
    console.log(`Tier ${tier}: ${cases.length} cases (~${estMin} min @ soak=${defaultSoakMs}ms)\n`);
    for (const c of cases) {
      console.log(`  ${c.id}  —  ${c.description}`);
    }
    process.exit(0);
  }

  console.log(
    `UART sensor matrix  tier=${tier}  cases=${cases.length}  path=${path}  soak=${defaultSoakMs}ms  settle=${settleMs}ms`,
  );
  if (wsUrl != null) {
    console.log(`  ws=${wsUrl}`);
  }
  const estMin = Math.round(
    cases.reduce((s, c) => s + (c.soakMs ?? defaultSoakMs), 0) / 60_000,
  );
  console.log(`Estimated runtime ~${estMin} min (soak only)\n`);

  const harness = new UartTestHarness({ path, baud, skipOpen, wsUrl, settleMs });
  try {
    await harness.connect();
    const hello = harness.getHello();
    console.log(`OK  HELLO ${hello?.fwTag ?? "?"}\n`);
  } catch (e) {
    console.error(`FAIL connect: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }

  let resumeActive = resumeFrom == null || resumeFrom === "";
  const results: CaseResult[] = [];
  let index = 0;
  for (const testCase of cases) {
    if (!resumeActive) {
      if (testCase.id === resumeFrom) {
        resumeActive = true;
      } else {
        continue;
      }
    }
    index++;
    console.log(`[${index}/${cases.length}] ${testCase.id}`);
    console.log(`  ${testCase.description}`);

    let result: CaseResult;
    try {
      result = await runCase(
        harness,
        testCase,
        defaultSoakMs,
        minPassRatio,
        defaultDisabledMaxEvt,
        printFailSamplesFlag,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`  ABORT  ${msg}`);
      await harness.disconnect();
      process.exit(1);
    }
    results.push(result);

    if (result.passed) {
      const rateLine = testCase.activeSensorIds
        .map((id) => `${UART_SENSOR_NAMES[id]}=${result.rates[id]?.toFixed(1) ?? "?"}Hz`)
        .join("  ");
      console.log(`  PASS  ${rateLine}\n`);
    } else {
      console.log(`  FAIL`);
      for (const err of result.errors) {
        console.log(`    - ${err}`);
      }
      console.log("");
      if (!continueOnFail) {
        break;
      }
    }
  }

  await harness.disconnect();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const skipped = cases.length - results.length;

  console.log("=== Summary ===");
  console.log(`  PASS ${passed}  FAIL ${failed}  not run ${skipped}  total ${cases.length}`);

  if (failed > 0) {
    console.log("\nFailed cases:");
    for (const r of results.filter((x) => !x.passed)) {
      console.log(`  ${r.caseId}: ${r.errors[0] ?? "?"}`);
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
