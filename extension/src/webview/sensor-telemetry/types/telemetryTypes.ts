/*******************************************************************************
 * File Name : telemetryTypes.ts
 *
 * Description : Shared types for Sensor Telemetry workbench panels and stores.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

export type TelemetryActivityTone = "info" | "ok" | "warning" | "error";

export type TelemetryActivityLine = {
  id: string;
  atMs: number;
  text: string;
  tone: TelemetryActivityTone;
};
