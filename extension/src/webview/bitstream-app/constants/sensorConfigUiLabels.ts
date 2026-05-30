/**
 * User-facing SENSOR_CFG / telemetry configuration labels (all sensors).
 * Keep card titles and section headers aligned across BMI270, BMM350, DPS368, SHT40.
 */
export const SENSOR_CFG_UI = {
  /** Periodic | Change | Hybrid — when UART events are emitted (`publish_mode`). */
  telemetryMode: "Telemetry Mode",
  /** Raw | Fusion | Hybrid — BMI270 `stream_mode` only. */
  streamMode: "Stream Mode",
  /** Internal sensor read rate (`samplingIntervalMs`). */
  sampleRate: "Sample Rate",
  /** UART EVT_SENSOR cadence when distinct from sampling (`publishIntervalMs`). */
  telemetryRate: "Telemetry Rate",
  /** On-change / hybrid floor (`minPublishIntervalMs`). */
  minPublishInterval: "Min Publish Interval",
  /** BSX fusion pipeline read interval (BMI270 only). */
  fusionFeed: "Fusion Feed (BSX)",
} as const;
