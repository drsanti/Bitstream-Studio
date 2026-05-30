/**
 * Maps MCU telemetry degrees (servo / firmware convention) into the twin GLB yaw arc
 * configured under Hardware settings. Linear remap with clamp at sweep endpoints.
 */
export function mapTelemetryDegToTwinYawDeg(
  telemetryDeg: number,
  twinYawMinDeg: number,
  twinYawMaxDeg: number,
  telemetrySweepMinDeg: number,
  telemetrySweepMaxDeg: number,
): number {
  const twinLo = Math.min(twinYawMinDeg, twinYawMaxDeg);
  const twinHi = Math.max(twinYawMinDeg, twinYawMaxDeg);
  const telLo = Math.min(telemetrySweepMinDeg, telemetrySweepMaxDeg);
  const telHi = Math.max(telemetrySweepMinDeg, telemetrySweepMaxDeg);

  if (!Number.isFinite(telemetryDeg)) {
    return twinLo;
  }

  if (telHi === telLo) {
    return (twinLo + twinHi) / 2;
  }

  const u = (telemetryDeg - telLo) / (telHi - telLo);
  const u01 = Math.min(1, Math.max(0, u));
  return twinLo + u01 * (twinHi - twinLo);
}
