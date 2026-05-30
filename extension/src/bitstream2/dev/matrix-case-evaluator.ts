/**
 * Shared matrix case pass/fail evaluation (CLI + webview monitor).
 */
import { effectivePublishIntervalMs, type Bs2SensorConfig } from "../domains/config/sensor-config";
import { bmi270ModeFromCase, cfgMaskBySensorFromApplied } from "./uart-test-harness";
import type { MatrixTestCase } from "./uart-sensor-test-matrix";
import {
  computeSensorHz,
  UART_ALL_SENSOR_IDS,
  UART_DPS368_SENSOR_ID,
  UART_SENSOR_NAMES,
  verifySensorPayloadFields,
} from "./uart-sensor-assert";

export type MatrixCaseResult = {
  caseId: string;
  passed: boolean;
  errors: string[];
  rates: Record<number, number>;
};

export function evaluateMatrixCase(
  testCase: MatrixTestCase,
  samples: readonly { sensorId: number; mask: number; values: number[] }[],
  elapsedMs: number,
  appliedCfg: Map<number, Bs2SensorConfig>,
  minPassRatio: number,
  defaultDisabledMaxEvt: number,
): string[] {
  const cfgMaskBySensor = cfgMaskBySensorFromApplied(appliedCfg);
  const errors: string[] = [];
  const bmi270Mode = bmi270ModeFromCase(testCase);

  for (const sensorId of UART_ALL_SENSOR_IDS) {
    const enabled = testCase.activeSensorIds.includes(sensorId);
    const n = samples.filter((s) => s.sensorId === sensorId).length;
    if (!enabled) {
      if (testCase.skipDisabledEvtCheck) {
        continue;
      }
      const maxEvt = testCase.disabledMaxEvt ?? defaultDisabledMaxEvt;
      if (n > maxEvt) {
        errors.push(`${UART_SENSOR_NAMES[sensorId]}: disabled but ${n} EVT (max ${maxEvt})`);
      }
      continue;
    }

    const hz = computeSensorHz(samples as Parameters<typeof computeSensorHz>[0], sensorId, elapsedMs);
    if (testCase.payloadOnly) {
      if (n < 1) {
        errors.push(`${UART_SENSOR_NAMES[sensorId]}: payloadOnly but no EVT`);
      }
      continue;
    }

    const cfg = appliedCfg.get(sensorId);
    if (cfg == null) {
      errors.push(`${UART_SENSOR_NAMES[sensorId]}: missing applied cfg`);
      continue;
    }
    const publishMs = effectivePublishIntervalMs(cfg);
    const telemetryHz = 1000 / publishMs;
    const thresholdHz =
      sensorId === UART_DPS368_SENSOR_ID ? 0.8 : telemetryHz * (testCase.minPassRatio ?? minPassRatio);

    if (n < 1 || (sensorId !== UART_DPS368_SENSOR_ID && hz < thresholdHz)) {
      errors.push(
        `${UART_SENSOR_NAMES[sensorId]}: ${n} evt (${hz.toFixed(1)} Hz), need >= ${thresholdHz.toFixed(1)} Hz`,
      );
    } else if (sensorId === UART_DPS368_SENSOR_ID && hz < thresholdHz) {
      errors.push(
        `WARN ${UART_SENSOR_NAMES[sensorId]}: ${hz.toFixed(1)} Hz below ${thresholdHz.toFixed(1)} (non-fatal)`,
      );
    }
  }

  const payloadErrors = verifySensorPayloadFields(
    testCase.activeSensorIds,
    samples as Parameters<typeof verifySensorPayloadFields>[1],
    cfgMaskBySensor,
    bmi270Mode,
  );
  errors.push(...payloadErrors);

  return errors.filter((e) => !e.startsWith("WARN "));
}

export function matrixCaseRates(
  testCase: MatrixTestCase,
  samples: readonly { sensorId: number }[],
  elapsedMs: number,
): Record<number, number> {
  const rates: Record<number, number> = {};
  for (const sensorId of testCase.activeSensorIds) {
    rates[sensorId] = computeSensorHz(samples as Parameters<typeof computeSensorHz>[0], sensorId, elapsedMs);
  }
  return rates;
}
