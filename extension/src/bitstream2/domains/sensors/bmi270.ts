export const BMI270_MASK = {
  ACC: 0x01,
  GYR: 0x02,
  TMP: 0x04,
  EULER: 0x08,
  QUAT: 0x10,
} as const;

export type Bmi270Decoded = {
  ax_ms2_x100?: number;
  ay_ms2_x100?: number;
  az_ms2_x100?: number;
  gx_rads_x100?: number;
  gy_rads_x100?: number;
  gz_rads_x100?: number;
  temp_cx100?: number;
  heading_radx100?: number;
  pitch_radx100?: number;
  roll_radx100?: number;
  qw_x10000?: number;
  qx_x10000?: number;
  qy_x10000?: number;
  qz_x10000?: number;
};

/**
 * Decode BMI270 valuesBytes according to the mask using canonical order:
 * ACC(3) -> GYR(3) -> TMP(1) -> EULER(3) -> QUAT(4)
 */
export function decodeBmi270Values(mask: number, valuesBytes: Uint8Array): { ok: true; values: number[]; decoded: Bmi270Decoded } | { ok: false } {
  const view = new DataView(valuesBytes.buffer, valuesBytes.byteOffset, valuesBytes.byteLength);
  let o = 0;
  const readI16 = (): number | null => {
    if (o + 2 > valuesBytes.byteLength) return null;
    const v = view.getInt16(o, true);
    o += 2;
    return v;
  };
  const readU16 = (): number | null => {
    if (o + 2 > valuesBytes.byteLength) return null;
    const v = view.getUint16(o, true);
    o += 2;
    return v;
  };

  const values: number[] = [];
  const decoded: Bmi270Decoded = {};

  const push3 = (a: keyof Bmi270Decoded, b: keyof Bmi270Decoded, c: keyof Bmi270Decoded) => {
    const v1 = readI16(); const v2 = readI16(); const v3 = readI16();
    if (v1 == null || v2 == null || v3 == null) return false;
    decoded[a] = v1; decoded[b] = v2; decoded[c] = v3;
    values.push(v1, v2, v3);
    return true;
  };

  if ((mask & BMI270_MASK.ACC) !== 0) {
    if (!push3("ax_ms2_x100", "ay_ms2_x100", "az_ms2_x100")) return { ok: false };
  }
  if ((mask & BMI270_MASK.GYR) !== 0) {
    if (!push3("gx_rads_x100", "gy_rads_x100", "gz_rads_x100")) return { ok: false };
  }
  if ((mask & BMI270_MASK.TMP) !== 0) {
    const t = readI16();
    if (t == null) return { ok: false };
    decoded.temp_cx100 = t;
    values.push(t);
  }
  if ((mask & BMI270_MASK.EULER) !== 0) {
    if (!push3("heading_radx100", "pitch_radx100", "roll_radx100")) return { ok: false };
  }
  if ((mask & BMI270_MASK.QUAT) !== 0) {
    /* W is an unsigned bucket 0..65535 (qw*10000+10000); X/Y/Z are signed ×10000. */
    const qw = readU16();
    const qx = readI16();
    const qy = readI16();
    const qz = readI16();
    if (qw == null || qx == null || qy == null || qz == null) return { ok: false };
    decoded.qw_x10000 = qw;
    decoded.qx_x10000 = qx;
    decoded.qy_x10000 = qy;
    decoded.qz_x10000 = qz;
    values.push(qw, qx, qy, qz);
  }

  if (o !== valuesBytes.byteLength) {
    // Extra bytes means host/firmware schema mismatch; treat as reject.
    return { ok: false };
  }
  return { ok: true, values, decoded };
}

