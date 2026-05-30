import type { Bs2SensorConfig } from "../../../bitstream2/domains/config/sensor-config";
import {
  evaluateMatrixCase,
  matrixCaseRates,
  type MatrixCaseResult,
} from "../../../bitstream2/dev/matrix-case-evaluator";
import {
  buildMatrixCases,
  findMatrixCase,
  type MatrixTier,
  type MatrixTestCase,
} from "../../../bitstream2/dev/uart-sensor-test-matrix";
import { UART_SENSOR_NAMES } from "../../../bitstream2/dev/uart-sensor-assert";
import type { Bitstream2HelloPayload } from "../../../bitstream2/bridge/protocol";
import { BrowserUartHarness } from "./browserUartHarness";

export type MatrixRunOptions = {
  tier: MatrixTier;
  caseId?: string;
  soakMs: number;
  settleMs: number;
  minPassRatio: number;
  disabledMaxEvt: number;
  continueOnFail: boolean;
  printFailSamples: boolean;
  resumeFrom?: string;
  hello: Bitstream2HelloPayload | null;
  uartOpen: boolean;
  signal?: AbortSignal;
  onLog: (text: string, tone: "info" | "cmd" | "pass" | "fail" | "warn") => void;
  onProgress: (pct: number) => void;
  onCaseStatus: (caseId: string, status: "idle" | "running" | "pass" | "fail" | "skip") => void;
};

async function runSingleCase(
  harness: BrowserUartHarness,
  testCase: MatrixTestCase,
  opts: MatrixRunOptions,
): Promise<MatrixCaseResult> {
  opts.onCaseStatus(testCase.id, "running");
  let applied: Map<number, Bs2SensorConfig>;
  try {
    applied = await harness.applyTestCase(testCase);
    await harness.settleAfterConfig();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    opts.onCaseStatus(testCase.id, "fail");
    return { caseId: testCase.id, passed: false, errors: [`apply: ${msg}`], rates: {} };
  }

  const soakMs = testCase.soakMs ?? opts.soakMs;
  const elapsed = await harness.soak(soakMs);
  const samples = harness.getSamples();

  const evalErrors = evaluateMatrixCase(
    testCase,
    samples,
    elapsed,
    applied,
    opts.minPassRatio,
    opts.disabledMaxEvt,
  );

  const errors = [...evalErrors];
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
  opts.onCaseStatus(testCase.id, passed ? "pass" : "fail");

  if (!passed && opts.printFailSamples) {
    for (const sensorId of testCase.activeSensorIds) {
      const subset = samples.filter((s) => s.sensorId === sensorId).slice(0, 3);
      for (const s of subset) {
        opts.onLog(
          `    sample ${UART_SENSOR_NAMES[sensorId]} mask=0x${s.mask.toString(16)} len=${s.values.length}`,
          "info",
        );
      }
    }
  }

  return { caseId: testCase.id, passed, errors, rates };
}

export type MatrixRunSummary = {
  results: MatrixCaseResult[];
  passed: number;
  failed: number;
  skipped: number;
};

/** Run UART sensor matrix in-browser (real hardware via bridge). */
export async function runMonitorMatrix(opts: MatrixRunOptions): Promise<MatrixRunSummary> {
  let cases: MatrixTestCase[];
  if (opts.caseId != null && opts.caseId.trim() !== "") {
    const one = findMatrixCase(opts.caseId.trim());
    if (one == null) {
      throw new Error(`Unknown case id: ${opts.caseId}`);
    }
    cases = [one];
  } else {
    cases = buildMatrixCases(opts.tier);
  }

  const harness = new BrowserUartHarness({ settleMs: opts.settleMs });
  const results: MatrixCaseResult[] = [];

  try {
    await harness.prepare(opts.hello, opts.uartOpen);
    const hello = harness.getHello();
    opts.onLog(`HELLO ${hello?.fwTag ?? "?"}`, "pass");
    opts.onLog(`Matrix tier=${opts.tier} cases=${cases.length}`, "cmd");

    let resumeActive = opts.resumeFrom == null || opts.resumeFrom.trim() === "";
    let index = 0;

    for (const testCase of cases) {
      if (opts.signal?.aborted) {
        opts.onLog("Stopped by user", "warn");
        break;
      }

      if (!resumeActive) {
        if (testCase.id === opts.resumeFrom) {
          resumeActive = true;
        } else {
          opts.onCaseStatus(testCase.id, "skip");
          continue;
        }
      }

      index++;
      opts.onProgress((index / cases.length) * 100);
      opts.onLog(`[${index}/${cases.length}] ${testCase.id}`, "cmd");
      opts.onLog(`  ${testCase.description}`, "info");

      const result = await runSingleCase(harness, testCase, opts);
      results.push(result);

      if (result.passed) {
        const rateLine = testCase.activeSensorIds
          .map((id) => `${UART_SENSOR_NAMES[id]}=${result.rates[id]?.toFixed(1) ?? "?"}Hz`)
          .join("  ");
        opts.onLog(`  PASS  ${rateLine}`, "pass");
      } else {
        opts.onLog("  FAIL", "fail");
        for (const err of result.errors) {
          opts.onLog(`    - ${err}`, "fail");
        }
        if (!opts.continueOnFail) {
          opts.onLog("Stopping (--continue-on-fail not set)", "warn");
          break;
        }
      }
    }
  } finally {
    harness.cleanup();
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const skipped = cases.length - results.length;
  opts.onProgress(100);
  opts.onLog(`=== Summary: PASS ${passed}  FAIL ${failed}  not run ${skipped} ===`, failed > 0 ? "fail" : "pass");

  return { results, passed, failed, skipped };
}
