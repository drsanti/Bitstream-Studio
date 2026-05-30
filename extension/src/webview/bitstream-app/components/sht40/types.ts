export type SensorPublishMode = 0 | 1 | 2;
export type Sht40CardId =
  | "operation"
  | "sampling"
  | "delta"
  | "minPublish";
export type Sht40AckState = { state: "idle" | "pending" | "ok" | "error"; message?: string };
