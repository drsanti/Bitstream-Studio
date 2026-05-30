/**
 * Long-form hover hints for Telemetry Meta (Bitstream sample counters vs wire framing).
 * English: aligns with firmware `bitstream_protocol.c` + per-sensor ports under `proj_cm55/src/bitstream`.
 *
 * UI naming: use "sample counter" in labels (per published sample / stream). Say "payload"
 * only in help text (it is the first uint32 in the sensor payload). Avoid "frame counter" — that
 * suggests the Bitstream wire header sequence, which is a different field.
 */

const SAMPLE_COUNTER_COMMON_FOOTER = `Not the Bitstream wire-frame header sequence (u16). Not the STATUS_ACK status counter (u16). Each sensor stream has its own counter range.`;

function sampleCounterHint(sensorLabel: string): string {
  return [
    `${sensorLabel} — Sample counter (firmware payload)`,
    ``,
    `This value is the uint32 little-endian field at bytes 0–3 of the sensor payload on the Bitstream sensor channel. The host displays it as-is from the latest decoded sample.`,
    ``,
    `On the device, each sensor path maintains its own monotonic counter (typically +1 when a good sample is read from that driver). The protocol task packs it into the frame before transmit.`,
    ``,
    `If a sensor read fails, firmware may still emit a frame marked invalid and advance the counter from the last published value + 1 while repeating prior telemetry fields — so the number can move forward even when data is stale.`,
    ``,
    SAMPLE_COUNTER_COMMON_FOOTER,
  ].join("\n");
}

export const TELEMETRY_META_HINT_DPS368_SAMPLE_COUNTER = sampleCounterHint("DPS368");

export const TELEMETRY_META_HINT_BMI270_SAMPLE_COUNTER = sampleCounterHint("BMI270");

export const TELEMETRY_META_HINT_SHT40_SAMPLE_COUNTER = sampleCounterHint("SHT40");

export const TELEMETRY_META_HINT_BMM350_SAMPLE_COUNTER = sampleCounterHint("BMM350");

function streamRateHint(sensorLabel: string, sourceLine: string): string {
  return [
    `${sensorLabel} — Stream rate (Hz)`,
    ``,
    sourceLine,
    ``,
    `Rates are smoothed (EMA) in the webview ingest path so short bursts do not flicker the display.`,
    ``,
    `Use the gear menu on Telemetry Meta to choose counter-only, Hz-only, or both, and to pick the rate source.`,
  ].join("\n");
}

export const TELEMETRY_META_HINT_DPS368_STREAM_RATE = streamRateHint(
  "DPS368",
  "Device: from BS2 payload tMs inter-arrival (MCU publish spacing). Host: wall-clock gap between consecutive ingested samples. Counter: Δcounter / Δhost time when the sample counter advances. Smoothed: rolling mean of recent host gaps.",
);

export const TELEMETRY_META_HINT_BMI270_STREAM_RATE = streamRateHint(
  "BMI270",
  "Device: from BS2 payload tMs inter-arrival (MCU publish spacing). Host: wall-clock gap between consecutive ingested samples. Counter: Δcounter / Δhost time when the sample counter advances (mask subsets with the same counter are skipped). Smoothed: rolling mean of recent host gaps.",
);

export const TELEMETRY_META_HINT_SHT40_STREAM_RATE = streamRateHint(
  "SHT40",
  "Device: from BS2 payload tMs inter-arrival (MCU publish spacing). Host: wall-clock gap between consecutive ingested samples. Counter: Δcounter / Δhost time when the sample counter advances. Smoothed: rolling mean of recent host gaps.",
);

export const TELEMETRY_META_HINT_BMM350_STREAM_RATE = streamRateHint(
  "BMM350",
  "Device: from BS2 payload tMs inter-arrival (MCU publish spacing). Host: wall-clock gap between consecutive ingested samples. Counter: Δcounter / Δhost time when the sample counter advances. Smoothed: rolling mean of recent host gaps.",
);

/** Gear menu — Show: sample counter only. */
export const TELEMETRY_META_MENU_DESC_DISPLAY_COUNTER =
  "Latest EVT_SENSOR payload counter (uint32, monotonic per sensor stream).";

/** Gear menu — Show: stream rate (Hz) only. */
export const TELEMETRY_META_MENU_DESC_DISPLAY_HZ =
  "Smoothed samples/sec; rate source chosen in the section below.";

/** Gear menu — Show: counter and rate together. */
export const TELEMETRY_META_MENU_DESC_DISPLAY_BOTH =
  "Both counter and Hz on each row, e.g. 9138 · 50.00 Hz.";

/** Gear menu — Rate source: device tMs inter-arrival. */
export const TELEMETRY_META_MENU_DESC_RATE_DEVICE =
  "Hz from BS2 payload tMs gaps — reflects MCU publish spacing.";

/** Gear menu — Rate source: host wall-clock ingest. */
export const TELEMETRY_META_MENU_DESC_RATE_HOST =
  "Hz from wall-clock gaps between samples ingested in the webview.";

/** Gear menu — Rate source: counter slope vs host time. */
export const TELEMETRY_META_MENU_DESC_RATE_COUNTER =
  "Hz from Δcounter / Δhost time when the sample counter advances.";

/** Gear menu — Rate source: rolling mean of recent host gaps. */
export const TELEMETRY_META_MENU_DESC_RATE_SMOOTHED =
  "Steadier Hz from a rolling mean of recent host ingest gaps (EMA).";
