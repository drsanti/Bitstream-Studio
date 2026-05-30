/*******************************************************************************
 * File Name : telemetryModeLifecycle.ts
 *
 * Description : Teardown and setup when switching Bitstream (UART) vs Simulator telemetry.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { BitstreamTelemetryBackend } from "../state/bitstreamTelemetryBackend.js";
import { useBitstreamLiveStore } from "../state/bitstreamLive.store.js";
import { releaseOpenSerialPort } from "./releaseOpenSerialPort.js";
import {
  publishDevSimStreamingControl,
  publishDevSimStreamingIdle,
} from "./publishDevSimStreamingControl.js";
import { publishTelemetryRoute } from "./publishTelemetryRoute.js";

export type TelemetryModeLifecycleArgs = {
  prevBackend: BitstreamTelemetryBackend;
  nextBackend: BitstreamTelemetryBackend;
  armSimulatorWatch: () => void;
  armUartWatch: () => void;
};

/**
 * Run async teardown/setup after toolbar mode change. Clears live telemetry, releases COM
 * when entering Simulator, and publishes bridge route + sim streaming control.
 */
export async function runTelemetryModeLifecycleSwitch(
  args: TelemetryModeLifecycleArgs,
): Promise<void> {
  const { prevBackend, nextBackend } = args;
  if (prevBackend === nextBackend)
  {
    return;
  }

  /* --- Shared teardown --- */
  const live = useBitstreamLiveStore.getState();
  live.resetLiveData();
  live.setHandshakeState("unknown");
  live.setHandshakeLastError(null);

  if (nextBackend === "simulator")
  {
    await releaseOpenSerialPort();
    args.armSimulatorWatch();
    publishTelemetryRoute("simulator");
    publishDevSimStreamingControl();
    return;
  }

  args.armUartWatch();
  publishTelemetryRoute("uart");
  publishDevSimStreamingIdle();
}
