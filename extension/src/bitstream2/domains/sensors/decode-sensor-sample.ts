import { BS2_SENSOR_ID } from "./sensor-ids";
import { decodeBmi270Values } from "./bmi270";
import { decodeBmm350Values } from "./bmm350";
import { decodeSht40Values } from "./sht40";
import { decodeDps368Values } from "./dps368";

export type DecodedSensorSample = {
  sensorId: number;
  mask: number;
  values: number[];
};

export function decodeSensorSampleValues(
  sensorId: number,
  mask: number,
  valuesBytes: Uint8Array,
): DecodedSensorSample | null {
  switch (sensorId) {
    case BS2_SENSOR_ID.BMI270: {
      const r = decodeBmi270Values(mask, valuesBytes);
      return r.ok ? { sensorId, mask, values: r.values } : null;
    }
    case BS2_SENSOR_ID.BMM350: {
      const r = decodeBmm350Values(mask, valuesBytes);
      return r.ok ? { sensorId, mask, values: r.values } : null;
    }
    case BS2_SENSOR_ID.SHT40: {
      const r = decodeSht40Values(mask, valuesBytes);
      return r.ok ? { sensorId, mask, values: r.values } : null;
    }
    case BS2_SENSOR_ID.DPS368: {
      const r = decodeDps368Values(mask, valuesBytes);
      return r.ok ? { sensorId, mask, values: r.values } : null;
    }
    default:
      return null;
  }
}

export function sensorIdLabel(sensorId: number): string {
  switch (sensorId) {
    case BS2_SENSOR_ID.BMI270:
      return "BMI270";
    case BS2_SENSOR_ID.BMM350:
      return "BMM350";
    case BS2_SENSOR_ID.SHT40:
      return "SHT40";
    case BS2_SENSOR_ID.DPS368:
      return "DPS368";
    default:
      return `sensor ${sensorId}`;
  }
}
