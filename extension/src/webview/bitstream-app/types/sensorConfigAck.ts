/**
 * Last `sensor.cfg.*` apply attempt from {@link BitstreamAppControlApi#setSensorConfig}.
 * `sourceId` identifies which sensor the ACK belongs to (filters cross-sensor UI noise).
 */
export type SensorConfigPendingReason =
  | "sensor_cfg"
  /** BMI270 raw/fusion/hybrid via `sensor.bmi270.mode.set` (not `sensor.cfg.set`). */
  | "bmi270_output_mode";

export type SensorConfigAckState = {
  state: "idle" | "pending" | "ok" | "error";
  message?: string;
  atMs?: number;
  /** Present for pending / ok / error after a targeted `setSensorConfig(sourceId, …)`. */
  sourceId?: number;
  /**
   * While {@link state} is `pending`, distinguishes BMI270 output-mode applies from
   * normal `sensor.cfg` pipelines so sync effects cannot resolve the wrong pending row.
   */
  pendingReason?: SensorConfigPendingReason;
};

/** Safe fallback when context or props omit ACK (avoids `undefined.state` during handshake / Strict Mode). */
export const IDLE_SENSOR_CONFIG_ACK: SensorConfigAckState = { state: "idle" };
