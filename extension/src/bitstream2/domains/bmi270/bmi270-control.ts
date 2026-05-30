/** BS2 BMI270 stream mode (matches firmware `bitstream_bmi270_runtime`). */
export type Bs2Bmi270StreamMode = 0 | 1 | 2;

export const BS2_BMI270_MODE_STATUS_OK = 0;
export const BS2_BMI270_FUSION_FEED_STATUS_OK = 0;

export function encodeBmi270ModeSetBody(mode: Bs2Bmi270StreamMode): Uint8Array {
  return Uint8Array.of(mode & 0xff);
}

export function decodeBmi270ModeResBody(body: Uint8Array): Bs2Bmi270StreamMode | null {
  if (body.byteLength < 1) {
    return null;
  }
  const mode = body[0] ?? 0;
  if (mode > 2) {
    return null;
  }
  return mode as Bs2Bmi270StreamMode;
}

export function encodeBmi270FusionFeedSetBody(intervalMs: number): Uint8Array {
  const out = new Uint8Array(2);
  const view = new DataView(out.buffer);
  view.setUint16(0, intervalMs & 0xffff, true);
  return out;
}

export function decodeBmi270FusionFeedResBody(body: Uint8Array): number | null {
  if (body.byteLength < 2) {
    return null;
  }
  const view = new DataView(body.buffer, body.byteOffset, body.byteLength);
  return view.getUint16(0, true);
}

export function bmi270StreamModeUiToCode(mode: "raw" | "fusion" | "hybrid"): Bs2Bmi270StreamMode {
  if (mode === "fusion") {
    return 1;
  }
  if (mode === "hybrid") {
    return 2;
  }
  return 0;
}

export function bmi270StreamModeCodeToUi(mode: Bs2Bmi270StreamMode): "raw" | "fusion" | "hybrid" {
  if (mode === 1) {
    return "fusion";
  }
  if (mode === 2) {
    return "hybrid";
  }
  return "raw";
}
