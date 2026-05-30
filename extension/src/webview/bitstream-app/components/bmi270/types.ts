export type SensorPublishMode = 0 | 1 | 2;

export type Bmi270CardId =
  | "operation"
  | "telemetryChannels"
  | "fusionFeed"
  | "sampling"
  | "delta"
  | "minPublish";

export type Bmi270AckState = {
  state: "idle" | "pending" | "ok" | "error";
  message?: string;
};
