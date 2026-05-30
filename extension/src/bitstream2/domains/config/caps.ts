/** `HELLO.caps` bit4 — `SENSOR_CFG` body is 10 bytes (v2). */
export const BS_CAPS_SENSOR_CFG_V2 = 0x0010;

/** `HELLO.caps` bit5 — `SENSOR_CFG` body is 12 bytes (v2.1, adds `publishIntervalMs`). */
export const BS_CAPS_SENSOR_CFG_V21 = 0x0020;

export function hasSensorCfgV2(caps: number): boolean {
  return (caps & BS_CAPS_SENSOR_CFG_V2) !== 0;
}

export function hasSensorCfgV21(caps: number): boolean {
  return (caps & BS_CAPS_SENSOR_CFG_V21) !== 0;
}
