import { z } from "zod";
import { courseBlockColorHexSchema } from "./blockColorHex";

export const COURSE_TITLE_ICON_ANIMATION_PRESETS = [
  "none",
  "pulse",
  "spin",
  "swing",
  "float",
  "color-breathe",
  "color-cycle",
  "custom",
] as const;

export const COURSE_TITLE_ICON_COLOR_CYCLE_MIN = 2;
export const COURSE_TITLE_ICON_COLOR_CYCLE_MAX = 8;

export type CourseTitleIconAnimationPreset = (typeof COURSE_TITLE_ICON_ANIMATION_PRESETS)[number];

export const COURSE_TITLE_ICON_ANIMATION_EASES = [
  "none",
  "sine.inOut",
  "power1.inOut",
  "power2.inOut",
  "elastic.out",
  "back.out",
] as const;

export type CourseTitleIconAnimationEase = (typeof COURSE_TITLE_ICON_ANIMATION_EASES)[number];

const motionChannelSchema = z.object({
  enabled: z.boolean().optional(),
  x: z.number().min(-48).max(48).optional(),
  y: z.number().min(-48).max(48).optional(),
  scale: z.number().min(0.25).max(2.5).optional(),
  rotation: z.number().min(-360).max(360).optional(),
});

const colorChannelSchema = z.object({
  enabled: z.boolean().optional(),
  /** Single peak for yoyo breathe (legacy / simple mode). */
  to: courseBlockColorHexSchema.optional(),
  /** Fade cycle: A → B → C → … → A. Minimum two entries when set. */
  colors: z
    .array(courseBlockColorHexSchema)
    .min(COURSE_TITLE_ICON_COLOR_CYCLE_MIN)
    .max(COURSE_TITLE_ICON_COLOR_CYCLE_MAX)
    .optional(),
});

export const courseTitleIconAnimationSchema = z
  .object({
    preset: z.enum(COURSE_TITLE_ICON_ANIMATION_PRESETS).optional(),
    duration: z.number().min(0.15).max(30).optional(),
    ease: z.enum(COURSE_TITLE_ICON_ANIMATION_EASES).optional(),
    loop: z.boolean().optional(),
    yoyo: z.boolean().optional(),
    repeat: z.number().int().min(-1).max(999).optional(),
    motion: motionChannelSchema.optional(),
    color: colorChannelSchema.optional(),
  })
  .optional();

export type CourseTitleIconAnimation = z.infer<typeof courseTitleIconAnimationSchema>;

export type ResolvedCourseTitleIconAnimation = {
  duration: number;
  ease: string;
  repeat: number;
  yoyo: boolean;
  motion?: {
    x?: number;
    y?: number;
    scale?: number;
    rotation?: number;
  };
  color?: {
    /** Yoyo between rest and a single peak color. */
    yoyoTo?: string;
    /** Multi-color fade loop (duration = seconds per step). */
    cycle?: string[];
  };
};

export const COURSE_TITLE_ICON_ANIMATION_DEFAULTS = {
  duration: 1.6,
  ease: "sine.inOut" as CourseTitleIconAnimationEase,
  repeat: -1,
  yoyo: true,
  customMotion: {
    scale: 1.12,
    rotation: 8,
  },
  customColorPeak: "#fbbf24",
  colorCycle: ["#fafafa", "#fbbf24", "#22d3ee"] as const,
} as const;

export function normalizeIconAnimationColorCycle(
  color: NonNullable<CourseTitleIconAnimation>["color"] | undefined,
  restColorHex: string | undefined,
  options?: { preset?: CourseTitleIconAnimationPreset },
): string[] {
  const fromList = color?.colors?.filter((entry) => entry != null && entry.length > 0);
  if (fromList != null && fromList.length >= COURSE_TITLE_ICON_COLOR_CYCLE_MIN) {
    return fromList.map((entry) => entry.toLowerCase());
  }
  if (options?.preset === "color-cycle") {
    const base = restColorHex ?? COURSE_TITLE_ICON_ANIMATION_DEFAULTS.colorCycle[0];
    return [base, COURSE_TITLE_ICON_ANIMATION_DEFAULTS.customColorPeak, "#22d3ee"];
  }
  const base = restColorHex ?? "#fafafa";
  const peak = color?.to ?? COURSE_TITLE_ICON_ANIMATION_DEFAULTS.customColorPeak;
  return [base, peak];
}

export function defaultIconAnimationColorCycleSeed(restColorHex: string): string[] {
  return [restColorHex, COURSE_TITLE_ICON_ANIMATION_DEFAULTS.customColorPeak, "#22d3ee"];
}

export function normalizeCourseTitleIconAnimationEase(
  value: unknown,
): CourseTitleIconAnimationEase {
  if (
    value === "none" ||
    value === "sine.inOut" ||
    value === "power1.inOut" ||
    value === "power2.inOut" ||
    value === "elastic.out" ||
    value === "back.out"
  ) {
    return value;
  }
  return COURSE_TITLE_ICON_ANIMATION_DEFAULTS.ease;
}

export function normalizeCourseTitleIconAnimationPreset(
  value: unknown,
): CourseTitleIconAnimationPreset {
  if (
    value === "none" ||
    value === "pulse" ||
    value === "spin" ||
    value === "swing" ||
    value === "float" ||
    value === "color-breathe" ||
    value === "color-cycle" ||
    value === "custom"
  ) {
    return value;
  }
  return "none";
}

export function isCourseTitleIconAnimationActive(
  animation: CourseTitleIconAnimation | undefined,
): boolean {
  if (animation == null) {
    return false;
  }
  const preset = normalizeCourseTitleIconAnimationPreset(animation.preset);
  return preset !== "none";
}

export function stripEmptyCourseTitleIconAnimation(
  animation: CourseTitleIconAnimation | undefined,
): CourseTitleIconAnimation | undefined {
  if (animation == null || !isCourseTitleIconAnimationActive(animation)) {
    return undefined;
  }
  const preset = normalizeCourseTitleIconAnimationPreset(animation.preset);
  const next: NonNullable<CourseTitleIconAnimation> = { preset };
  if (animation.duration != null) {
    next.duration = animation.duration;
  }
  if (animation.ease != null) {
    next.ease = animation.ease;
  }
  if (animation.loop != null) {
    next.loop = animation.loop;
  }
  if (animation.yoyo != null) {
    next.yoyo = animation.yoyo;
  }
  if (animation.repeat != null) {
    next.repeat = animation.repeat;
  }
  if (animation.motion != null && preset === "custom") {
    const motion = { ...animation.motion };
    if (motion.enabled === false) {
      delete motion.enabled;
    }
    if (Object.keys(motion).length > 0) {
      next.motion = motion;
    }
  }
  if (
    animation.color != null &&
    (preset === "custom" || preset === "color-breathe" || preset === "color-cycle")
  ) {
    const color = { ...animation.color };
    if (color.enabled === false) {
      delete color.enabled;
    }
    if (color.colors != null && color.colors.length < COURSE_TITLE_ICON_COLOR_CYCLE_MIN) {
      delete color.colors;
    }
    if (Object.keys(color).length > 0) {
      next.color = color;
    }
  }
  return next;
}

export function patchCourseTitleIconColorChannel(
  current: NonNullable<CourseTitleIconAnimation>["color"] | undefined,
  patch: Partial<NonNullable<NonNullable<CourseTitleIconAnimation>["color"]>>,
): NonNullable<CourseTitleIconAnimation>["color"] {
  const next: NonNullable<NonNullable<CourseTitleIconAnimation>["color"]> = {
    ...(current ?? {}),
    ...patch,
  };
  if (patch.colors != null && patch.colors.length >= COURSE_TITLE_ICON_COLOR_CYCLE_MIN) {
    delete next.to;
  }
  if (patch.to != null) {
    delete next.colors;
  }
  return next;
}

export function patchCourseTitleIconAnimation(
  current: CourseTitleIconAnimation | undefined,
  patch: Partial<NonNullable<CourseTitleIconAnimation>>,
): CourseTitleIconAnimation | undefined {
  const merged = { ...(current ?? {}), ...patch } as CourseTitleIconAnimation;
  if (patch.color != null) {
    merged.color = patchCourseTitleIconColorChannel(current?.color, patch.color);
  }
  if (patch.preset === "none") {
    return undefined;
  }
  return stripEmptyCourseTitleIconAnimation(merged);
}

export function resolveCourseTitleIconAnimation(
  animation: CourseTitleIconAnimation | undefined,
  restColorHex: string | undefined,
): ResolvedCourseTitleIconAnimation | null {
  if (!isCourseTitleIconAnimationActive(animation)) {
    return null;
  }
  const preset = normalizeCourseTitleIconAnimationPreset(animation?.preset);
  const duration = animation?.duration ?? COURSE_TITLE_ICON_ANIMATION_DEFAULTS.duration;
  const ease = normalizeCourseTitleIconAnimationEase(animation?.ease);
  const repeat =
    animation?.repeat ??
    (animation?.loop === false ? 0 : COURSE_TITLE_ICON_ANIMATION_DEFAULTS.repeat);
  const yoyo = animation?.yoyo ?? COURSE_TITLE_ICON_ANIMATION_DEFAULTS.yoyo;

  if (preset === "pulse") {
    return { duration, ease, repeat, yoyo, motion: { scale: 1.12 } };
  }
  if (preset === "spin") {
    return {
      duration: animation?.duration ?? 2.4,
      ease: "none",
      repeat,
      yoyo: false,
      motion: { rotation: 360 },
    };
  }
  if (preset === "swing") {
    return { duration, ease, repeat, yoyo, motion: { rotation: 14 } };
  }
  if (preset === "float") {
    return { duration, ease, repeat, yoyo, motion: { y: -5 } };
  }
  if (preset === "color-breathe") {
    const cycleColors = animation?.color?.colors;
    if (cycleColors != null && cycleColors.length >= COURSE_TITLE_ICON_COLOR_CYCLE_MIN) {
      return {
        duration,
        ease,
        repeat: -1,
        yoyo: false,
        color: { cycle: normalizeIconAnimationColorCycle(animation?.color, restColorHex) },
      };
    }
    const peak =
      animation?.color?.to ??
      restColorHex ??
      COURSE_TITLE_ICON_ANIMATION_DEFAULTS.customColorPeak;
    return { duration, ease, repeat, yoyo, color: { yoyoTo: peak } };
  }
  if (preset === "color-cycle") {
    return {
      duration,
      ease,
      repeat: -1,
      yoyo: false,
      color: {
        cycle: normalizeIconAnimationColorCycle(animation?.color, restColorHex, {
          preset: "color-cycle",
        }),
      },
    };
  }

  const motionEnabled = animation?.motion?.enabled !== false;
  const colorEnabled = animation?.color?.enabled !== false;
  const resolved: ResolvedCourseTitleIconAnimation = { duration, ease, repeat, yoyo };

  if (motionEnabled) {
    const motion = animation?.motion;
    const hasMotion =
      motion?.x != null ||
      motion?.y != null ||
      motion?.scale != null ||
      motion?.rotation != null;
    resolved.motion = hasMotion
      ? {
          x: motion?.x,
          y: motion?.y,
          scale: motion?.scale ?? COURSE_TITLE_ICON_ANIMATION_DEFAULTS.customMotion.scale,
          rotation: motion?.rotation ?? COURSE_TITLE_ICON_ANIMATION_DEFAULTS.customMotion.rotation,
        }
      : {
          scale: COURSE_TITLE_ICON_ANIMATION_DEFAULTS.customMotion.scale,
          rotation: COURSE_TITLE_ICON_ANIMATION_DEFAULTS.customMotion.rotation,
        };
  }

  if (colorEnabled) {
    const cycleColors = animation?.color?.colors;
    if (cycleColors != null && cycleColors.length >= COURSE_TITLE_ICON_COLOR_CYCLE_MIN) {
      resolved.color = {
        cycle: normalizeIconAnimationColorCycle(animation?.color, restColorHex),
      };
      resolved.yoyo = false;
      resolved.repeat = -1;
    } else {
      resolved.color = {
        yoyoTo:
          animation?.color?.to ??
          restColorHex ??
          COURSE_TITLE_ICON_ANIMATION_DEFAULTS.customColorPeak,
      };
    }
  }

  if (resolved.motion == null && resolved.color == null) {
    return null;
  }

  return resolved;
}
