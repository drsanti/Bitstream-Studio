/*******************************************************************************
 * File Name : labTypes.ts
 *
 * Description : Shared types for Bitstream Lab panels and stores.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

export type LabHealthTone = "ok" | "warn" | "off";

export type LabHealthSnapshot = {
  brokerUp: boolean;
  serialOpen: boolean;
  bs2Linked: boolean;
  loopbackOn: boolean;
  helloAgeMs: number | null;
};

export type LabTapChannel = "json" | "binary";

export type LabTapEntry = {
  id: string;
  atMs: number;
  topic: string;
  channel: LabTapChannel;
  qos: number;
  payloadPreview: string;
  payloadBytes: number;
  payloadJson?: unknown;
};

export type LabActivityTone = "info" | "ok" | "warning" | "error";

export type LabActivityLine = {
  id: string;
  atMs: number;
  text: string;
  tone: LabActivityTone;
};
