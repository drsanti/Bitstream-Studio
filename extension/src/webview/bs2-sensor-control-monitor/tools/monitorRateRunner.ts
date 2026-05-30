import { intervalMsFromHz } from "../../../bitstream2/domains/config/sensor-rate-presets";
import { bmi270StreamModeUiToCode } from "../../../bitstream2/domains/bmi270/bmi270-control";
import type { Bs2SensorConfig } from "../../../bitstream2/domains/config/sensor-config";
import {
  UART_ALL_SENSOR_IDS,
  UART_BMI270_SENSOR_ID,
  UART_DPS368_SENSOR_ID,
  UART_SENSOR_NAMES,
} from "../../../bitstream2/dev/uart-sensor-assert";
import type { Bitstream2HelloPayload } from "../../../bitstream2/bridge/protocol";
import { BrowserUartHarness } from "./browserUartHarness";

export type RateCheckRunOptions = {
  targetHz: number;
  soakMs: number;
  settleMs: number;
  minPassRatio: number;
  enabledSensorIds: number[];
  hello: Bitstream2HelloPayload | null;
  uartOpen: boolean;
  signal?: AbortSignal;
  onLog: (text: string, tone: "info" | "cmd" | "pass" | "fail" | "warn") => void;
  onSensorResult: (sensorId: number, hz: number | null, passed: boolean | null) => void;
};

/** Run UART sensor rate check in-browser. */
export async function runMonitorRateCheck(opts: RateCheckRunOptions): Promise<boolean> {
  const harness = new BrowserUartHarness({ settleMs: opts.settleMs });
  let failed = false;
  const samplingIntervalMs = intervalMsFromHz(opts.targetHz);
  const minPassHz = opts.targetHz * opts.minPassRatio;

  try {
    await harness.prepare(opts.hello, opts.uartOpen);
    opts.onLog(`Rate check ${opts.targetHz} Hz soak=${opts.soakMs}ms`, "cmd");

    for (const sensorId of UART_ALL_SENSOR_IDS) {
      const enabled = opts.enabledSensorIds.includes(sensorId);
      const cfg: Bs2SensorConfig = {
        sensorId,
        enabled,
        publishMode: 0,
        mask: sensorId === UART_BMI270_SENSOR_ID ? 0x1f : 0x03,
        samplingIntervalMs: enabled ? samplingIntervalMs : 1000,
        deltaX100: 0,
        minPublishIntervalMs: 0,
        publishIntervalMs: 0,
      };
      await harness.setSensorCfg(cfg);
      opts.onLog(`SET ${UART_SENSOR_NAMES[sensorId]} enabled=${enabled}`, "info");
    }

    if (opts.enabledSensorIds.includes(UART_BMI270_SENSOR_ID)) {
      await harness.setBmi270StreamMode(bmi270StreamModeUiToCode("raw"));
    }

    await harness.settleAfterConfig();

    if (opts.signal?.aborted) {
      return false;
    }

    for (const id of UART_ALL_SENSOR_IDS) {
      if (!opts.enabledSensorIds.includes(id)) {
        opts.onSensorResult(id, null, null);
      }
    }

    const elapsed = await harness.soak(opts.soakMs);
    const samples = harness.getSamples();

    for (const sensorId of opts.enabledSensorIds) {
      const n = samples.filter((s) => s.sensorId === sensorId).length;
      const hz = (n * 1000) / elapsed;
      const thresholdHz = sensorId === UART_DPS368_SENSOR_ID ? 0.8 : minPassHz;
      const ok = n >= 1 && hz >= thresholdHz;
      if (!ok && sensorId !== UART_DPS368_SENSOR_ID) {
        failed = true;
      }
      opts.onSensorResult(sensorId, hz, ok);
      const tag = sensorId === UART_DPS368_SENSOR_ID && !ok ? "WARN" : ok ? "OK" : "FAIL";
      opts.onLog(
        `  ${tag}  ${UART_SENSOR_NAMES[sensorId]}: ${n} evt (${hz.toFixed(1)} Hz) need >= ${thresholdHz.toFixed(1)}`,
        ok ? "pass" : sensorId === UART_DPS368_SENSOR_ID ? "warn" : "fail",
      );
    }

    opts.onLog(failed ? "Rate check FAILED" : "Rate check PASSED", failed ? "fail" : "pass");
    return !failed;
  } catch (e) {
    opts.onLog(e instanceof Error ? e.message : String(e), "fail");
    return false;
  } finally {
    harness.cleanup();
  }
}
