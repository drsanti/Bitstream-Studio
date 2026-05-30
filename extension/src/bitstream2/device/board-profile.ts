import type { BsHello } from "../protocol/hello";
import type { Bs2SensorConfig } from "../domains/config/sensor-config";
import { BS_CAPS_SENSOR_CFG_V2, BS_CAPS_SENSOR_CFG_V21 } from "../domains/config/caps";
import { BS2_SENSOR_ID } from "../domains/sensors/sensor-ids";

/** Default PSoC-edge–style simulator identity (host-only). */
export const BS2_SIM_BOARD_PROFILE = {
  hello: {
    version: 2,
    caps: 0x000f | BS_CAPS_SENSOR_CFG_V2 | BS_CAPS_SENSOR_CFG_V21,
    mtuSensor: 256,
    mtuCtrl: 512,
    fwTag: "bs2-sim-psoc",
  } satisfies BsHello,
  defaultSensorConfigs: [
    {
      sensorId: BS2_SENSOR_ID.BMI270,
      enabled: true,
      publishMode: 0,
      mask: 0x1f,
      samplingIntervalMs: 20,
      publishIntervalMs: 0,
      deltaX100: 0,
      minPublishIntervalMs: 0,
    },
    {
      sensorId: BS2_SENSOR_ID.BMM350,
      enabled: true,
      publishMode: 0,
      mask: 0x03,
      samplingIntervalMs: 100,
      publishIntervalMs: 0,
      deltaX100: 0,
      minPublishIntervalMs: 0,
    },
    {
      sensorId: BS2_SENSOR_ID.SHT40,
      enabled: true,
      publishMode: 0,
      mask: 0x03,
      samplingIntervalMs: 200,
      publishIntervalMs: 0,
      deltaX100: 0,
      minPublishIntervalMs: 0,
    },
    {
      sensorId: BS2_SENSOR_ID.DPS368,
      enabled: true,
      publishMode: 0,
      mask: 0x03,
      samplingIntervalMs: 200,
      publishIntervalMs: 0,
      deltaX100: 0,
      minPublishIntervalMs: 0,
    },
  ] satisfies Bs2SensorConfig[],
} as const;
