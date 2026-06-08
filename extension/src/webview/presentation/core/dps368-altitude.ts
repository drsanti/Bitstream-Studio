/** Barometric altitude from pressure (simplified ISA, meters). */
export function dps368PressureToAltitudeM(pressureHpa: number, seaLevelHpa = 1013.25): number {
  if (!Number.isFinite(pressureHpa) || pressureHpa <= 0 || seaLevelHpa <= 0) {
    return NaN;
  }
  return 44330 * (1 - (pressureHpa / seaLevelHpa) ** (1 / 5.255));
}
