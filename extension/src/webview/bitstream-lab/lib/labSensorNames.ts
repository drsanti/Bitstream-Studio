/*******************************************************************************
 * File Name : labSensorNames.ts
 *
 * Description : BS2 sensor id labels for Lab smoke / protocol panels.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { Bitstream2SensorSamplePayload } from "../../../bitstream2/bridge/protocol";

export const LAB_SENSOR_NAMES: Record<number, string> = {
  0: "BMI270",
  1: "BMM350",
  2: "SHT40",
  3: "DPS368",
};

export function labSensorName(sensorId: number): string {
  return LAB_SENSOR_NAMES[sensorId] ?? `id=${sensorId}`;
}

/** One-line summary for BS2 smoke panel. */
export function formatLabLastSensorLine(sample: Bitstream2SensorSamplePayload): string {
  const name = labSensorName(sample.sensorId);
  const preview =
    sample.values.length > 0
      ? sample.values
          .map((v) => (Number.isInteger(v) ? String(v) : v.toFixed(3)))
          .join(", ")
      : "—";
  return `${name} mask=0x${sample.mask.toString(16)} cnt=${sample.counter} [${preview}]`;
}
