import { bmi270StreamModeUiToCode } from "../../../bitstream2/domains/bmi270/bmi270-control";
import { UART_ALL_SENSOR_IDS, UART_SENSOR_NAMES } from "../../../bitstream2/dev/uart-sensor-assert";
import type { Bitstream2HelloPayload } from "../../../bitstream2/bridge/protocol";
import { BrowserUartHarness } from "./browserUartHarness";

export type ProbeStepState = "idle" | "running" | "ok" | "fail" | "warn";

export type ProbeStep = {
  n: number;
  name: string;
  detail: string;
};

export const UART_PROBE_STEPS: ProbeStep[] = [
  { n: 0, name: "HELLO wait", detail: "Wait for board identification within hello-timeout" },
  { n: 1, name: "Telemetry soak", detail: "Receive BMI270 / BMM350 / SHT40 / DPS368 samples for soak-ms" },
  { n: 2, name: "Metrics CRC", detail: "Validate telemetry CRC across received frames" },
  { n: 3, name: "PING", detail: "Send PING command, expect ACK within req-timeout" },
  { n: 4, name: "SENSOR_CFG_GET 0–3", detail: "Read config for all 4 sensor IDs" },
  { n: 5, name: "SENSOR_CFG_SET SHT40", detail: "Write SHT40 config and verify echo" },
  { n: 6, name: "BMI270_MODE_SET raw", detail: "Set BMI270 to raw mode and verify" },
];

export type ProbeRunOptions = {
  soakMs: number;
  skipSet: boolean;
  hello: Bitstream2HelloPayload | null;
  uartOpen: boolean;
  signal?: AbortSignal;
  onLog: (text: string, tone: "info" | "cmd" | "pass" | "fail" | "warn") => void;
  onStep: (stepN: number, state: ProbeStepState, detail?: string, elapsedMs?: number) => void;
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Run UART probe checklist in-browser (§9.2). */
export async function runMonitorUartProbe(opts: ProbeRunOptions): Promise<boolean> {
  const harness = new BrowserUartHarness({ helloTimeoutMs: 90_000 });
  let failed = false;

  const markFail = (msg: string): void => {
    opts.onLog(msg, "fail");
    failed = true;
  };

  try {
    opts.onStep(0, "running");
    await harness.prepare(opts.hello, opts.uartOpen);
    const hello = harness.getHello();
    opts.onStep(0, "ok", hello?.fwTag ?? "ok");
    opts.onLog(`HELLO v${hello?.version} tag=${hello?.fwTag ?? "?"}`, "pass");

    if (opts.signal?.aborted) {
      return false;
    }

    opts.onStep(1, "running");
    const countsAtStart: Record<number, number> = {};
    for (const id of UART_ALL_SENSOR_IDS) {
      countsAtStart[id] = harness.getSamples().filter((s) => s.sensorId === id).length;
    }
    const metricsAtStart = harness.getMetrics();
    const soakStart = Date.now();
    await sleep(opts.soakMs);
    const soakElapsed = Date.now() - soakStart;

    for (const id of UART_ALL_SENSOR_IDS) {
      const n =
        harness.getSamples().filter((s) => s.sensorId === id).length - (countsAtStart[id] ?? 0);
      if (n < 1) {
        markFail(`${UART_SENSOR_NAMES[id]}: no EVT during soak`);
      } else {
        opts.onLog(`${UART_SENSOR_NAMES[id]}: ${n} samples in ${soakElapsed}ms`, "pass");
      }
    }
    opts.onStep(1, failed ? "fail" : "ok", `${soakElapsed}ms`);

    if (opts.signal?.aborted) {
      return false;
    }

    opts.onStep(2, "running");
    const metrics = harness.getMetrics();
    if (metrics == null) {
      markFail("no metrics payload yet");
      opts.onStep(2, "fail");
    } else {
      const framesOkDelta =
        metricsAtStart != null ? metrics.framesOk - metricsAtStart.framesOk : metrics.framesOk;
      const crcDelta =
        metricsAtStart != null
          ? metrics.framesCrcFail - metricsAtStart.framesCrcFail
          : metrics.framesCrcFail;
      opts.onLog(
        `framesOk +${framesOkDelta}, crcFail +${crcDelta}, uartIn ${metrics.uartBytesIn}`,
        crcDelta > 0 ? "warn" : "pass",
      );
      if (crcDelta > 0) {
        markFail(`CRC failures increased by ${crcDelta}`);
      }
      opts.onStep(2, failed ? "fail" : "ok");
    }

    if (opts.signal?.aborted) {
      return false;
    }

    opts.onStep(3, "running");
    const pingOk = await harness.ping();
    if (!pingOk) {
      markFail("PING failed");
      opts.onStep(3, "fail");
    } else {
      opts.onLog("PING OK", "pass");
      opts.onStep(3, "ok");
    }

    if (opts.signal?.aborted) {
      return false;
    }

    opts.onStep(4, "running");
    const cfgBySensor = new Map<number, Awaited<ReturnType<BrowserUartHarness["getSensorCfg"]>>>();
    for (const id of UART_ALL_SENSOR_IDS) {
      try {
        const cfg = await harness.getSensorCfg(id);
        cfgBySensor.set(id, cfg);
        opts.onLog(
          `${UART_SENSOR_NAMES[id]} enabled=${cfg.enabled} mask=0x${cfg.mask.toString(16)}`,
          "pass",
        );
      } catch (e) {
        markFail(e instanceof Error ? e.message : String(e));
      }
    }
    opts.onStep(4, failed ? "fail" : "ok");

    if (opts.signal?.aborted) {
      return false;
    }

    if (opts.skipSet) {
      opts.onStep(5, "warn", "skipped");
      opts.onLog("Step 5 skipped (--skip-set)", "warn");
    } else {
      opts.onStep(5, "running");
      const sht = cfgBySensor.get(2);
      if (sht == null) {
        markFail("SHT40 cfg missing from GET");
        opts.onStep(5, "fail");
      } else {
        const beforeCount = harness.getSamples().filter((s) => s.sensorId === 2).length;
        const targetPubMs =
          sht.publishIntervalMs > 0 && sht.publishIntervalMs !== 2500 ? 2500 : 3000;
        try {
          await harness.setSensorCfg({ ...sht, publishIntervalMs: targetPubMs });
          opts.onLog(`SHT40 SET publishIntervalMs→${targetPubMs}`, "pass");
          await sleep(Math.max(4000, targetPubMs * 2));
          const afterCount = harness.getSamples().filter((s) => s.sensorId === 2).length;
          const delta = afterCount - beforeCount;
          if (delta < 1) {
            opts.onLog(`SHT40: expected more samples after SET (+${delta})`, "warn");
          } else {
            opts.onLog(`SHT40: +${delta} samples after SET`, "pass");
          }
          opts.onStep(5, "ok");
        } catch (e) {
          markFail(e instanceof Error ? e.message : String(e));
          opts.onStep(5, "fail");
        }
      }
    }

    if (opts.signal?.aborted) {
      return false;
    }

    opts.onStep(6, "running");
    try {
      await harness.setBmi270StreamMode(bmi270StreamModeUiToCode("raw"));
      opts.onLog("BMI270 mode raw", "pass");
      opts.onStep(6, "ok");
    } catch (e) {
      markFail(e instanceof Error ? e.message : String(e));
      opts.onStep(6, "fail");
    }

    opts.onLog(failed ? "PROBE FAILED" : "PROBE PASSED", failed ? "fail" : "pass");
    return !failed;
  } catch (e) {
    opts.onLog(e instanceof Error ? e.message : String(e), "fail");
    return false;
  } finally {
    harness.cleanup();
  }
}
