export type Sht40ComfortZone =
  | "Comfortable"
  | "Too humid"
  | "Too dry"
  | "Too warm"
  | "Too cool"
  | "Unknown";

export function classifySht40Comfort(tempC: number, rhPct: number): Sht40ComfortZone {
  if (!Number.isFinite(tempC) || !Number.isFinite(rhPct)) {
    return "Unknown";
  }
  if (rhPct > 65) {
    return "Too humid";
  }
  if (rhPct < 30) {
    return "Too dry";
  }
  if (tempC > 28) {
    return "Too warm";
  }
  if (tempC < 18) {
    return "Too cool";
  }
  return "Comfortable";
}
