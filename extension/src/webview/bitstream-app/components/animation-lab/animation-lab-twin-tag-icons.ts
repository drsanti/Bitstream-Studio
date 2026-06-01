import type { AnimationLabTwinDataSource, AnimationLabTwinHealth } from "./digital-twin.types.js";

/** Canonical icon ids — metadata `cardIcon` must match one of these. */
export type AnimationLabTwinCardIconId =
  | "gimbal"
  | "motor"
  | "camera"
  | "imu"
  | "sensor"
  | "payload"
  | "generic";

export type AnimationLabTwinTagIconAnimation =
  | "none"
  | "pulse"
  | "fault-blink"
  | "live-glow"
  | "spin"
  | "sweep";

/** Operator control for motion on card icons. */
export type AnimationLabTwinTagIconAnimationLevel = "off" | "health" | "full";

export type AnimationLabTwinTagIconGlyphStyle = "lucide" | "hud";

export type AnimationLabTwinTagIconPlacement = "leading" | "corner";

const ANIMATION_LEVELS = new Set<string>(["off", "health", "full"]);
const GLYPH_STYLES = new Set<string>(["lucide", "hud"]);

export function isAnimationLabTwinTagIconAnimationLevel(
  value: unknown,
): value is AnimationLabTwinTagIconAnimationLevel {
  return typeof value === "string" && ANIMATION_LEVELS.has(value);
}

export function isAnimationLabTwinTagIconGlyphStyle(
  value: unknown,
): value is AnimationLabTwinTagIconGlyphStyle {
  return typeof value === "string" && GLYPH_STYLES.has(value);
}

export function normalizeTwinTagIconAnimationLevel(
  value: unknown,
): AnimationLabTwinTagIconAnimationLevel {
  return isAnimationLabTwinTagIconAnimationLevel(value) ? value : "full";
}

export function normalizeTwinTagIconGlyphStyle(
  value: unknown,
): AnimationLabTwinTagIconGlyphStyle {
  return isAnimationLabTwinTagIconGlyphStyle(value) ? value : "lucide";
}

const CARD_ICON_IDS = new Set<string>([
  "gimbal",
  "motor",
  "camera",
  "imu",
  "sensor",
  "payload",
  "generic",
]);

export function isAnimationLabTwinCardIconId(value: unknown): value is AnimationLabTwinCardIconId {
  return typeof value === "string" && CARD_ICON_IDS.has(value);
}

export function resolveTwinTagIconId(args: {
  componentId: string;
  group?: string;
  cardIcon?: string;
}): AnimationLabTwinCardIconId {
  if (args.cardIcon != null && isAnimationLabTwinCardIconId(args.cardIcon.trim())) {
    return args.cardIcon.trim() as AnimationLabTwinCardIconId;
  }

  const id = args.componentId.toLowerCase();
  if (id.includes("gimbal")) {
    return "gimbal";
  }
  if (id.includes("motor") || id.includes("prop") || id.includes("wing")) {
    return "motor";
  }
  if (id.includes("camera")) {
    return "camera";
  }
  if (id.includes("imu") || id.includes("ins")) {
    return "imu";
  }

  const group = args.group?.trim().toLowerCase() ?? "";
  if (group.includes("gimbal")) {
    return "gimbal";
  }
  if (group.includes("propulsion") || group.includes("motor")) {
    return "motor";
  }
  if (group.includes("payload") || group.includes("camera")) {
    return "camera";
  }
  if (group.includes("sensor")) {
    return "sensor";
  }

  return "generic";
}

function resolveHealthOnlyIconAnimation(
  health: AnimationLabTwinHealth,
): AnimationLabTwinTagIconAnimation {
  if (health === "error") {
    return "fault-blink";
  }
  if (health === "warning" || health === "caution") {
    return "pulse";
  }
  return "none";
}

export function resolveTwinTagIconAnimation(args: {
  health: AnimationLabTwinHealth;
  iconId: AnimationLabTwinCardIconId;
  dataSource: AnimationLabTwinDataSource;
  active: boolean;
  animationLevel?: AnimationLabTwinTagIconAnimationLevel;
}): AnimationLabTwinTagIconAnimation {
  const level = args.animationLevel ?? "full";

  if (!args.active || args.health === "offline" || level === "off") {
    return "none";
  }

  if (level === "health") {
    return resolveHealthOnlyIconAnimation(args.health);
  }

  if (args.health === "error") {
    return "fault-blink";
  }
  if (args.health === "warning" || args.health === "caution") {
    return "pulse";
  }
  if (args.iconId === "motor") {
    return "spin";
  }
  if (args.iconId === "gimbal") {
    return "sweep";
  }
  if (args.dataSource === "live" || args.dataSource === "mixed") {
    return "live-glow";
  }
  return "none";
}

/** CSS custom property value for spin duration (seconds). */
export function twinTagIconSpinDurationS(loadPct: number | undefined): number {
  const load = typeof loadPct === "number" && Number.isFinite(loadPct) ? loadPct : 35;
  const clamped = Math.min(100, Math.max(5, load));
  return Math.max(0.85, 2.8 - clamped * 0.018);
}

export function readMotorLoadPctFromPrimarySignal(signal: {
  value: number;
  unit: string;
  key: string;
} | undefined): number | undefined {
  if (signal == null) {
    return undefined;
  }
  const key = signal.key.toLowerCase();
  if (signal.unit === "%" || key.includes("load")) {
    return Math.min(100, Math.max(0, signal.value));
  }
  return undefined;
}
