/**
 * User-facing SENSOR_CFG / telemetry configuration labels (all sensors).
 * Keep card titles and section headers aligned across BMI270, BMM350, DPS368, SHT40.
 */
export const SENSOR_CFG_UI = {
  /** Periodic | Change | Both — when UART events are emitted (`publish_mode`). */
  telemetryMode: "Telemetry Mode",
  /** publish_mode === 2 — periodic timer plus on-change (not BMI270 stream Hybrid). */
  publishModeBoth: "Both",
  publishModePeriodicHint: "Fixed cadence — telemetry on the sampling interval.",
  publishModeChangeHint: "Publish when readings change enough (delta threshold).",
  publishModeBothHint:
    "Periodic timer plus on-change publishing (not BMI270 stream Hybrid).",
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
  /** BMI270 preset row — stream mode + EVT channel mask (Raw / Fusion / All). */
  telemetrySources: "Telemetry Sources",
} as const;
