/*******************************************************************************
 * File Name : telemetryRouteComPolicy.ts
 *
 * Description : COM release and UART full bring-up on telemetry route changes.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.1
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { BitstreamTelemetryBackend } from "../state/bitstreamTelemetryBackend";
import { releaseOpenSerialPort } from "./releaseOpenSerialPort";

/** True when routing uses the external simulator, not firmware UART. */
export function effectiveTelemetryRouteIsSimulator(
  backend: BitstreamTelemetryBackend,
): boolean {
  return backend === "simulator";
}

/**
 * Close COM when the user switches Bitstream → Simulator.
 */
export function releaseComIfEnteringSimulatorRoute(args: {
  prevBackend: BitstreamTelemetryBackend;
  nextBackend: BitstreamTelemetryBackend;
}): void {
  const prevSim = effectiveTelemetryRouteIsSimulator(args.prevBackend);
  const nextSim = effectiveTelemetryRouteIsSimulator(args.nextBackend);
  if (nextSim && !prevSim)
  {
    void releaseOpenSerialPort();
  }
}

/**
 * True when user selection requires a fresh UART pipeline (list → open → PING).
 */
export function shouldRequestUartFullBringUp(args: {
  prevBackend: BitstreamTelemetryBackend;
  nextBackend: BitstreamTelemetryBackend;
}): boolean {
  return args.nextBackend === "uart" && args.prevBackend === "simulator";
}
