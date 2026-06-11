export type TrnHsla = {
  /** 0–360 */
  h: number;
  /** 0–100 */
  s: number;
  /** 0–100 */
  l: number;
  /** 0–100 */
  a: number;
};

export const TRN_COLOR_CHECKERBOARD_BG =
  "linear-gradient(45deg, #3f3f46 25%, transparent 25%), linear-gradient(-45deg, #3f3f46 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #3f3f46 75%), linear-gradient(-45deg, transparent 75%, #3f3f46 75%)";

export const TRN_COLOR_CHECKERBOARD_SIZE = "8px 8px";

export function wrapHueDegrees(value: number): number {
  const n = value % 360;
  return n < 0 ? n + 360 : n;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function hslToHex(h: number, s: number, l: number, alphaPercent = 100): string {
  const hue = wrapHueDegrees(h) / 360;
  const sat = clamp(s, 0, 100) / 100;
  const light = clamp(l, 0, 100) / 100;
  let r = 0;
  let g = 0;
  let b = 0;

  if (sat <= 0) {
    const gray = Math.round(light * 255);
    r = gray;
    g = gray;
    b = gray;
  } else {
    const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
    const p = 2 * light - q;
    const hue2rgb = (t: number) => {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };
    r = Math.round(hue2rgb(hue + 1 / 3) * 255);
    g = Math.round(hue2rgb(hue) * 255);
    b = Math.round(hue2rgb(hue - 1 / 3) * 255);
  }

  const rr = r.toString(16).padStart(2, "0");
  const gg = g.toString(16).padStart(2, "0");
  const bb = b.toString(16).padStart(2, "0");
  const alpha = clamp(alphaPercent, 0, 100);
  if (alpha >= 100 - Number.EPSILON) {
    return `#${rr}${gg}${bb}`.toLowerCase();
  }
  const aa = Math.round((alpha / 100) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${rr}${gg}${bb}${aa}`.toLowerCase();
}

export function hexToHsla(hexColor: string, fallback: TrnHsla): TrnHsla {
  if (typeof hexColor !== "string" || hexColor.length === 0) {
    return fallback;
  }
  const raw = hexColor.replace("#", "").trim();
  if (raw.length !== 6 && raw.length !== 8) {
    return fallback;
  }
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
    return fallback;
  }

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = fallback.h;
  if (delta > Number.EPSILON) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h = wrapHueDegrees(h * 60);
  }

  const l = ((max + min) / 2) * 100;
  let s = 0;
  if (delta > Number.EPSILON) {
    s = l > 50 ? delta / (2 - max - min) : delta / (max + min);
  }
  s *= 100;

  let a = 100;
  if (raw.length === 8) {
    const alphaByte = parseInt(raw.slice(6, 8), 16);
    if (Number.isFinite(alphaByte)) {
      a = (alphaByte / 255) * 100;
    }
  }

  return {
    h,
    s: clamp(s, 0, 100),
    l: clamp(l, 0, 100),
    a: clamp(a, 0, 100),
  };
}

export function normalizeTrnColorHex(value: string, fallback: string, includeAlpha = false): string {
  const trimmed = value.trim();
  const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return hex.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{8}$/.test(hex)) {
    const lower = hex.toLowerCase();
    if (includeAlpha) {
      return lower;
    }
    return lower.slice(0, 7);
  }
  return normalizeTrnColorHex(fallback, fallback, includeAlpha);
}

export function formatTrnColorHex(hsla: TrnHsla, includeAlpha: boolean): string {
  return hslToHex(hsla.h, hsla.s, hsla.l, includeAlpha ? hsla.a : 100);
}

export function trnColorCssBackground(hex: string): string {
  return `${TRN_COLOR_CHECKERBOARD_BG}, ${TRN_COLOR_CHECKERBOARD_SIZE}, ${TRN_COLOR_CHECKERBOARD_SIZE}, ${hex}`;
}
