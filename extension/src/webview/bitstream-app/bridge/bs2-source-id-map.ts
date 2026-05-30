/** Re-export shared BS2 ↔ legacy sourceId map (MCP + webview). */
export {
  legacySourceIdToBs2SensorId,
  bs2SensorIdToLegacySourceId,
  LEGACY_SOURCE_ID_BMI270,
  LEGACY_SOURCE_ID_BMM350,
  LEGACY_SOURCE_ID_SHT40,
  LEGACY_SOURCE_ID_DPS368,
  LEGACY_ALL_SOURCE_IDS,
} from "../../../bitstream2/domains/sensors/legacy-source-id-map";

import {
  LEGACY_SOURCE_ID_BMI270,
  LEGACY_SOURCE_ID_BMM350,
  LEGACY_SOURCE_ID_DPS368,
  LEGACY_SOURCE_ID_SHT40,
} from "../../../bitstream2/domains/sensors/legacy-source-id-map";

/** @deprecated Import from bitstream2/domains/sensors/legacy-source-id-map */
export const SENSOR_SOURCE_ID_SHT40 = LEGACY_SOURCE_ID_SHT40;
export const SENSOR_SOURCE_ID_DPS368 = LEGACY_SOURCE_ID_DPS368;
export const SENSOR_SOURCE_ID_BMM350 = LEGACY_SOURCE_ID_BMM350;
export const SENSOR_SOURCE_ID_BMI270 = LEGACY_SOURCE_ID_BMI270;
