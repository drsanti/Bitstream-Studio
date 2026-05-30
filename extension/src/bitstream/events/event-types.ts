import type { BitstreamSensorSampleV2 } from "./sensor-decoder";

export type BitstreamEventName =
  | "SENSOR_SAMPLE_V2"
  | "HELLO_ACK"
  | "PING_ACK"
  | "CAPS_ACK"
  | "STATUS_ACK"
  | "SENSOR_CFG_GET_ACK"
  | "SENSOR_CFG_SET_ACK"
  | "SENSOR_REINIT_ACK"
  | "BMI270_MODE_SET_ACK"
  | "BMI270_FUSION_FEED_ACK"
  | "DIAG_ACK"
  | "UNKNOWN";

export interface BitstreamEvent {
  name: BitstreamEventName;
  channel: number;
  eventId: number;
  sequence: number;
  payload: Uint8Array;
  sensorSample?: BitstreamSensorSampleV2;
}
