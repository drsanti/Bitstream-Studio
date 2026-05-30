/** BMM350 EVT_SENSOR mask bits (simulator / host decode v1). */
export const BMM350_MASK = {
  MAG: 0x01,
  TMP: 0x02,
} as const;

export type Bmm350Decoded = {
  mx_ut_x100?: number;
  my_ut_x100?: number;
  mz_ut_x100?: number;
  temp_cx100?: number;
};

export function decodeBmm350Values(
  mask: number,
  valuesBytes: Uint8Array,
): { ok: true; values: number[]; decoded: Bmm350Decoded } | { ok: false } {
  const view = new DataView(valuesBytes.buffer, valuesBytes.byteOffset, valuesBytes.byteLength);
  let o = 0;
  const readI16 = (): number | null => {
    if (o + 2 > valuesBytes.byteLength) return null;
    const v = view.getInt16(o, true);
    o += 2;
    return v;
  };
  const values: number[] = [];
  const decoded: Bmm350Decoded = {};

  if ((mask & BMM350_MASK.MAG) !== 0) {
    const mx = readI16();
    const my = readI16();
    const mz = readI16();
    if (mx == null || my == null || mz == null) return { ok: false };
    decoded.mx_ut_x100 = mx;
    decoded.my_ut_x100 = my;
    decoded.mz_ut_x100 = mz;
    values.push(mx, my, mz);
  }
  if ((mask & BMM350_MASK.TMP) !== 0) {
    const t = readI16();
    if (t == null) return { ok: false };
    decoded.temp_cx100 = t;
    values.push(t);
  }
  if (o !== valuesBytes.byteLength) return { ok: false };
  return { ok: true, values, decoded };
}
