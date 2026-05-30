export type Bs2PublishMode = 0 | 1 | 2;

export type Bs2SensorConfig = {
  sensorId: number;
  enabled: boolean;
  /** `0` periodic · `1` on_change · `2` hybrid */
  publishMode: Bs2PublishMode;
  /** Sensor-specific stream mask (meaning defined per sensor). */
  mask: number;
  /** Firmware sample period (ms). */
  samplingIntervalMs: number;
  /** Change threshold × 0.01 (on_change / hybrid). */
  deltaX100: number;
  /** Minimum time between UART publishes (ms). */
  minPublishIntervalMs: number;
  /**
   * Telemetry publish period (ms). `0` = same as `samplingIntervalMs`.
   * Requires v2.1 wire body (12 bytes).
   */
  publishIntervalMs: number;
};

export const SENSOR_CFG_BODY_V2_LEN = 10;
export const SENSOR_CFG_BODY_V21_LEN = 12;
export const SENSOR_CFG_BODY_V1_LEN = 7;

export function isBs2PublishMode(n: number): n is Bs2PublishMode {
  return n === 0 || n === 1 || n === 2;
}

export function effectivePublishIntervalMs(cfg: Bs2SensorConfig): number {
  if (cfg.publishIntervalMs > 0) {
    return cfg.publishIntervalMs;
  }
  return cfg.samplingIntervalMs;
}

export function normalizeSensorCfg(cfg: Bs2SensorConfig): Bs2SensorConfig {
  const publishMode = isBs2PublishMode(cfg.publishMode) ? cfg.publishMode : 0;
  const samplingIntervalMs = Math.max(0, Math.min(65535, Math.floor(cfg.samplingIntervalMs)));
  let publishIntervalMs = Math.max(0, Math.min(65535, Math.floor(cfg.publishIntervalMs)));
  if (publishIntervalMs > 0 && publishIntervalMs < samplingIntervalMs) {
    publishIntervalMs = samplingIntervalMs;
  }
  return {
    sensorId: cfg.sensorId & 0xff,
    enabled: Boolean(cfg.enabled),
    publishMode,
    mask: cfg.mask & 0xff,
    samplingIntervalMs,
    deltaX100: Math.max(0, Math.min(65535, Math.floor(cfg.deltaX100))),
    minPublishIntervalMs: Math.max(0, Math.min(65535, Math.floor(cfg.minPublishIntervalMs))),
    publishIntervalMs,
  };
}

/** Whether the simulator should run a sampling timer for this cfg. */
export function isSensorStreamRunnable(cfg: Bs2SensorConfig): boolean {
  return cfg.enabled && cfg.samplingIntervalMs > 0 && cfg.mask !== 0;
}

/**
 * v2.1 binary body for SENSOR_CFG_GET/SET (12 bytes).
 */
export function encodeSensorCfgBody(cfg: Bs2SensorConfig): Uint8Array {
  const c = normalizeSensorCfg(cfg);
  const out = new Uint8Array(SENSOR_CFG_BODY_V21_LEN);
  const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
  out[0] = c.sensorId;
  out[1] = c.enabled ? 1 : 0;
  out[2] = c.publishMode;
  out[3] = c.mask;
  view.setUint16(4, c.samplingIntervalMs, true);
  view.setUint16(6, c.deltaX100, true);
  view.setUint16(8, c.minPublishIntervalMs, true);
  view.setUint16(10, c.publishIntervalMs, true);
  return out;
}

export function encodeSensorCfgGetBody(sensorId: number): Uint8Array {
  return Uint8Array.of(sensorId & 0xff);
}

/** Decode v2.1 body (12 bytes). */
export function decodeSensorCfgBodyV21(body: Uint8Array): Bs2SensorConfig | null {
  if (body.byteLength < SENSOR_CFG_BODY_V21_LEN) return null;
  const view = new DataView(body.buffer, body.byteOffset, body.byteLength);
  const publishMode = body[2] ?? 0;
  if (!isBs2PublishMode(publishMode)) return null;
  return normalizeSensorCfg({
    sensorId: body[0] ?? 0,
    enabled: (body[1] ?? 0) !== 0,
    publishMode,
    mask: body[3] ?? 0,
    samplingIntervalMs: view.getUint16(4, true),
    deltaX100: view.getUint16(6, true),
    minPublishIntervalMs: view.getUint16(8, true),
    publishIntervalMs: view.getUint16(10, true),
  });
}

/** Decode v2 body (10 bytes). */
export function decodeSensorCfgBodyV2(body: Uint8Array): Bs2SensorConfig | null {
  if (body.byteLength < SENSOR_CFG_BODY_V2_LEN) return null;
  const view = new DataView(body.buffer, body.byteOffset, body.byteLength);
  const publishMode = body[2] ?? 0;
  if (!isBs2PublishMode(publishMode)) return null;
  return normalizeSensorCfg({
    sensorId: body[0] ?? 0,
    enabled: (body[1] ?? 0) !== 0,
    publishMode,
    mask: body[3] ?? 0,
    samplingIntervalMs: view.getUint16(4, true),
    deltaX100: view.getUint16(6, true),
    minPublishIntervalMs: view.getUint16(8, true),
    publishIntervalMs: 0,
  });
}

/** Decode legacy 7-byte body and upgrade to v2.1 shape. */
export function decodeSensorCfgBodyV1(body: Uint8Array): Bs2SensorConfig | null {
  if (body.byteLength < SENSOR_CFG_BODY_V1_LEN) return null;
  const view = new DataView(body.buffer, body.byteOffset, body.byteLength);
  return normalizeSensorCfg({
    sensorId: body[0] ?? 0,
    enabled: (body[1] ?? 0) !== 0,
    publishMode: 0,
    mask: body[2] ?? 0,
    samplingIntervalMs: view.getUint16(3, true),
    deltaX100: 0,
    minPublishIntervalMs: view.getUint16(5, true),
    publishIntervalMs: 0,
  });
}

/** Prefer v2.1 → v2 → v1. */
export function decodeSensorCfgBody(body: Uint8Array): Bs2SensorConfig | null {
  if (body.byteLength >= SENSOR_CFG_BODY_V21_LEN) {
    return decodeSensorCfgBodyV21(body);
  }
  if (body.byteLength >= SENSOR_CFG_BODY_V2_LEN) {
    return decodeSensorCfgBodyV2(body);
  }
  return decodeSensorCfgBodyV1(body);
}

export function encodeStreamMaskSetBody(sensorId: number, mask: number): Uint8Array {
  return Uint8Array.of(sensorId & 0xff, mask & 0xff);
}

export function encodeStreamRateSetBody(sensorId: number, intervalMs: number): Uint8Array {
  const out = new Uint8Array(1 + 2);
  const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
  out[0] = sensorId & 0xff;
  view.setUint16(1, intervalMs & 0xffff, true);
  return out;
}
