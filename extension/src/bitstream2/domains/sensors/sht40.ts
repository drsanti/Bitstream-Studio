/** SHT40 EVT_SENSOR mask bits (simulator / host decode v1). */
export const SHT40_MASK = {
  TEMP: 0x01,
  HUM: 0x02,
} as const;

export type Sht40Decoded = {
  temp_cx100?: number;
  rh_x100?: number;
};

export function decodeSht40Values(
  mask: number,
  valuesBytes: Uint8Array,
): { ok: true; values: number[]; decoded: Sht40Decoded } | { ok: false } {
  const view = new DataView(valuesBytes.buffer, valuesBytes.byteOffset, valuesBytes.byteLength);
  let o = 0;
  const readI16 = (): number | null => {
    if (o + 2 > valuesBytes.byteLength) return null;
    const v = view.getInt16(o, true);
    o += 2;
    return v;
  };
  const values: number[] = [];
  const decoded: Sht40Decoded = {};

  if ((mask & SHT40_MASK.TEMP) !== 0) {
    const t = readI16();
    if (t == null) return { ok: false };
    decoded.temp_cx100 = t;
    values.push(t);
  }
  if ((mask & SHT40_MASK.HUM) !== 0) {
    const h = readI16();
    if (h == null) return { ok: false };
    decoded.rh_x100 = h;
    values.push(h);
  }
  if (o !== valuesBytes.byteLength) return { ok: false };
  return { ok: true, values, decoded };
}
