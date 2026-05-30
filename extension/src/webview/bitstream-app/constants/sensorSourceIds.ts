/**
 * Firmware `sensor.cfg.*` source ids (must match host/session protocol).
 * Single place for UI panels and `sensorConfigAck.sourceId`.
 */
export const SENSOR_SOURCE_ID_SHT40 = 1;
export const SENSOR_SOURCE_ID_DPS368 = 2;
export const SENSOR_SOURCE_ID_BMM350 = 3;
export const SENSOR_SOURCE_ID_BMI270 = 4;

/** Firmware sensor.cfg source ids in stable UI order. */
export const ALL_SENSOR_SOURCE_IDS = [
  SENSOR_SOURCE_ID_BMI270,
  SENSOR_SOURCE_ID_BMM350,
  SENSOR_SOURCE_ID_SHT40,
  SENSOR_SOURCE_ID_DPS368,
] as const;

/** Short label for toasts and logs (not localized). */
export function getSensorSourceDisplayLabel(sourceId: number): string {
  switch (sourceId) {
    case SENSOR_SOURCE_ID_SHT40:
      return "SHT40";
    case SENSOR_SOURCE_ID_DPS368:
      return "DPS368";
    case SENSOR_SOURCE_ID_BMM350:
      return "BMM350";
    case SENSOR_SOURCE_ID_BMI270:
      return "BMI270";
    default:
      return `source ${sourceId}`;
  }
}
