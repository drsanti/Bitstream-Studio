/** DPS368 EVT_SENSOR mask bits (simulator / host decode v1). */
export const DPS368_MASK = {
  PRESS: 0x01,
  TMP: 0x02,
} as const;

export type Dps368Decoded = {
  /** Barometric pressure in hPa×10 (firmware `pressure_hpa_x10`). */
  pressure_hpa_x10?: number;
  temp_cx100?: number;
};

export function decodeDps368Values(
  mask: number,
  valuesBytes: Uint8Array,
): { ok: true; values: number[]; decoded: Dps368Decoded } | { ok: false } {
  const view = new DataView(valuesBytes.buffer, valuesBytes.byteOffset, valuesBytes.byteLength);
  let o = 0;
  const readI16 = (): number | null => {
    if (o + 2 > valuesBytes.byteLength) return null;
    const v = view.getInt16(o, true);
    o += 2;
    return v;
  };
  const values: number[] = [];
  const decoded: Dps368Decoded = {};

  if ((mask & DPS368_MASK.PRESS) !== 0) {
    const p = readI16();
    if (p == null) return { ok: false };
    decoded.pressure_hpa_x10 = p;
    values.push(p);
  }
  if ((mask & DPS368_MASK.TMP) !== 0) {
    const t = readI16();
    if (t == null) return { ok: false };
    decoded.temp_cx100 = t;
    values.push(t);
  }
  if (o !== valuesBytes.byteLength) return { ok: false };
  return { ok: true, values, decoded };
}
