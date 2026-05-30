/*******************************************************************************
 * File Name : sensorPublishInterval.ts
 *
 * Description : Effective UART publish interval from SENSOR_CFG v2.1 rows.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

/** UART publish cadence: publishIntervalMs when set, else samplingIntervalMs (firmware BS2 rule). */
export function effectiveSensorPublishIntervalMs(
  samplingIntervalMs: number | undefined,
  publishIntervalMs: number | undefined,
): number {
  const sampleMs =
    typeof samplingIntervalMs === "number" && Number.isFinite(samplingIntervalMs)
      ? Math.max(1, Math.round(samplingIntervalMs))
      : 1000;
  const publishMs =
    typeof publishIntervalMs === "number" && Number.isFinite(publishIntervalMs)
      ? Math.round(publishIntervalMs)
      : 0;
  if (publishMs > 0) {
    return Math.max(1, publishMs);
  }
  return sampleMs;
}
