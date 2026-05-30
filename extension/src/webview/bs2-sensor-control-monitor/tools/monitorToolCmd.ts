import type { MatrixTier } from "../../../bitstream2/dev/uart-sensor-test-matrix";
import type { MonitorToolId } from "./monitorToolTypes";

export type MatrixToolOptions = {
  tier: MatrixTier;
  caseId: string;
  soakMs: number;
  settleMs: number;
  minPassRatio: number;
  disabledMaxEvt: number;
  continueOnFail: boolean;
  printFailSamples: boolean;
  resumeFrom: string;
};

export type ProbeToolOptions = {
  soakMs: number;
  skipSet: boolean;
};

export type RateCheckToolOptions = {
  targetHz: number;
  soakMs: number;
  settleMs: number;
  minPassRatio: number;
  enabledBmi270: boolean;
  enabledBmm350: boolean;
  enabledSht40: boolean;
  enabledDps368: boolean;
};

export type SimToolOptions = {
  scenarioId: string;
};

export function buildMonitorCommandPreview(
  tool: MonitorToolId,
  serialPath: string,
  matrix: MatrixToolOptions,
  probe: ProbeToolOptions,
  rate: RateCheckToolOptions,
  sim: SimToolOptions,
): string {
  const pathFlag = `--path=${serialPath || "COM3"}`;
  const skipOpen = " --skip-open";

  if (tool === "matrix") {
    let cmd = `npm run bitstream2:uart-matrix -- --tier=${matrix.tier}${skipOpen} ${pathFlag}`;
    if (matrix.caseId.trim()) {
      cmd += ` --case=${matrix.caseId.trim()}`;
    }
    cmd += ` --soak-ms=${matrix.soakMs} --settle-ms=${matrix.settleMs}`;
    cmd += ` --min-pass-ratio=${matrix.minPassRatio} --disabled-max-evt=${matrix.disabledMaxEvt}`;
    if (matrix.continueOnFail) {
      cmd += " --continue-on-fail";
    }
    if (matrix.printFailSamples) {
      cmd += " --print-fail-samples";
    }
    if (matrix.resumeFrom.trim()) {
      cmd += ` --resume-from=${matrix.resumeFrom.trim()}`;
    }
    return cmd;
  }

  if (tool === "probe") {
    let cmd = `npm run bitstream2:uart-probe -- ${pathFlag}${skipOpen} --soak-ms=${probe.soakMs}`;
    if (probe.skipSet) {
      cmd += " --skip-set";
    }
    return cmd;
  }

  if (tool === "ratecheck") {
    const sensors: string[] = [];
    if (rate.enabledBmi270) {
      sensors.push("0");
    }
    if (rate.enabledBmm350) {
      sensors.push("1");
    }
    if (rate.enabledSht40) {
      sensors.push("2");
    }
    if (rate.enabledDps368) {
      sensors.push("3");
    }
    return `npm run bitstream2:uart-sensor-rate-check -- ${pathFlag}${skipOpen} --hz=${rate.targetHz} --soak-ms=${rate.soakMs} --settle-ms=${rate.settleMs} --min-pass-ratio=${rate.minPassRatio} --only=${sensors.join(",")}`;
  }

  if (tool === "sim") {
    return `npm run bitstream2:sim-scenario -- --ws ${sim.scenarioId}`;
  }

  if (tool === "injector") {
    return "npm run bitstream2:dev-inject -- --hello  # or --sample | --ping-req | --ping-write";
  }

  if (tool === "mock") {
    return "npm run bitstream2:mock-probe";
  }

  return "";
}
