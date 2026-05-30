import type { BitstreamSensorSourceHint } from "../../../../bitstream/events/sensor-decoder";
import {
  SENSOR_SOURCE_ID_BMI270,
  SENSOR_SOURCE_ID_BMM350,
  SENSOR_SOURCE_ID_DPS368,
  SENSOR_SOURCE_ID_SHT40,
} from "../../../bitstream-app/constants/sensorSourceIds";

/** Map live-stream hint to firmware `sensor.cfg` `sourceId`. */
export function bitstreamSensorHintToSourceId(
  hint: BitstreamSensorSourceHint,
): number | null {
  switch (hint) {
    case "bmi270":
      return SENSOR_SOURCE_ID_BMI270;
    case "dps368":
      return SENSOR_SOURCE_ID_DPS368;
    case "sht40":
      return SENSOR_SOURCE_ID_SHT40;
    case "bmm350":
      return SENSOR_SOURCE_ID_BMM350;
    default:
      return null;
  }
}
