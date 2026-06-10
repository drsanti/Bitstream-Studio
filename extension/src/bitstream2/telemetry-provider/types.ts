/**
 * Public Bitstream Telemetry Provider contract (v1).
 * Shared by postMessage (Course HTML), localhost SDK (ws://127.0.0.1:9997), and docs.
 */

export const BITSTREAM_TELEMETRY_PROVIDER_API_VERSION = 1 as const;

/** Dedicated provider WebSocket port (option B — not the raw broker on 9998). */
export const BITSTREAM_TELEMETRY_PROVIDER_DEFAULT_PORT = 9997;
export const BITSTREAM_TELEMETRY_PROVIDER_DEFAULT_HOST = "127.0.0.1";
export const BITSTREAM_TELEMETRY_PROVIDER_DEFAULT_WS_URL = `ws://${BITSTREAM_TELEMETRY_PROVIDER_DEFAULT_HOST}:${BITSTREAM_TELEMETRY_PROVIDER_DEFAULT_PORT}`;

export function resolveTelemetryProviderListenPort(): number {
  const n = Number(process.env.BITSTREAM_TELEMETRY_PROVIDER_PORT);
  if (Number.isFinite(n) && n > 0 && n <= 65535) {
    return Math.trunc(n);
  }
  return BITSTREAM_TELEMETRY_PROVIDER_DEFAULT_PORT;
}

export function resolveTelemetryProviderListenHost(): string {
  const h = process.env.BITSTREAM_TELEMETRY_PROVIDER_HOST?.trim();
  return h && h.length > 0 ? h : BITSTREAM_TELEMETRY_PROVIDER_DEFAULT_HOST;
}

export const BITSTREAM_TELEMETRY_PROVIDER_EVENT = {
  CATALOG: "bitstream:catalog",
  CONFIG: "bitstream:config",
  SAMPLE: "bitstream:sample",
  HELLO: "bitstream:hello",
  CONNECTION: "bitstream:connection",
  STALE: "bitstream:stale",
  READY: "bitstream:ready",
  REQUEST: "bitstream:request",
  COMMAND: "bitstream:command",
  RESPONSE: "bitstream:response",
} as const;

export type BitstreamTelemetryProviderEventType =
  (typeof BITSTREAM_TELEMETRY_PROVIDER_EVENT)[keyof typeof BITSTREAM_TELEMETRY_PROVIDER_EVENT];

export type BitstreamTelemetryProviderEnvelope<TPayload = unknown> = {
  type: BitstreamTelemetryProviderEventType;
  v: typeof BITSTREAM_TELEMETRY_PROVIDER_API_VERSION;
  payload: TPayload;
};

export type BitstreamTelemetryCatalogFieldDef = {
  key: string;
  label: string;
  unit: string;
  /** Physical range for gauges and validation (not wire encoding). */
  min: number;
  max: number;
  /** Divide wire integer by this to get `fields[key]`. */
  wireScale: number;
  /** Optional note for quaternion W bucket encoding, etc. */
  wireNote?: string;
};

export type BitstreamTelemetryMaskChannelDef = {
  bit: number;
  key: string;
  label: string;
};

export type BitstreamTelemetryConfigFieldDef = {
  type: "boolean" | "enum" | "u8" | "u16";
  values?: string[];
  min?: number;
  max?: number;
  default?: boolean | number | string;
  description?: string;
};

export type BitstreamTelemetrySensorCatalogEntry = {
  id: string;
  sensorId: number;
  label: string;
  fields: BitstreamTelemetryCatalogFieldDef[];
  maskChannels: BitstreamTelemetryMaskChannelDef[];
  config: Record<string, BitstreamTelemetryConfigFieldDef>;
  defaults: Record<string, boolean | number | string>;
  /** Suggested gap before `bitstream:stale` (~3× default publish interval). */
  staleAfterMs: number;
  /** Optional gauge presets (UI hints for external dashboards). */
  gaugeHints?: Record<string, { min: number; max: number; label?: string }>;
};

export type BitstreamTelemetrySensorCatalog = {
  catalogVersion: string;
  providerApiVersion: typeof BITSTREAM_TELEMETRY_PROVIDER_API_VERSION;
  providerWsUrl: string;
  sensors: BitstreamTelemetrySensorCatalogEntry[];
  sharedConfigLimits: {
    samplingIntervalMs: { min: number; max: number };
    publishIntervalMs: { min: number; max: number };
    deltaX100: { min: number; max: number };
    minPublishIntervalMs: { min: number; max: number };
    publishModes: string[];
  };
};
