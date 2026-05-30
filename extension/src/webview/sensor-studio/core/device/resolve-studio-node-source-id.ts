import type { StudioNode } from "../../features/editor/store/flow-editor.store";
import {
  SENSOR_SOURCE_ID_BMI270,
  SENSOR_SOURCE_ID_BMM350,
  SENSOR_SOURCE_ID_DPS368,
  SENSOR_SOURCE_ID_SHT40,
} from "../../../bitstream-app/constants/sensorSourceIds";
import { inferSensorTelemetryHintFromSourceKey } from "../live/resolve-sensor-source-key";
import { bitstreamSensorHintToSourceId } from "./bitstream-hint-to-source-id";

export function resolveStudioNodeSourceId(node: StudioNode | null): number | null {
  if (!node) {
    return null;
  }
  switch (node.data.nodeId) {
    case "bmi270-input":
    case "bmi270-tap-quaternion":
    case "bmi270-tap-euler":
    case "bmi270-tap-accel":
    case "bmi270-tap-gyro":
      return SENSOR_SOURCE_ID_BMI270;
    case "dps368-input":
    case "dps368-tap-pressure":
    case "dps368-tap-temp":
      return SENSOR_SOURCE_ID_DPS368;
    case "sht40-input":
    case "sht40-tap-humidity":
    case "sht40-tap-temp":
      return SENSOR_SOURCE_ID_SHT40;
    case "bmm350-input":
    case "bmm350-tap-magnetic":
    case "bmm350-tap-temp":
      return SENSOR_SOURCE_ID_BMM350;
    case "sensor-input": {
      const sourceKeyRaw = node.data.defaultConfig?.sourceKey;
      const sourceKey = typeof sourceKeyRaw === "string" ? sourceKeyRaw : "bmi270.accel.x";
      const hint = inferSensorTelemetryHintFromSourceKey(sourceKey);
      return hint != null ? bitstreamSensorHintToSourceId(hint) : null;
    }
    default:
      return null;
  }
}
