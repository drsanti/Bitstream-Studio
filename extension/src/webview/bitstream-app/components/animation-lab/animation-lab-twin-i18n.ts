import { ANIMATION_LAB_STORAGE_PREFIX } from "./animation-lab-constants.js";
import type { AnimationLabTwinHealth } from "./digital-twin.types.js";
import type { AnimationLabTwinTagPresetId } from "./animation-lab-twin-tag-presets.js";

export type AnimationLabTwinLocale = "en" | "th";

const STORAGE_KEY = `${ANIMATION_LAB_STORAGE_PREFIX}:twin-locale`;

export const ANIMATION_LAB_TWIN_LOCALE_OPTIONS: ReadonlyArray<{
  value: AnimationLabTwinLocale;
  label: string;
}> = [
  { value: "en", label: "English" },
  { value: "th", label: "ไทย (Thai)" },
];

type MessageKey =
  | "health.ok"
  | "health.caution"
  | "health.warning"
  | "health.error"
  | "health.offline"
  | "dataSource.simulated"
  | "dataSource.mixed"
  | "dataSource.live"
  | "preset.industrial-hud"
  | "preset.minimal-glass"
  | "preset.bracket-tactical"
  | "preset.compact-chip"
  | "preset.high-contrast"
  | "preset.amber-phosphor"
  | "preset.wireframe-outline"
  | "presetDesc.industrial-hud"
  | "presetDesc.minimal-glass"
  | "presetDesc.bracket-tactical"
  | "presetDesc.compact-chip"
  | "presetDesc.high-contrast"
  | "presetDesc.amber-phosphor"
  | "presetDesc.wireframe-outline"
  | "inspector.localeLabel"
  | "inspector.localeHint"
  | "mapping.columnParameter"
  | "mapping.columnSensor"
  | "mapping.columnSubParam"
  | "mapping.primaryOnCard";

const MESSAGES: Record<AnimationLabTwinLocale, Record<MessageKey, string>> = {
  en: {
    "health.ok": "OK",
    "health.caution": "Caution",
    "health.warning": "Warning",
    "health.error": "Fault",
    "health.offline": "Offline",
    "dataSource.simulated": "Simulated",
    "dataSource.mixed": "Mixed",
    "dataSource.live": "Live",
    "preset.industrial-hud": "Industrial HUD",
    "preset.minimal-glass": "Minimal glass",
    "preset.bracket-tactical": "Bracket tactical",
    "preset.compact-chip": "Compact chip",
    "preset.high-contrast": "High contrast",
    "preset.amber-phosphor": "Amber phosphor",
    "preset.wireframe-outline": "Wireframe",
    "presetDesc.industrial-hud": "Dark glass, health rail, scanlines, mono telemetry",
    "presetDesc.minimal-glass": "Frosted panel, soft borders, no scanlines",
    "presetDesc.bracket-tactical": "Cyan bracket frame, ops-console accent",
    "presetDesc.compact-chip": "Dense callout for crowded models",
    "presetDesc.high-contrast": "Bold borders and type for bright booths",
    "presetDesc.amber-phosphor": "CRT terminal glow — amber readout on dark glass",
    "presetDesc.wireframe-outline": "Outline-only HUD — transparent fill, health-colored border",
    "inspector.localeLabel": "Display language",
    "inspector.localeHint": "Applies to health status, presets, and metadata translations when provided.",
    "mapping.columnParameter": "Parameter",
    "mapping.columnSensor": "Sensor",
    "mapping.columnSubParam": "Sub-parameter",
    "mapping.primaryOnCard": "Shown on 3D tag",
  },
  th: {
    "health.ok": "ปกติ",
    "health.caution": "ระวัง",
    "health.warning": "เตือน",
    "health.error": "ขัดข้อง",
    "health.offline": "ออฟไลน์",
    "dataSource.simulated": "จำลอง",
    "dataSource.mixed": "ผสม",
    "dataSource.live": "สด",
    "preset.industrial-hud": "HUD อุตสาหกรรม",
    "preset.minimal-glass": "กระจกมินิมอล",
    "preset.bracket-tactical": "ยุทธวิธีวงเล็บ",
    "preset.compact-chip": "ชิปกะทัดรัด",
    "preset.high-contrast": "คอนทราสต์สูง",
    "preset.amber-phosphor": "ฟอสฟอร์สีเหลือง",
    "preset.wireframe-outline": "โครงลวด",
    "presetDesc.industrial-hud": "กระจกเข้ม แถบสุขภาพ สแกนไลน์ ตัวเลขมอนอ",
    "presetDesc.minimal-glass": "แผ้นกระจกนุ่ม ไม่มีสแกนไลน์",
    "presetDesc.bracket-tactical": "กรอบฟ้า สไตล์คอนโซลปฏิบัติการ",
    "presetDesc.compact-chip": "ป้ายกะทัดรัดเมื่อมีหลายจุด",
    "presetDesc.high-contrast": "ขอบและตัวอักษรชัด สำหรับบูธสว่าง",
    "presetDesc.amber-phosphor": "เรืองแสง CRT สีเหลืองอำพัน",
    "presetDesc.wireframe-outline": "เฉพาะเส้นขอบ โปร่งใส สีตามสุขภาพ",
    "inspector.localeLabel": "ภาษาที่แสดง",
    "inspector.localeHint": "ใช้กับสถานะสุขภาพ พรีเซ็ต และคำแปลใน metadata (ถ้ามี)",
    "mapping.columnParameter": "พารามิเตอร์",
    "mapping.columnSensor": "เซ็นเซอร์",
    "mapping.columnSubParam": "พารามิเตอร์ย่อย",
    "mapping.primaryOnCard": "แสดงบนแท็ก 3D",
  },
};

export function readAnimationLabTwinLocale(): AnimationLabTwinLocale {
  if (typeof window === "undefined") {
    return "en";
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "th" ? "th" : "en";
  } catch {
    return "en";
  }
}

export function persistAnimationLabTwinLocale(locale: AnimationLabTwinLocale): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}

export function isAnimationLabTwinLocale(value: unknown): value is AnimationLabTwinLocale {
  return value === "en" || value === "th";
}

export function twinI18n(locale: AnimationLabTwinLocale, key: MessageKey): string {
  return MESSAGES[locale][key] ?? MESSAGES.en[key] ?? key;
}

export function twinHealthLabelLocalized(
  health: AnimationLabTwinHealth,
  locale: AnimationLabTwinLocale,
): string {
  switch (health) {
    case "ok":
      return twinI18n(locale, "health.ok");
    case "caution":
      return twinI18n(locale, "health.caution");
    case "warning":
      return twinI18n(locale, "health.warning");
    case "error":
      return twinI18n(locale, "health.error");
    case "offline":
      return twinI18n(locale, "health.offline");
    default:
      return health;
  }
}

export function twinDataSourceCaptionLocalized(
  source: "simulated" | "mixed" | "live",
  locale: AnimationLabTwinLocale,
): string {
  switch (source) {
    case "simulated":
      return twinI18n(locale, "dataSource.simulated");
    case "mixed":
      return twinI18n(locale, "dataSource.mixed");
    case "live":
      return twinI18n(locale, "dataSource.live");
  }
}

const PRESET_LABEL_KEYS: Record<AnimationLabTwinTagPresetId, MessageKey> = {
  "industrial-hud": "preset.industrial-hud",
  "minimal-glass": "preset.minimal-glass",
  "bracket-tactical": "preset.bracket-tactical",
  "compact-chip": "preset.compact-chip",
  "high-contrast": "preset.high-contrast",
  "amber-phosphor": "preset.amber-phosphor",
  "wireframe-outline": "preset.wireframe-outline",
};

const PRESET_DESC_KEYS: Record<AnimationLabTwinTagPresetId, MessageKey> = {
  "industrial-hud": "presetDesc.industrial-hud",
  "minimal-glass": "presetDesc.minimal-glass",
  "bracket-tactical": "presetDesc.bracket-tactical",
  "compact-chip": "presetDesc.compact-chip",
  "high-contrast": "presetDesc.high-contrast",
  "amber-phosphor": "presetDesc.amber-phosphor",
  "wireframe-outline": "presetDesc.wireframe-outline",
};

export function twinPresetLabelLocalized(
  presetId: AnimationLabTwinTagPresetId,
  locale: AnimationLabTwinLocale,
): string {
  const key = PRESET_LABEL_KEYS[presetId];
  return key != null ? twinI18n(locale, key) : presetId;
}

export function twinPresetDescriptionLocalized(
  presetId: AnimationLabTwinTagPresetId,
  locale: AnimationLabTwinLocale,
): string {
  const key = PRESET_DESC_KEYS[presetId];
  return key != null ? twinI18n(locale, key) : "";
}

export function twinLocaleSelectOptions(): Array<{ value: string; label: string }> {
  return ANIMATION_LAB_TWIN_LOCALE_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
  }));
}
