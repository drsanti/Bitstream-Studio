/** Parsed `GET /data` snapshot — fields default to 0 when missing or non-numeric. */

export type Project4TelemetrySnapshot = {
  vFL: number;
  vFR: number;
  vRL: number;
  vRR: number;
  ax: number;
  ay: number;
  az: number;
  /** Legacy combined scanner bearing (deg). */
  a: number;
  /** Front ultrasonic aim (deg); JSON keys **`aF`** or **`aFront`**; else **`a`**. */
  aFront: number;
  /** Rear ultrasonic aim (deg); JSON keys **`aR`** or **`aRear`**; else **`a`**. */
  aRear: number;
  df: number;
  db: number;
};

/** Accept finite numbers or numeric strings (some firmware JSON encoders stringify floats). */
function coerceFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const t = value.trim();
    if (t.length === 0) {
      return null;
    }
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function parseProject4TelemetryJson(raw: unknown): Project4TelemetrySnapshot | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const num = (key: string): number => {
    const v = coerceFiniteNumber(o[key]);
    return v ?? 0;
  };
  const int = (key: string): number => {
    const v = coerceFiniteNumber(o[key]);
    return v != null ? Math.round(v) : 0;
  };
  const a = int("a");
  const frontAlt =
    coerceFiniteNumber(o.aF) ??
    coerceFiniteNumber(o.aFront);
  const rearAlt =
    coerceFiniteNumber(o.aR) ??
    coerceFiniteNumber(o.aRear);
  const aFront = frontAlt != null ? Math.round(frontAlt) : a;
  const aRear = rearAlt != null ? Math.round(rearAlt) : a;

  return {
    vFL: num("vFL"),
    vFR: num("vFR"),
    vRL: num("vRL"),
    vRR: num("vRR"),
    ax: num("ax"),
    ay: num("ay"),
    az: num("az"),
    a,
    aFront,
    aRear,
    df: int("df"),
    db: int("db"),
  };
}
