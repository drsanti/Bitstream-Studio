export type SensorPublishMode = 0 | 1 | 2;

export type Bmm350CardId =
  | "operation"
  | "sampling"
  | "delta"
  | "minPublish";

export type Bmm350AckState = {
  state: "idle" | "pending" | "ok" | "error";
  message?: string;
};
