import {
  Activity,
  Camera,
  CircleDot,
  Crosshair,
  Fan,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import { twMerge } from "tailwind-merge";
import type {
  AnimationLabTwinCardIconId,
  AnimationLabTwinTagIconAnimation,
  AnimationLabTwinTagIconGlyphStyle,
  AnimationLabTwinTagIconPlacement,
} from "../animation-lab-twin-tag-icons.js";
import { twinTagHealthIconClass } from "../animation-lab-twin-health.js";
import type { AnimationLabTwinHealth } from "../digital-twin.types.js";
import { TWIN_TAG_DEFAULT_SIZE_SCALE } from "../animation-lab-constants.js";
import type { AnimationLabTwinTagPresetId } from "../animation-lab-twin-tag-presets.js";
import { AnimationLabTwinTagHudGlyph } from "./animation-lab-twin-tag-glyphs.js";

const ICON_BY_ID: Record<AnimationLabTwinCardIconId, LucideIcon> = {
  gimbal: Crosshair,
  motor: Fan,
  camera: Camera,
  imu: Gauge,
  sensor: Activity,
  payload: Camera,
  generic: CircleDot,
};

const ANIMATION_CLASS: Record<AnimationLabTwinTagIconAnimation, string> = {
  none: "",
  pulse: "animation-lab-twin-tag-icon--pulse",
  "fault-blink": "animation-lab-twin-tag-icon--fault-blink",
  "live-glow": "animation-lab-twin-tag-icon--live-glow",
  spin: "animation-lab-twin-tag-icon--spin",
  sweep: "animation-lab-twin-tag-icon--sweep",
};

function iconSizePx(presetId: AnimationLabTwinTagPresetId, compact?: boolean): number {
  const s = TWIN_TAG_DEFAULT_SIZE_SCALE;
  if (compact || presetId === "compact-chip") {
    return 12 * s;
  }
  if (presetId === "minimal-glass") {
    return 14 * s;
  }
  return 16 * s;
}

export function AnimationLabTwinTagIcon(props: {
  iconId: AnimationLabTwinCardIconId;
  health: AnimationLabTwinHealth;
  animation: AnimationLabTwinTagIconAnimation;
  presetId: AnimationLabTwinTagPresetId;
  glyphStyle: AnimationLabTwinTagIconGlyphStyle;
  placement?: AnimationLabTwinTagIconPlacement;
  compact?: boolean;
  spinDurationS?: number;
}) {
  const Icon = ICON_BY_ID[props.iconId];
  const size = iconSizePx(props.presetId, props.compact);
  const iconClass = twinTagHealthIconClass(props.health);
  const placement = props.placement ?? "leading";

  const style = useMemo(() => {
    if (props.animation !== "spin") {
      return undefined;
    }
    const duration =
      typeof props.spinDurationS === "number" && Number.isFinite(props.spinDurationS)
        ? props.spinDurationS
        : 2.2;
    return { ["--twin-icon-spin-duration" as string]: `${duration}s` };
  }, [props.animation, props.spinDurationS]);

  const glyph =
    props.glyphStyle === "hud" ? (
      <AnimationLabTwinTagHudGlyph iconId={props.iconId} size={size} className={iconClass} />
    ) : (
      <Icon
        className={twMerge("opacity-95", iconClass)}
        size={size}
        strokeWidth={props.presetId === "high-contrast" ? 2.25 : 1.75}
      />
    );

  return (
    <span
      className={twMerge(
        "animation-lab-twin-tag-icon inline-flex shrink-0 items-center justify-center",
        ANIMATION_CLASS[props.animation],
        placement === "corner" && "animation-lab-twin-tag-icon--corner",
        props.presetId === "bracket-tactical" &&
          placement === "corner" &&
          "animation-lab-twin-tag-icon--corner-bracket",
      )}
      style={style}
      aria-hidden
    >
      <span
        className={twMerge(
          "inline-flex items-center justify-center",
          props.glyphStyle === "hud" && props.animation === "spin" && "animation-lab-twin-tag-icon__spin-inner",
          props.glyphStyle === "hud" && props.animation === "sweep" && "animation-lab-twin-tag-icon__sweep-inner",
        )}
      >
        {glyph}
      </span>
    </span>
  );
}
